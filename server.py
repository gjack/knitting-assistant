import asyncio
import json

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import chat_engine
from asr import handle_listening
from config import LIBRARY_DIR, client, TTS_MODEL, get_default_voice_id
from routes import router
from session import SessionState, send_state, send_error

app = FastAPI(title="Knitting Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIBRARY_DIR.mkdir(exist_ok=True)

app.include_router(router)


# ---------------------------------------------------------------------------
# WebSocket orchestration
# ---------------------------------------------------------------------------


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    state = SessionState()

    await ws.send_json({"type": "ready"})
    await send_state(ws, state, "idle")

    try:
        while True:
            message = await ws.receive()

            if message["type"] == "websocket.disconnect":
                break

            if message.get("text") is not None:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue
                await handle_control_message(ws, state, data)

            # Stray binary frames outside an active listening session are ignored.

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "stage": "general", "message": str(e)})
        except Exception:
            pass


async def handle_control_message(ws: WebSocket, state: SessionState, data: dict):
    msg_type = data.get("type")

    if msg_type == "set_pattern":
        state.pattern_id = data.get("pattern_id") or None

    elif msg_type == "start_listening":
        if state.status != "idle":
            return
        if not state.pattern_id:
            await send_error(ws, state, "asr", "No active pattern selected.")
            return
        await handle_listening(ws, state)

    elif msg_type == "send_message":
        if state.status != "idle":
            return
        text = " ".join((data.get("text") or "").split())
        if not text or not state.pattern_id:
            return
        await handle_turn(ws, state, text)

    elif msg_type == "stop_speaking":
        state.cancel_speaking = True
        if state.status == "speaking":
            state.active_audio = False
            await send_state(ws, state, "idle")

    elif msg_type == "playback_finished":
        state.active_audio = False
        if state.status == "speaking":
            await send_state(ws, state, "idle")


async def handle_turn(ws: WebSocket, state: SessionState, user_text: str):
    """chat_engine.chat() -> TTS -> audio, for one voice (or voice-reviewed) turn.

    Shares the same ChatEngine and per-pattern history as the REST chat
    endpoint, so voice and typed messages land in the same conversation.
    """
    await send_state(ws, state, "thinking")
    state.cancel_speaking = False

    try:
        reply = await asyncio.to_thread(chat_engine.chat, state.pattern_id, user_text)
    except FileNotFoundError:
        await send_error(ws, state, "llm", "That pattern no longer exists.")
        return
    except Exception as e:
        await send_error(ws, state, "llm", f"I couldn't generate a response: {e}")
        return

    # chat_engine.chat() already persisted both turns to document.json -- these
    # are just a live push so the frontend can render the turn immediately.
    await ws.send_json({"type": "message", "role": "user", "content": user_text})
    await ws.send_json({"type": "message", "role": "assistant", "content": reply})

    await send_state(ws, state, "speaking")
    state.active_audio = True

    try:
        voice_id = await asyncio.to_thread(get_default_voice_id)
        tts_kwargs = {"model": TTS_MODEL, "input": reply, "response_format": "mp3"}
        if voice_id:
            tts_kwargs["voice_id"] = voice_id
        tts_response = await asyncio.to_thread(client.audio.speech.complete, **tts_kwargs)
    except Exception as e:
        state.active_audio = False
        await send_error(ws, state, "tts", f"I couldn't generate speech: {e}")
        return

    if state.cancel_speaking:
        state.active_audio = False
        state.cancel_speaking = False
        await send_state(ws, state, "idle")
        return

    await ws.send_json({"type": "audio", "data": tts_response.audio_data, "format": "mp3"})
    # state remains "speaking" until the client reports playback_finished / stop_speaking


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8765)

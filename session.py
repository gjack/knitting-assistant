"""
Per-connection voice session state and small WebSocket message helpers.
"""

import time
from dataclasses import dataclass
from typing import Optional

from fastapi import WebSocket


@dataclass
class SessionState:
    status: str = "idle"  # idle | listening | transcribing | thinking | speaking | error
    pattern_id: Optional[str] = None
    pending_user_text: str = ""
    active_asr_session: bool = False
    active_audio: bool = False
    cancel_speaking: bool = False


async def send_state(ws: WebSocket, state: SessionState, new_status: str):
    state.status = new_status
    await ws.send_json({"type": "state", "state": new_status})


async def send_error(ws: WebSocket, state: SessionState, stage: str, message: str):
    await ws.send_json({"type": "error", "stage": stage, "message": message})
    await send_state(ws, state, "idle")


async def send_debug(ws: WebSocket, event: str, **data):
    await ws.send_json({"type": "debug", "event": event, "data": data, "ts": time.time()})

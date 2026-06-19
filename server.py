import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from config import LIBRARY_DIR
from routes import router

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


@app.websocket("/ws")
async def websocket_placeholder(ws: WebSocket):
    # Stub — replaced with full voice session handler in phase 4
    await ws.accept()
    try:
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break
    except Exception:
        pass


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8765)

import asyncio
import json
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse

from pydantic import BaseModel

from config import LIBRARY_DIR
from pattern_processor import process_pdf
from library_index import index_pattern, delete_pattern_index, search_library
import chat_engine

router = APIRouter(prefix="/api")


@router.post("/upload")
async def upload_pattern(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    doc = await process_pdf(pdf_bytes, file.filename)

    title = doc.get("metadata", {}).get("title") or doc.get("filename") or "Unknown"
    abbreviations = doc.get("metadata", {}).get("abbreviations") or []
    await asyncio.to_thread(
        index_pattern, doc["pattern_id"], title, doc["pattern_document"], abbreviations
    )

    return JSONResponse(content=doc)


@router.get("/patterns")
async def list_patterns():
    if not LIBRARY_DIR.exists():
        return []
    patterns = []
    for pattern_dir in sorted(LIBRARY_DIR.iterdir()):
        doc_path = pattern_dir / "document.json"
        if not doc_path.exists():
            continue
        try:
            doc = json.loads(doc_path.read_text())
            patterns.append(
                {
                    "pattern_id": doc.get("pattern_id", pattern_dir.name),
                    "title": doc.get("metadata", {}).get("title") or doc.get("filename") or "Unknown",
                    "upload_date": doc.get("upload_date"),
                    "has_charts": bool(doc.get("chart_images")),
                }
            )
        except Exception:
            continue
    return patterns


@router.get("/patterns/{pattern_id}")
async def get_pattern(pattern_id: str):
    doc_path = LIBRARY_DIR / pattern_id / "document.json"
    if not doc_path.exists():
        raise HTTPException(status_code=404, detail="Pattern not found.")
    doc = json.loads(doc_path.read_text())
    return JSONResponse(content=doc)


@router.delete("/patterns/{pattern_id}")
async def delete_pattern(pattern_id: str):
    pattern_dir = LIBRARY_DIR / pattern_id
    if not pattern_dir.exists():
        raise HTTPException(status_code=404, detail="Pattern not found.")
    shutil.rmtree(pattern_dir)
    await asyncio.to_thread(delete_pattern_index, pattern_id)
    return {"status": "deleted", "pattern_id": pattern_id}


class ChatRequest(BaseModel):
    message: str


class LibraryChatRequest(BaseModel):
    message: str
    history: Optional[list[dict]] = None


@router.get("/patterns/{pattern_id}/chat")
async def get_chat_history(pattern_id: str):
    return chat_engine.get_history(pattern_id)


@router.post("/patterns/{pattern_id}/chat")
async def send_chat_message(pattern_id: str, body: ChatRequest):
    doc_path = LIBRARY_DIR / pattern_id / "document.json"
    if not doc_path.exists():
        raise HTTPException(status_code=404, detail="Pattern not found.")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    reply = await asyncio.to_thread(chat_engine.chat, pattern_id, body.message)
    return {"reply": reply}


@router.delete("/patterns/{pattern_id}/chat")
async def clear_chat_history(pattern_id: str):
    doc_path = LIBRARY_DIR / pattern_id / "document.json"
    if not doc_path.exists():
        raise HTTPException(status_code=404, detail="Pattern not found.")
    await asyncio.to_thread(chat_engine.clear_history, pattern_id)
    return {"status": "cleared"}


@router.get("/search")
async def search_patterns(
    q: str = Query(..., description="Natural-language search query"),
    n: int = Query(5, ge=1, le=20),
    pattern_id: Optional[str] = Query(None),
):
    """Search the library with a natural-language query.
    Optionally restrict to a single pattern_id."""
    results = await asyncio.to_thread(search_library, q, n, pattern_id)
    return results


@router.post("/library/chat")
async def ask_library(body: LibraryChatRequest):
    """RAG Q&A across the whole library, for when no pattern is active."""
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    result = await asyncio.to_thread(chat_engine.ask_library, body.message, body.history)
    return result

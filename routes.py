import json
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from config import LIBRARY_DIR
from pattern_processor import process_pdf

router = APIRouter(prefix="/api")


@router.post("/upload")
async def upload_pattern(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    doc = await process_pdf(pdf_bytes, file.filename)
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
    return {"status": "deleted", "pattern_id": pattern_id}

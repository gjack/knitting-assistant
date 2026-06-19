import asyncio
import base64
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from mistralai.client.models import DocumentURLChunk

from config import (
    client,
    OCR_MODEL,
    VISION_MODEL,
    CHAT_MODEL,
    LIBRARY_DIR,
    METADATA_SYSTEM_PROMPT,
)


def _to_data_url(b64: str) -> str:
    if b64.startswith("data:"):
        return b64
    return f"data:image/jpeg;base64,{b64}"


def _to_raw_b64(b64: str) -> str:
    if b64.startswith("data:"):
        return b64.split(",", 1)[1]
    return b64


def _extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(b.text for b in content if hasattr(b, "text"))
    return str(content)


def _ocr_pdf_sync(pdf_b64: str) -> object:
    return client.ocr.process(
        model=OCR_MODEL,
        document=DocumentURLChunk(document_url=f"data:application/pdf;base64,{pdf_b64}"),
        include_image_base64=True,
    )


def _extract_metadata_sync(raw_text: str) -> dict:
    for _ in range(2):
        resp = client.chat.complete(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": METADATA_SYSTEM_PROMPT},
                {"role": "user", "content": raw_text},
            ],
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content
        text = _extract_text(content)
        if text.strip():
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                pass
    return {
        "title": "Unknown Pattern",
        "sizes": [],
        "gauge": None,
        "needles": [],
        "yarn": None,
        "abbreviations": [],
        "sections": [],
    }


def _interpret_chart_sync(chart_image, title: str, legend_text: str) -> dict:
    prompt = (
        f"This image is from the knitting pattern '{title}'. "
        f"Knitting PDFs contain several types of images — identify which this is before describing it:\n\n"
        f"- SCHEMATIC: a technical line drawing of a garment piece with labeled measurements "
        f"(letters like A, B, C pointing to dimensions). If so, list every labeled measurement "
        f"exactly as shown (e.g. 'A = 10 (11.5, 13)\"') and describe the garment piece shape.\n"
        f"- STITCH CHART: a grid of symbols representing individual stitches row by row. "
        f"If so, use the pattern legend ({legend_text}) to describe the stitch pattern, "
        f"any repeats, and a row-by-row reading where legible.\n"
        f"- OTHER: a photo, decorative image, or something else — describe what you see.\n\n"
        f"Start your response with the image type (SCHEMATIC / STITCH CHART / OTHER), "
        f"then give the description. If you cannot confidently read the content, say so rather than guessing."
    )
    try:
        resp = client.chat.complete(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": _to_data_url(chart_image.image_base64),
                        },
                    ],
                }
            ],
            max_tokens=600,
        )
        description = _extract_text(resp.choices[0].message.content)
    except Exception as e:
        description = f"Chart interpretation failed: {e}"

    return {
        "id": chart_image.id,
        "base64": _to_raw_b64(chart_image.image_base64),
        "description": description,
        "bounding_box": {
            "top_left_x": chart_image.top_left_x,
            "top_left_y": chart_image.top_left_y,
            "bottom_right_x": chart_image.bottom_right_x,
            "bottom_right_y": chart_image.bottom_right_y,
        },
    }


async def process_pdf(pdf_bytes: bytes, filename: str) -> dict:
    pattern_id = str(uuid.uuid4())
    upload_date = datetime.now(timezone.utc).isoformat()

    # OCR
    pdf_b64 = base64.b64encode(pdf_bytes).decode()
    ocr_response = await asyncio.to_thread(_ocr_pdf_sync, pdf_b64)

    raw_text = "\n\n".join(page.markdown for page in ocr_response.pages)
    chart_images_raw = [
        img
        for page in ocr_response.pages
        for img in (page.images or [])
        if img.image_base64
    ]

    # Metadata extraction
    metadata = await asyncio.to_thread(_extract_metadata_sync, raw_text)
    title = metadata.get("title") or "Unknown Pattern"

    abbreviations = metadata.get("abbreviations") or []
    legend_text = "; ".join(
        f"{a.get('symbol', '')}={a.get('meaning', '')}" for a in abbreviations
    ) if abbreviations else "No legend provided"

    # Chart interpretation (parallel)
    chart_results = []
    if chart_images_raw:
        tasks = [
            asyncio.to_thread(_interpret_chart_sync, img, title, legend_text)
            for img in chart_images_raw
        ]
        chart_results = await asyncio.gather(*tasks)

    chart_descriptions_text = ""
    if chart_results:
        parts = [
            f"### Chart {i + 1}\n{c['description']}"
            for i, c in enumerate(chart_results)
        ]
        chart_descriptions_text = "\n\n".join(parts)

    pattern_document = raw_text
    if chart_descriptions_text:
        pattern_document += "\n\n## Chart Descriptions\n" + chart_descriptions_text

    # Persist to disk
    pattern_dir = LIBRARY_DIR / pattern_id
    images_dir = pattern_dir / "images"
    pattern_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(exist_ok=True)

    (pattern_dir / "pattern.pdf").write_bytes(pdf_bytes)

    for chart in chart_results:
        img_bytes = base64.b64decode(chart["base64"])
        (images_dir / f"{chart['id']}.jpg").write_bytes(img_bytes)

    doc = {
        "pattern_id": pattern_id,
        "filename": filename,
        "upload_date": upload_date,
        "raw_text": raw_text,
        "metadata": metadata,
        "chart_images": chart_results,
        "pattern_document": pattern_document,
        "chat_history": [],
    }

    (pattern_dir / "document.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=2)
    )

    return doc

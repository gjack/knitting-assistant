import asyncio
import base64
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import fitz
from mistralai.client.models import DocumentURLChunk

from config import (
    client,
    OCR_MODEL,
    VISION_MODEL,
    CHAT_MODEL,
    LIBRARY_DIR,
    METADATA_SYSTEM_PROMPT,
)

CHART_HEADING_RE = re.compile(r"(?m)^#{0,6}\s*(.*?Chart\s+\d+[a-zA-Z]?)\s*$")
GARBLED_TABLE_PLACEHOLDER = (
    "*(Chart grid could not be transcribed as text — see the rendered chart "
    "image in the Charts section above.)*"
)


def _is_garbled_chart_table(lines: list[str]) -> bool:
    """A real chart grid is almost entirely single symbols/blanks, not prose."""
    cells = []
    for line in lines:
        stripped = line.strip()
        if re.fullmatch(r"\|?\s*-{2,}\s*(\|\s*-{2,}\s*)*\|?", stripped):
            continue  # markdown separator row
        cells.extend(c.strip() for c in stripped.strip("|").split("|"))
    if len(cells) < 8:
        return False
    symbolish = sum(1 for c in cells if c == "" or len(c) <= 2)
    return symbolish / len(cells) > 0.85


def _clean_and_detect_broken_charts(page_idx: int, markdown: str) -> tuple[str, list[str]]:
    """Find chart headings whose content OCR mangled (garbled table) or dropped
    entirely (no image, no table), and strip any garbled table out of the text."""
    headings = list(CHART_HEADING_RE.finditer(markdown))
    broken_names = []
    cleaned = markdown
    for i, h in enumerate(headings):
        start = h.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(markdown)
        section = markdown[start:end]
        if "![" in section:
            continue  # OCR already produced a real image reference here
        name = h.group(1).lstrip("# ").strip()
        table_lines = [l for l in section.split("\n") if l.strip().startswith("|")]
        if table_lines and _is_garbled_chart_table(table_lines):
            broken_names.append(name)
            original_table = "\n".join(table_lines)
            cleaned = cleaned.replace(original_table, GARBLED_TABLE_PLACEHOLDER, 1)
        elif not table_lines:
            broken_names.append(name)
    return cleaned, broken_names


def _render_pdf_page_b64(pdf_bytes: bytes, page_idx: int, zoom: float = 3.0) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page = doc.load_page(page_idx)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        return base64.b64encode(pix.tobytes("jpeg")).decode()
    finally:
        doc.close()


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
        f"any repeats, and a row-by-row reading where legible. Describe rows in words "
        f"(e.g. 'K1, YO, K2tog, repeat to end') — do not reproduce the grid itself as "
        f"ASCII art, a table, or a row of symbols; that is not legible to the reader.\n"
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


def _interpret_fallback_page_sync(
    pdf_bytes: bytes, page_idx: int, chart_names: list[str], title: str, legend_text: str
) -> dict:
    """Render a whole page ourselves and interpret it, for charts OCR's own
    image extraction failed to crop cleanly (mangled-as-table or dropped)."""
    page_b64 = _render_pdf_page_b64(pdf_bytes, page_idx)
    names_text = ", ".join(chart_names)
    plural = len(chart_names) > 1
    prompt = (
        f"This is a full page render from the knitting pattern '{title}'. "
        f"Automated text extraction failed to produce a clean chart image for: {names_text}. "
        f"Locate {'these charts' if plural else 'this chart'} on the page. "
        + (
            f"There are {len(chart_names)} separate named charts to cover: {names_text}. "
            f"Give each one its own '### {{name}}' section in full — do not skip or "
            f"summarize any of them, and do not let one chart's description crowd out "
            f"the others. "
            if plural
            else ""
        )
        + f"For {'each chart' if plural else 'it'}, describe it as a STITCH CHART: "
        f"use the pattern legend ({legend_text}) to describe the stitch pattern, any repeats, "
        f"and a row-by-row reading where legible. Describe rows in words "
        f"(e.g. 'K1, YO, K2tog, repeat to end') — do not reproduce the grid itself as "
        f"ASCII art, a table, or a row of symbols; that is not legible to the reader. "
        f"Ignore unrelated page content (titles, page numbers, other sections)."
    )
    try:
        resp = client.chat.complete(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": _to_data_url(page_b64)},
                    ],
                }
            ],
            max_tokens=600 * max(len(chart_names), 1),
        )
        description = _extract_text(resp.choices[0].message.content)
    except Exception as e:
        description = f"Chart interpretation failed: {e}"

    return {
        "id": f"page-{page_idx}-fallback",
        "base64": page_b64,
        "description": description,
        "bounding_box": None,
    }


async def process_pdf(pdf_bytes: bytes, filename: str) -> dict:
    pattern_id = str(uuid.uuid4())
    upload_date = datetime.now(timezone.utc).isoformat()

    # OCR
    pdf_b64 = base64.b64encode(pdf_bytes).decode()
    ocr_response = await asyncio.to_thread(_ocr_pdf_sync, pdf_b64)

    page_markdowns = []
    broken_charts_by_page = {}
    for page_idx, page in enumerate(ocr_response.pages):
        cleaned, broken_names = _clean_and_detect_broken_charts(page_idx, page.markdown)
        page_markdowns.append(cleaned)
        if broken_names:
            broken_charts_by_page[page_idx] = broken_names

    raw_text = "\n\n".join(page_markdowns)

    # Items to run through the vision model: real cropped images, in page
    # order, plus one fallback (whole-page render) per page where OCR's own
    # image extraction mangled or dropped a chart.
    items = [
        {"kind": "real", "page_idx": page_idx, "image": img}
        for page_idx, page in enumerate(ocr_response.pages)
        for img in (page.images or [])
        if img.image_base64
    ]
    for page_idx, names in sorted(broken_charts_by_page.items()):
        items.append({"kind": "fallback", "page_idx": page_idx, "names": names})
    items.sort(key=lambda it: it["page_idx"])

    # Metadata extraction
    metadata = await asyncio.to_thread(_extract_metadata_sync, raw_text)
    title = metadata.get("title") or "Unknown Pattern"

    abbreviations = metadata.get("abbreviations") or []
    legend_text = "; ".join(
        f"{a.get('symbol', '')}={a.get('meaning', '')}" for a in abbreviations
    ) if abbreviations else "No legend provided"

    # Chart interpretation (parallel)
    chart_results = []
    if items:
        def _interpret_item_sync(item):
            if item["kind"] == "real":
                return _interpret_chart_sync(item["image"], title, legend_text)
            return _interpret_fallback_page_sync(
                pdf_bytes, item["page_idx"], item["names"], title, legend_text
            )

        tasks = [asyncio.to_thread(_interpret_item_sync, item) for item in items]
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

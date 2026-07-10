import re
import uuid
from typing import Optional

import chromadb

from config import client, EMBED_MODEL, CHROMA_DIR

CHUNK_SIZE = 1500
CHUNK_OVERLAP = 150
EMBED_BATCH = 32

_chroma_client: Optional[chromadb.PersistentClient] = None
_collection = None


def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _chroma_client.get_or_create_collection(
            name="patterns",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

HEADER_RE = re.compile(r"(?m)^(#{1,6})\s+(.+)$")


def _chunk_by_headers(text: str, title: str) -> list[dict]:
    """Split on markdown headers; return list of {text, section_type}."""
    boundaries = [m.start() for m in HEADER_RE.finditer(text)]
    if not boundaries:
        return [{"text": text, "section_type": "body"}]

    chunks = []
    for i, start in enumerate(boundaries):
        end = boundaries[i + 1] if i + 1 < len(boundaries) else len(text)
        section_text = text[start:end].strip()
        if not section_text:
            continue
        header_match = HEADER_RE.match(section_text)
        section_type = header_match.group(2).strip().lower() if header_match else "body"
        # Oversized sections: split with overlap
        if len(section_text) > CHUNK_SIZE * 1.5:
            sub = _fixed_window(section_text, section_type)
            chunks.extend(sub)
        else:
            chunks.append({"text": f"{title}\n\n{section_text}", "section_type": section_type})
    return chunks


def _fixed_window(text: str, section_type: str) -> list[dict]:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunks.append({"text": text[start:end], "section_type": section_type})
        if end == len(text):
            break
        start = end - CHUNK_OVERLAP
    return chunks


def _chunk_pattern_document(pattern_document: str, title: str) -> list[dict]:
    # If there are headers use them; otherwise fall back to fixed windows
    if HEADER_RE.search(pattern_document):
        return _chunk_by_headers(pattern_document, title)
    return _fixed_window(pattern_document, "body")


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def _embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed in batches; return list of embedding vectors."""
    all_embeddings = []
    for i in range(0, len(texts), EMBED_BATCH):
        batch = texts[i : i + EMBED_BATCH]
        response = client.embeddings.create(model=EMBED_MODEL, inputs=batch)
        all_embeddings.extend(item.embedding for item in response.data)
    return all_embeddings


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _abbreviation_chunks(pattern_title: str, abbreviations: list[dict]) -> list[dict]:
    """One chunk per abbreviation entry for precise symbol lookups."""
    chunks = []
    for a in abbreviations:
        symbol = a.get("symbol", "").strip()
        meaning = a.get("meaning", "").strip()
        if not symbol or not meaning:
            continue
        chunks.append({
            "text": f"{pattern_title}\n\nAbbreviation: **{symbol}** — {meaning}",
            "section_type": "abbreviation",
        })
    return chunks


def _materials_chunk(pattern_title: str, metadata: dict) -> Optional[dict]:
    """A single dense chunk of sizes/gauge/needles/yarn from the extracted
    metadata, not the raw OCR text. Needed because materials info in the raw
    text lands under whatever header the PDF happens to use (or none), and
    otherwise only competes for retrieval against noisier chunks — e.g. a
    per-abbreviation chunk like "YO — yarn over" also contains the word
    "yarn" and embeds close enough to crowd out the real yardage/gauge chunk
    in a query like "which pattern can I knit with 400yds of fingering?"."""
    def _fmt(v):
        if isinstance(v, list):
            return ", ".join(str(x) for x in v if x)
        return str(v) if v else ""

    parts = []
    sizes = _fmt(metadata.get("sizes"))
    gauge = _fmt(metadata.get("gauge"))
    needles = _fmt(metadata.get("needles"))
    yarn = _fmt(metadata.get("yarn"))
    if sizes:
        parts.append(f"Sizes: {sizes}.")
    if gauge:
        parts.append(f"Gauge: {gauge}.")
    if needles:
        parts.append(f"Needles: {needles}.")
    if yarn:
        parts.append(f"Yarn: {yarn}.")

    if not parts:
        return None

    return {
        "text": f"{pattern_title}\n\nMaterials — {' '.join(parts)}",
        "section_type": "materials",
    }


def index_pattern(
    pattern_id: str,
    pattern_title: str,
    pattern_document: str,
    metadata: Optional[dict] = None,
) -> int:
    """Chunk, embed, and add a pattern to the Chroma collection.
    Returns the number of chunks indexed."""
    collection = _get_collection()

    try:
        collection.delete(where={"pattern_id": pattern_id})
    except Exception:
        pass

    chunks = _chunk_pattern_document(pattern_document, pattern_title)
    metadata = metadata or {}

    # Add a dedicated materials chunk and per-abbreviation chunks on top of
    # the section chunks, built from the structured metadata rather than
    # relying on however the raw text happened to be chunked.
    materials = _materials_chunk(pattern_title, metadata)
    if materials:
        chunks.append(materials)

    abbreviations = metadata.get("abbreviations")
    if abbreviations:
        chunks.extend(_abbreviation_chunks(pattern_title, abbreviations))

    if not chunks:
        return 0

    texts = [c["text"] for c in chunks]
    embeddings = _embed_texts(texts)

    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [
        {
            "pattern_id": pattern_id,
            "pattern_title": pattern_title,
            "section_type": c["section_type"],
        }
        for c in chunks
    ]

    collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    return len(chunks)


def get_materials_chunks() -> list[dict]:
    """Return every pattern's materials chunk directly, bypassing semantic
    ranking. Cross-pattern comparison questions (yardage on hand, gauge,
    needle size) need every pattern's materials on hand, not just whichever
    happen to land in a semantic top-k for one query's embedding — at
    personal-library scale (dozens of patterns, not thousands) it's cheap
    to just include them all rather than leave coverage to embedding luck.
    """
    collection = _get_collection()
    if collection.count() == 0:
        return []

    results = collection.get(where={"section_type": "materials"})
    hits = []
    for doc, meta in zip(results["documents"], results["metadatas"]):
        hits.append(
            {
                "pattern_id": meta.get("pattern_id"),
                "pattern_title": meta.get("pattern_title"),
                "section_type": "materials",
                "text": doc,
                "distance": None,
            }
        )
    return hits


def delete_pattern_index(pattern_id: str) -> None:
    """Remove all Chroma entries for a pattern."""
    collection = _get_collection()
    collection.delete(where={"pattern_id": pattern_id})


def search_library(query: str, n_results: int = 5, pattern_id: Optional[str] = None) -> list[dict]:
    """Embed query and return top matching chunks from the library.

    If pattern_id is given, restrict search to that pattern.
    Returns list of {pattern_id, pattern_title, section_type, text, distance}.
    """
    collection = _get_collection()
    if collection.count() == 0:
        return []

    query_embedding = _embed_texts([query])[0]

    where = {"pattern_id": pattern_id} if pattern_id else None
    kwargs = dict(query_embeddings=[query_embedding], n_results=min(n_results, collection.count()))
    if where:
        kwargs["where"] = where

    results = collection.query(**kwargs)

    hits = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        distance = results["distances"][0][i] if results.get("distances") else None
        hits.append(
            {
                "pattern_id": meta.get("pattern_id"),
                "pattern_title": meta.get("pattern_title"),
                "section_type": meta.get("section_type"),
                "text": doc,
                "distance": distance,
            }
        )
    return hits

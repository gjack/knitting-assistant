# Knitting Pattern Assistant

A web app that helps knitters understand and work with PDF knitting patterns. Upload a pattern, get the text extracted and charts interpreted, then ask questions about it by typing or by voice.

## What it does

- **Upload a PDF pattern** — Mistral OCR extracts the text and any embedded images (stitch charts, schematics)
- **Interpret charts automatically** — a vision model reads each chart using the pattern's own legend and gives a row-by-row stitch sequence for every numbered row
- **Ask questions by typing** — chat with the active pattern: symbol meanings, specific row sequences, stitch counts, sizing, materials, yarn substitution. The full pattern document is the context on every message
- **Browse your library** — every processed pattern is saved locally and indexed in ChromaDB; reopen any pattern without re-uploading
- **Search across patterns** — natural-language search over all indexed patterns via `GET /api/search`
- **Voice interaction** *(coming soon)* — push-to-talk STT + TTS readback

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Python + FastAPI (port 8765) |
| OCR | Mistral OCR (`mistral-ocr-latest`) |
| Vision / Chat | `mistral-small-latest` |
| Embeddings | `mistral-embed` |
| Vector store | ChromaDB (local, persistent) |
| Voice STT | Voxtral Realtime *(phase 4)* |
| Voice TTS | Voxtral TTS *(phase 4)* |

## Project status

| Phase | Feature | Status |
|---|---|---|
| 1 | PDF upload → OCR → metadata extraction → chart interpretation → viewer | ✅ Done |
| 2 | Text chat over the active pattern (full-context Q&A, history, guardrails) | ✅ Done |
| 3a | ChromaDB library indexing + `/api/search` endpoint | ✅ Done |
| 3b | "Ask my library" — RAG over all patterns when none is active | 🔜 Planned |
| 4 | Voice interaction (push-to-talk STT + TTS readback) | 🔜 Planned |

## Setup

See [usageInstructions.md](usageInstructions.md) for full setup and run instructions.

## File structure

```
knitting-assistant/
├── server.py              # FastAPI app + WebSocket stub
├── routes.py              # REST endpoints (upload, library CRUD, chat, search)
├── pattern_processor.py   # OCR + metadata + chart interpretation pipeline
├── chat_engine.py         # LLM chat over active pattern, history, injection filter
├── library_index.py       # Chroma chunking, embedding, and search
├── config.py              # Mistral client, model IDs, system prompts, constants
├── frontend/              # React + Vite app
│   └── src/App.jsx        # Upload, pattern viewer, library sidebar, chat panel
├── library/               # On-disk pattern storage (created at runtime)
├── chroma_db/             # ChromaDB persistent storage (created at runtime)
├── requirements.txt
└── .env.example
```

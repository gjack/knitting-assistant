# Knitting Pattern Assistant

A web app that helps knitters understand and work with PDF knitting patterns. Upload a pattern, get the text extracted and charts interpreted, then ask questions about it by typing or by voice.

## What it does

- **Upload a PDF pattern** — Mistral OCR extracts the text and any embedded images (stitch charts, schematics)
- **Interpret charts automatically** — a vision model reads each chart/schematic using the pattern's own legend
- **Browse your library** — every processed pattern is saved locally; reopen any pattern without re-uploading
- **Ask questions** *(coming soon)* — chat with the pattern by typing or by voice (push-to-talk)
- **Search across patterns** *(coming soon)* — "which of my patterns use a provisional cast-on?"

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Python + FastAPI (port 8765) |
| OCR | Mistral OCR (`mistral-ocr-latest`) |
| Vision / Chat | `mistral-small-latest` |
| Embeddings | `mistral-embed` |
| Vector store | ChromaDB (local, persistent) |
| Voice STT | Voxtral Realtime |
| Voice TTS | Voxtral TTS |

## Project status

| Phase | Feature | Status |
|---|---|---|
| 1 | PDF upload → OCR → metadata extraction → chart interpretation → viewer | ✅ Done |
| 2 | Text chat over the active pattern (full-context Q&A) | 🔜 Next |
| 3 | ChromaDB library index + cross-pattern search | 🔜 Planned |
| 4 | Voice interaction (push-to-talk STT + TTS) | 🔜 Planned |

## Setup

See [usageInstructions.md](usageInstructions.md) for full setup and run instructions.

## File structure

```
knitting-assistant/
├── server.py              # FastAPI app + WebSocket stub
├── routes.py              # REST endpoints (upload, library CRUD)
├── pattern_processor.py   # OCR + metadata + chart interpretation pipeline
├── config.py              # Mistral client, model IDs, constants
├── frontend/              # React + Vite app
│   └── src/App.jsx        # Main UI (upload, viewer, library sidebar)
├── library/               # On-disk pattern storage (created at runtime)
├── chroma_db/             # ChromaDB storage (created at runtime, phase 3)
├── requirements.txt
└── .env.example
```

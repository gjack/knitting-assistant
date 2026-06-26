# Usage Instructions

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Mistral API key (get one at [console.mistral.ai](https://console.mistral.ai))

## First-time setup

### 1. Clone / enter the project directory

```bash
cd knitting-assistant
```

### 2. Create and activate a Python virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure your API key

```bash
cp .env.example .env
```

Open `.env` and set your key:

```
MISTRAL_API_KEY=your-actual-key-here
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Running the app

You need two terminals — one for the backend, one for the frontend.

**Terminal 1 — Backend:**

```bash
source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8765
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

> Use `localhost`, not `127.0.0.1` — browsers require `localhost` (or HTTPS) to allow microphone access for the voice features coming in phase 4.

## Using the app

### Uploading a pattern

1. Click **+ Upload Pattern** in the sidebar (or drag a PDF onto the drop zone)
2. Select a knitting pattern PDF
3. Wait for processing — OCR, metadata extraction, and chart interpretation all run in sequence; patterns with many charts take longer
4. The pattern opens automatically in the viewer when done, and is indexed in ChromaDB for library search

### Pattern viewer

- **Pattern Info** — sizes, gauge, needles, yarn extracted from the pattern text
- **Abbreviations & Legend** — all symbol/abbreviation definitions extracted from the pattern, including inline chart legends
- **Charts** — each image from the PDF with a vision-generated description; stitch charts include a row-by-row stitch sequence for every numbered row; schematics include labeled measurements
- **Pattern Text** — the full OCR'd text rendered as markdown

### Chat

The chat panel on the right side of the viewer lets you ask questions about the active pattern.

- Type a question and press **Enter** (or click **Send**) — Shift+Enter adds a newline without sending
- The full pattern document is sent as context with every message, so the assistant can cross-reference the legend, a chart row, and the written instructions in a single answer
- Questions the assistant can answer: symbol meanings, stitch sequences for specific chart rows, stitch counts, sizing details, materials, yarn substitution, blocking, and general knitting techniques relevant to the pattern
- The assistant will decline questions unrelated to knitting
- Conversation history is saved per pattern and restored when you reopen a pattern from the library
- Click **Clear** in the chat header to erase the history for the active pattern

### Library search (API)

Patterns are indexed in ChromaDB on upload. You can search across all indexed patterns with a natural-language query:

```
GET /api/search?q=provisional+cast-on&n=5
```

Returns the top matching chunks with `pattern_id`, `pattern_title`, `section_type`, and the matching text.

### Library

- Every processed pattern is saved to `library/` on disk
- Click any pattern in the left sidebar to reload it instantly (no reprocessing)
- Click **Delete** in the pattern header to remove it from the library and from the ChromaDB index

## Troubleshooting

**Upload returns a 500 error**
- Check that `MISTRAL_API_KEY` is set correctly in `.env` and that uvicorn was restarted after editing the file
- Check the uvicorn terminal for the full traceback

**Charts show "interpretation failed"**
- The vision model occasionally fails on very small or low-contrast images; this is noted in the description and doesn't affect text chat

**Chat says "I can only help with knitting-related questions" for a knitting question**
- The assistant has a keyword-based injection filter that may occasionally match an unusual phrasing. Rephrase the question more directly (e.g. "What is the stitch sequence for row 5?" instead of phrasing that includes words like "ignore" or "repeat")

**Browser can't connect to the backend**
- Make sure uvicorn is running on port 8765 and you opened the app at `http://localhost:5173` (not `127.0.0.1:5173`)

**`ModuleNotFoundError` on startup**
- Make sure the virtual environment is activated (`source .venv/bin/activate`) before running uvicorn

**Chat history not showing after reload**
- History is stored in `library/<pattern_id>/document.json`. If the file was manually edited or the pattern was re-uploaded (generating a new `pattern_id`), previous history will not carry over

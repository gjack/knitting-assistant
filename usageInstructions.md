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
4. The pattern opens automatically in the viewer when done

### Pattern viewer

- **Pattern Info** — sizes, gauge, needles, yarn extracted from the pattern text
- **Abbreviations & Legend** — symbol/abbreviation table extracted by the LLM
- **Charts** — each image from the PDF with a vision-generated description (stitch charts get a row-by-row reading; schematics get labeled measurements)
- **Pattern Text** — the full OCR'd text

### Library

- Every processed pattern is saved to `library/` on disk
- Click any pattern in the left sidebar to reload it instantly (no reprocessing)
- Click **Delete** in the pattern header to remove it from the library

## Troubleshooting

**Upload returns a 500 error**
- Check that `MISTRAL_API_KEY` is set correctly in `.env` and that uvicorn was restarted after editing the file
- Check the uvicorn terminal for the full traceback

**Charts show "interpretation failed"**
- The vision model occasionally fails on very small or low-contrast images; this is noted in the description and doesn't affect text chat

**Browser can't connect to the backend**
- Make sure uvicorn is running on port 8765 and you opened the app at `http://localhost:5173` (not `127.0.0.1:5173`)

**`ModuleNotFoundError` on startup**
- Make sure the virtual environment is activated (`source .venv/bin/activate`) before running uvicorn

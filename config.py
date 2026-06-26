import os
from pathlib import Path
from dotenv import load_dotenv
from mistralai.client import Mistral

load_dotenv()

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

OCR_MODEL = "mistral-ocr-latest"
VISION_MODEL = "mistral-small-latest"
CHAT_MODEL = "mistral-small-latest"
EMBED_MODEL = "mistral-embed"
TTS_MODEL = "voxtral-mini-tts-2603"
ASR_MODEL = "voxtral-mini-transcribe-realtime-2602"

LIBRARY_DIR = Path("library")
CHROMA_DIR = Path("chroma_db")

HISTORY_WINDOW = 10

CHAT_SYSTEM_PROMPT = """You are a knitting assistant. You help knitters understand and work with their patterns.
Answer questions using the provided pattern document. When something isn't covered by the pattern, say so rather than guessing or relying on generic knitting knowledge presented as pattern-specific fact.
For voice replies, keep answers concise and avoid reading out long blocks of text — point the user to the pattern viewer for verbatim row instructions.
You can explain symbol meanings, specific row instructions, stitch counts, sizing, and materials."""

METADATA_SYSTEM_PROMPT = """You are a knitting pattern parser. Extract the following fields as JSON:
- title (string)
- sizes (list of strings)
- gauge (string)
- needles (list of strings)
- yarn (string or list)
- abbreviations: capture EVERY symbol or abbreviation definition found anywhere in the pattern — the main Abbreviations or Legend section, any inline chart legends, and any stitch definition glossaries. Include standard abbreviations (k=knit, p=purl, etc.) only if they are explicitly defined in this pattern's own legend. Each entry: {symbol: string, meaning: string}.
- sections (list of section title strings)

If a field is not present in the pattern, use null or an empty list. Return only valid JSON."""

import json
from pathlib import Path

from config import client, CHAT_MODEL, CHAT_SYSTEM_PROMPT, HISTORY_WINDOW, LIBRARY_DIR


def _extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(b.text for b in content if hasattr(b, "text"))
    return str(content)


def _doc_path(pattern_id: str) -> Path:
    return LIBRARY_DIR / pattern_id / "document.json"


def get_history(pattern_id: str) -> list[dict]:
    path = _doc_path(pattern_id)
    if not path.exists():
        return []
    doc = json.loads(path.read_text())
    return doc.get("chat_history") or []


def chat(pattern_id: str, user_message: str) -> str:
    path = _doc_path(pattern_id)
    if not path.exists():
        raise FileNotFoundError(f"Pattern {pattern_id} not found")

    doc = json.loads(path.read_text())
    pattern_document = doc["pattern_document"]
    history = doc.get("chat_history") or []

    # Window to last N turns (each turn = one user + one assistant message)
    windowed = history[-(HISTORY_WINDOW * 2):]

    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": f"PATTERN:\n{pattern_document}"},
        *windowed,
        {"role": "user", "content": user_message},
    ]

    # Retry once on ThinkChunk-only empty responses
    reply = ""
    for _ in range(2):
        resp = client.chat.complete(
            model=CHAT_MODEL,
            messages=messages,
        )
        reply = _extract_text(resp.choices[0].message.content)
        if reply.strip():
            break

    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": reply})
    doc["chat_history"] = history
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2))

    return reply


def clear_history(pattern_id: str) -> None:
    path = _doc_path(pattern_id)
    if not path.exists():
        return
    doc = json.loads(path.read_text())
    doc["chat_history"] = []
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2))

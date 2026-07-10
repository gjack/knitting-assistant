import json
import re
from pathlib import Path
from typing import Optional

from config import (
    client,
    CHAT_MODEL,
    CHAT_SYSTEM_PROMPT,
    LIBRARY_CHAT_SYSTEM_PROMPT,
    HISTORY_WINDOW,
    LIBRARY_DIR,
    LIBRARY_RAG_K,
)
from library_index import search_library, get_materials_chunks

# ---------------------------------------------------------------------------
# Injection pre-filter
# ---------------------------------------------------------------------------

# Patterns that strongly suggest an injection attempt rather than a knitting
# question. Each tuple is (label, compiled_regex). A message matching any of
# these is rejected before reaching the LLM.
_INJECTION_PATTERNS = [
    # Instruction override
    ("override", re.compile(
        r"\b(ignore|disregard|forget|override|bypass|skip)\b.{0,40}"
        r"\b(instructions?|prompt|system|rules?|guidelines?|previous)\b",
        re.I | re.S,
    )),
    # Role-change / jailbreak
    ("role_change", re.compile(
        r"\b(you are now|act as|pretend( to be)?|roleplay|role.play|"
        r"jailbreak|dan\b|do anything now|unrestricted mode|developer mode|"
        r"maintenance mode|no restrictions?)\b",
        re.I,
    )),
    # System prompt disclosure
    ("disclosure", re.compile(
        r"\b(repeat|reveal|show|print|output|display|tell me|what (is|are))\b"
        r".{0,30}\b(system prompt|your instructions?|your rules?|your prompt)\b",
        re.I | re.S,
    )),
    # Prompt delimiter injection (trying to inject a fake system/assistant turn)
    ("delimiter", re.compile(
        r"(\[INST\]|<\|system\|>|<\|user\|>|<\|assistant\|>|### (system|assistant|instruction)|"
        r"<system>|</system>|<assistant>|</assistant>)",
        re.I,
    )),
    # Script / code injection (HTML, SQL, shell)
    ("script", re.compile(
        r"(<script|<iframe|<img[^>]+onerror|javascript:|"
        r"\bDROP\s+TABLE\b|\bSELECT\b.{0,20}\bFROM\b|"
        r"\$\(|`[^`]+`|\beval\s*\()",
        re.I,
    )),
]

_INJECTION_REPLY = (
    "I'm a knitting assistant and can only help with knitting-related questions. "
    "What would you like to know about your pattern?"
)

_LIBRARY_INJECTION_REPLY = (
    "I'm a knitting assistant and can only help with knitting-related questions. "
    "What would you like to know about your patterns?"
)


def _is_injection(text: str) -> bool:
    for _label, pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            return True
    return False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(b.text for b in content if hasattr(b, "text"))
    return str(content)


def _doc_path(pattern_id: str) -> Path:
    return LIBRARY_DIR / pattern_id / "document.json"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

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

    # Pre-filter: block obvious injection attempts without spending a model call
    if _is_injection(user_message):
        return _INJECTION_REPLY

    doc = json.loads(path.read_text())
    pattern_document = doc["pattern_document"]
    history = doc.get("chat_history") or []

    windowed = history[-(HISTORY_WINDOW * 2):]

    # Wrap the user message in XML tags so the model has a structural signal
    # separating its instructions from untrusted user content.
    framed_message = f"<user_question>{user_message}</user_question>"

    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": f"PATTERN:\n{pattern_document}"},
        *windowed,
        {"role": "user", "content": framed_message},
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


def ask_library(user_message: str, history: Optional[list[dict]] = None) -> dict:
    """RAG Q&A across the whole library, used when no pattern is active.

    Unlike `chat()`, there is no single pattern_document — instead the top-k
    matching chunks across all patterns are retrieved and cited by title.
    History is not persisted server-side; the caller passes back whatever
    conversation it wants included as context.
    """
    if _is_injection(user_message):
        return {"reply": _LIBRARY_INJECTION_REPLY, "sources": []}

    hits = search_library(user_message, n_results=LIBRARY_RAG_K)

    # Always fold in every pattern's materials chunk (sizes/gauge/needles/
    # yarn) alongside the semantic hits, so questions comparing yardage,
    # gauge, or needle size across the whole library aren't at the mercy of
    # whether a given pattern's materials happened to rank in the top-k.
    seen_pids = {h["pattern_id"] for h in hits}
    for m in get_materials_chunks():
        if m["pattern_id"] not in seen_pids:
            hits.append(m)
            seen_pids.add(m["pattern_id"])

    if not hits:
        context_block = "(No patterns are indexed in the library yet.)"
    else:
        context_block = "\n\n".join(
            f"[Source: {h['pattern_title']}]\n{h['text']}" for h in hits
        )

    windowed = (history or [])[-(HISTORY_WINDOW * 2):]
    framed_message = f"<user_question>{user_message}</user_question>"

    messages = [
        {"role": "system", "content": LIBRARY_CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": f"RETRIEVED EXCERPTS:\n{context_block}"},
        *windowed,
        {"role": "user", "content": framed_message},
    ]

    reply = ""
    for _ in range(2):
        resp = client.chat.complete(model=CHAT_MODEL, messages=messages)
        reply = _extract_text(resp.choices[0].message.content)
        if reply.strip():
            break

    # Only surface a pattern as a source if the reply actually cites it by
    # title, not every pattern whose chunks happened to be in context — the
    # materials-chunk merge above means `hits` includes every pattern in the
    # library on nearly every request, which would otherwise turn "sources"
    # into "the whole library" regardless of what the answer was about.
    sources = []
    if reply.strip() != _LIBRARY_INJECTION_REPLY:
        seen = set()
        for h in hits:
            pid = h["pattern_id"]
            if pid in seen or h["pattern_title"] not in reply:
                continue
            seen.add(pid)
            sources.append({"pattern_id": pid, "pattern_title": h["pattern_title"]})

    return {"reply": reply, "sources": sources}


def clear_history(pattern_id: str) -> None:
    path = _doc_path(pattern_id)
    if not path.exists():
        return
    doc = json.loads(path.read_text())
    doc["chat_history"] = []
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2))

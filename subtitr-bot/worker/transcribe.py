"""Groq Whisper orqali audio -> matn (segmentlar bilan).

Lokal whisper o'rniga Groq API ishlatamiz: tez va aniqroq (large-v3).
Bu funksiya sinxron (CPU/tarmoq bilan ishlaydi) — pipeline uni
asyncio.to_thread ichida chaqiradi, shunda bot bloklanmaydi.

Xato holati: tarmoq uzilishi, 429 (rate-limit), 5xx (server) —
avtomatik 3 marta qayta urinadi (5s / 10s oraliq).
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any

import groq as groq_lib
from groq import Groq

from config import settings

logger = logging.getLogger(__name__)

_client: Groq | None = None

# Til bo'yicha Whisper "prompt" — modelni to'g'ri imlo/uslubga yo'naltiradi.
# O'zbek (kam resursli til) uchun ayniqsa muhim: o', g', diniy iboralar.
_LANG_PROMPT = {
    "uz": (
        "O'zbek tilidagi suhbat. To'g'ri imlo bilan yoz (o', g', sh, ch, ng): "
        "bo'ladi, o'zbek, to'g'ri, yo'q, kerak, qiladi, Alloh, payg'ambar, "
        "inshaalloh, mustaqillik, rivojlanish."
    ),
}

# Qayta urinish parametrlari
_MAX_ATTEMPTS = 3
_RETRY_WAITS = [5, 10]  # 1-xato: 5s, 2-xato: 10s

# Qayta urinish kerak bo'lgan xatolar
_RETRYABLE = (
    groq_lib.RateLimitError,
    groq_lib.APIConnectionError,
    groq_lib.InternalServerError,
    groq_lib.APITimeoutError,
)


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _seg_value(seg: Any, key: str, default: Any = None) -> Any:
    """Groq segmenti dict yoki obyekt bo'lishi mumkin — ikkalasini ham qo'llaydi."""
    if isinstance(seg, dict):
        return seg.get(key, default)
    return getattr(seg, key, default)


def _call_once(client: Groq, fname: str, data: bytes, base_kwargs: dict) -> Any:
    """Bir urinish: word+segment → muvaffaqiyatsiz bo'lsa faqat segment."""
    try:
        return client.audio.transcriptions.create(
            file=(fname, data),
            timestamp_granularities=["word", "segment"],
            **base_kwargs,
        )
    except _RETRYABLE:
        raise  # tashqi retry ushlasin
    except Exception:
        # Word timestamp qo'llanmasa — oddiy format bilan qaytamiz
        return client.audio.transcriptions.create(file=(fname, data), **base_kwargs)


def transcribe(audio_path: str, language: str | None) -> tuple[list[dict], list[dict], str]:
    """Audio faylni subtitr segment va so'zlariga aylantiradi.

    language: "ru" / "en" / "uz" yoki None/"auto" (AI o'zi aniqlaydi).
    Qaytaradi: (segmentlar, so'zlar, aniqlangan_til)
    """
    client = _get_client()

    base_kwargs: dict[str, Any] = {
        "model": settings.whisper_model,
        "response_format": "verbose_json",
    }
    if language and language != "auto":
        base_kwargs["language"] = language
        if language in _LANG_PROMPT:
            base_kwargs["prompt"] = _LANG_PROMPT[language]

    with open(audio_path, "rb") as f:
        data = f.read()
    fname = os.path.basename(audio_path)

    resp = None
    last_exc: Exception | None = None
    for attempt in range(_MAX_ATTEMPTS):
        try:
            resp = _call_once(client, fname, data, base_kwargs)
            break
        except _RETRYABLE as exc:
            last_exc = exc
            if attempt < _MAX_ATTEMPTS - 1:
                wait = _RETRY_WAITS[attempt]
                logger.warning(
                    "Groq vaqtincha xato (urinish %d/%d, %ds kutiladi): %s",
                    attempt + 1, _MAX_ATTEMPTS, wait, exc,
                )
                time.sleep(wait)
            else:
                logger.error("Groq %d urinishdan keyin ham xato: %s", _MAX_ATTEMPTS, exc)
                raise
        except Exception:
            raise  # qayta urinish kerak bo'lmagan xato (400 Bad Request va h.k.)

    if resp is None:
        raise last_exc  # type: ignore[misc]

    detected = (_seg_value(resp, "language", "") or "").strip().lower()

    segments: list[dict] = []
    for seg in (_seg_value(resp, "segments", []) or []):
        text = (_seg_value(seg, "text", "") or "").strip()
        if not text:
            continue
        segments.append(
            {
                "start": float(_seg_value(seg, "start", 0.0) or 0.0),
                "end": float(_seg_value(seg, "end", 0.0) or 0.0),
                "text": text,
            }
        )

    words: list[dict] = []
    for w in (_seg_value(resp, "words", []) or []):
        wt = (_seg_value(w, "word", "") or "")
        if not wt.strip():
            continue
        words.append(
            {
                "word": wt,
                "start": float(_seg_value(w, "start", 0.0) or 0.0),
                "end": float(_seg_value(w, "end", 0.0) or 0.0),
            }
        )

    return segments, words, detected

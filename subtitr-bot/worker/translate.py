"""AI tarjima — kontekstли, subtitr-maxsus (arxitektura 5.7).

Tartib: Gemini (bepul) -> OpenAI (ChatGPT). Tarjima bo'laklarga (batch)
bo'linadi va har bo'lakka atrofdagi qatorlar KONTEKST sifatida beriladi
(tarjima qilinmaydi) — olmosh, ohang, davomli gap saqlanib, tabiiy chiqadi.
Raqamli kalit (index) tizimi: qatorlar joyiga tushadi. Asl=javob (tarjima
qilinmagan) holati aniqlanadi (worker/_llm.py from_windowed_response).
"""
from __future__ import annotations

import logging

from config import settings
from worker import aiclient
from worker._llm import from_windowed_response, to_windowed_payload

logger = logging.getLogger(__name__)

_LANG_NAME = {"uz": "o'zbek", "ru": "rus", "en": "ingliz"}

# Bir so'rovda tarjima qilinadigan qatorlar va atrofdagi kontekst qatorlari
_BATCH = 40
_CTX = 6

# Til bo'yicha few-shot misol — og'zaki/lo'nda subtitr uslubini ko'rsatadi
_FEWSHOT = {
    "uz": (
        '{"0":"You know, this is gonna be huge.","1":"I mean, just trust me."}'
        ' -> {"0":"Bu juda katta voqea bo\'ladi.","1":"Menga ishoning."}'
    ),
    "ru": (
        '{"0":"You know, this is gonna be huge."}'
        ' -> {"0":"Это будет нечто грандиозное."}'
    ),
    "en": (
        '{"0":"Eshitdingmi, bu zo\'r bo\'ladi."}'
        ' -> {"0":"You won\'t believe how great this is."}'
    ),
}


def _system_prompt(target_name: str, target_lang: str) -> str:
    example = _FEWSHOT.get(target_lang, "")
    return (
        f"Sen professional SUBTITR tarjimonisan. Senga JSON obyekt beriladi: "
        f"uchta qism — \"context_before\", \"translate\", \"context_after\".\n"
        f"context_before va context_after — videoning oldingi/keyingi qatorlari, "
        f"FAQAT ma'noni (olmosh, davomli gap, ohang) tushunish uchun. Ularni "
        f"TARJIMA QILMA va javobga QO'SHMA.\n"
        f"FAQAT \"translate\" ichidagi qiymatlarni TABIIY va RAVON {target_name} "
        f"tiliga tarjima qil. Qoidalar:\n"
        f"- QISQA va OG'ZAKI yoz (kitobiy emas) — ekranda tez o'qilsin, AMMO "
        f"mazmunni tashlama.\n"
        f"- Asl OHANGNI saqla: savol — savol, undov — undov bo'lsin.\n"
        f"- Ma'nosiz to'ldiruvchilarni (well, you know, I mean, ну вот) tashlab yubor.\n"
        f"- Slang/og'zaki iborani {target_name} og'zaki muqobili bilan ber "
        f"(so'zma-so'z emas).\n"
        f"- Ismlar, brend va atamalarni IZCHIL (hamma joyda bir xil) tarjima qil.\n"
        + (f"Misol: {example}\n" if example else "")
        + f"QAT'IY: AYNAN o'sha raqamli kalitlar bilan TEKIS (flat) JSON obyekt "
        f"qaytar — faqat \"translate\" kalitlari (kalit qo'shma, o'chirma, "
        f"o'zgartirma). Izoh yo'q. Faqat JSON."
    )


def _gemini_raw(payload: str, system_prompt: str) -> str:
    return aiclient.gemini_generate(
        payload, system_prompt, model=settings.gemini_model, temperature=0.2,
    )


def _openai_raw(payload: str, system_prompt: str) -> str:
    return aiclient.openai_generate(payload, system_prompt, temperature=0.2)


def _providers():
    return [
        ("gemini", bool(settings.gemini_api_key), _gemini_raw),
        ("claude", aiclient.claude_available(), aiclient.claude_generate),
        ("openai", aiclient.openai_available(), _openai_raw),
    ]


def _translate_window(
    texts: list[str], start: int, end: int, target_name: str, target_lang: str
) -> tuple[dict[int, str], str]:
    """Bitta bo'lak (range(start,end)) ni kontekst bilan tarjima qiladi."""
    payload = to_windowed_payload(texts, start, end, _CTX)
    system_prompt = _system_prompt(target_name, target_lang)
    expected = end - start

    for name, available, raw_fn in _providers():
        if not available:
            continue
        try:
            content = raw_fn(payload, system_prompt)
            out, matched = from_windowed_response(content, texts, start, end)
            if matched < max(1, expected // 2):
                raise ValueError(f"kam tarjima ({matched}/{expected})")
            logger.info(
                "Tarjima '%s' [%d:%d] (%d/%d qator)", name, start, end, matched, expected
            )
            return out, name
        except Exception as exc:
            logger.warning(
                "'%s' tarjima xatosi [%d:%d] (%s) — keyingi provayder",
                name, start, end, exc,
            )
            continue

    raise RuntimeError("Tarjima qilinmadi (AI provayderlar ishlamadi)")


def translate_texts(texts: list[str], target_lang: str) -> tuple[list[str], str]:
    """Matnlarni target_lang tiliga kontekstли tarjima qiladi. (tarjimalar, provayder)."""
    if not texts:
        return texts, ""
    target_name = _LANG_NAME.get(target_lang, target_lang)

    out = list(texts)  # natija (topilmaganlar asl matn bilan qoladi)
    provider_used = ""
    for start in range(0, len(texts), _BATCH):
        end = min(start + _BATCH, len(texts))
        chunk, provider_used = _translate_window(
            texts, start, end, target_name, target_lang
        )
        for i, text in chunk.items():
            out[i] = text
    return out, provider_used

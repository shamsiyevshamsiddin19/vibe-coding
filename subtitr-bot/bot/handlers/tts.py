"""/tts — matnni ovozga aylantirish (faqat rus/ingliz).

Oqim: /tts <matn> yoki /tts (keyin matn kutiladi) -> til tanlash (ru/en) ->
Gemini TTS orqali ovoz sintez qilinadi -> voice xabar sifatida yuboriladi.

Nega faqat ikki til: Gemini TTS o'zbek tilida notabiiy talaffuz qiladi —
sifat kafolatlanadigan ru/en bilan cheklaymiz (worker/tts.py da izoh bor).
"""
from __future__ import annotations

import asyncio
import logging
import os

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    FSInputFile,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from worker.tts import MAX_CHARS, QuotaExceeded, text_to_voice

logger = logging.getLogger(__name__)
router = Router()

_MIN_CHARS = 2


class TtsFlow(StatesGroup):
    waiting_text = State()


def _lang_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[
            InlineKeyboardButton(text="🇷🇺 Ruscha ovoz", callback_data="tts_lang:ru"),
            InlineKeyboardButton(text="🇬🇧 Inglizcha ovoz", callback_data="tts_lang:en"),
        ]]
    )


def _too_long_or_short(text: str) -> str | None:
    n = len(text.strip())
    if n < _MIN_CHARS:
        return "⚠️ Matn juda qisqa."
    if n > MAX_CHARS:
        return f"⚠️ Matn juda uzun (maks {MAX_CHARS} belgi). Qisqartirib yuboring."
    return None


@router.message(Command("tts"))
async def cmd_tts(message: Message, state: FSMContext) -> None:
    parts = (message.text or "").split(maxsplit=1)
    if len(parts) < 2 or not parts[1].strip():
        await state.set_state(TtsFlow.waiting_text)
        await message.answer(
            "🔊 <b>Matnni ovozga aylantirish</b>\n\n"
            "Matningizni yuboring — ovozli xabar qilib qaytaraman.\n"
            "Faqat <b>rus</b> va <b>ingliz</b> tili qo'llab-quvvatlanadi.\n\n"
            f"📏 Maksimal {MAX_CHARS} belgi.",
            parse_mode="HTML",
        )
        return
    await _receive_text(message, state, parts[1])


@router.message(TtsFlow.waiting_text, F.text & ~F.text.startswith("/"))
async def on_tts_text(message: Message, state: FSMContext) -> None:
    await _receive_text(message, state, message.text or "")


async def _receive_text(message: Message, state: FSMContext, text: str) -> None:
    err = _too_long_or_short(text)
    if err:
        await message.reply(err)
        return
    await state.update_data(tts_text=text.strip())
    await state.set_state(None)
    await message.answer(
        "🗣 Qaysi tilda o'qib berilsin?", reply_markup=_lang_keyboard()
    )


@router.callback_query(F.data.startswith("tts_lang:"))
async def on_tts_lang(call: CallbackQuery, state: FSMContext) -> None:
    lang = call.data.split(":", 1)[1]
    data = await state.get_data()
    text = data.get("tts_text")
    await call.answer()
    if not text:
        await call.message.answer(
            "❌ Matn topilmadi, iltimos /tts bilan qaytadan yuboring."
        )
        return
    await state.clear()
    try:
        await call.message.edit_reply_markup(reply_markup=None)
    except Exception:
        pass

    status = await call.message.answer("🎙 Ovoz tayyorlanmoqda...")
    try:
        ogg_path = await asyncio.to_thread(text_to_voice, text, lang)
    except QuotaExceeded:
        await status.edit_text(
            "❌ Bugungi ovoz (TTS) limiti tugadi.\n"
            "Iltimos, ertaga qayta urinib ko'ring."
        )
        return
    except Exception:
        logger.exception("TTS xatosi (lang=%s)", lang)
        await status.edit_text(
            "❌ Ovoz yasashda xatolik bo'ldi. Birozdan keyin qayta urinib ko'ring."
        )
        return

    try:
        await call.message.answer_voice(FSInputFile(ogg_path))
        try:
            await status.delete()
        except Exception:
            pass
    finally:
        try:
            os.remove(ogg_path)
        except OSError:
            pass

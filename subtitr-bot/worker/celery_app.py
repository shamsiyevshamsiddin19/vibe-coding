"""Celery instance va task ta'riflari.

Bot video qabul qilganda shu task'ni chaqiradi — worker alohida
jarayonda videoni qayta ishlaydi va natijani Telegram orqali yuboradi.

Ishga tushirish:
    celery -A worker.celery_app worker --loglevel=info --concurrency=2 -Q high,default
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import time
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from celery import Celery

from config import settings

logger = logging.getLogger(__name__)

app = Celery(
    "subtitr",
    broker=settings.celery_broker,
    backend=settings.celery_backend,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_soft_time_limit=3300,  # 55 daqiqa (45 daqiqali video kuydirilishi uchun)
    task_time_limit=3600,       # 60 daqiqa (hard limit)
    task_acks_late=True,        # task tugaguncha ack bermaslik (worker o'lsa qayta ishlash)
    worker_prefetch_multiplier=1,  # har bir worker faqat 1 ta task oladi
    task_default_queue="default",
    task_routes={
        "worker.celery_app.process_video_task": {
            "queue": "default",  # runtime'da priority bo'yicha o'zgaradi
        },
    },
)


_loop = None


def _name_of(out_path: str, default: str) -> str:
    """Natija fayl uchun mos nom (slug) — pipeline yozgan <out_path>.name dan."""
    try:
        with open(out_path + ".name", encoding="utf-8") as f:
            s = f.read().strip()
        return s or default
    except OSError:
        return default


def _run_async(coro):
    """Celery worker (sinxron) ichida async kodni ishga tushirish.

    Bitta UZOQ YASHAYDIGAN loop ishlatamiz (har chaqiruvда yangi loop EMAS).
    asyncpg (PostgreSQL) ulanish pooli birinchi ishlatilgan event loopga
    bog'lanadi; har safar yangi loop yaratsak, keyingi DB chaqiruvi
    "got Future attached to a different loop" xatosini beradi — natija
    yuborilgach finish_video shu sababdan qulab, foydalanuvchiga soxta
    xato ketardi. Bitta loop bilan pool butun jarayon davomida amal qiladi.
    """
    global _loop
    if _loop is None or _loop.is_closed():
        _loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_loop)
    return _loop.run_until_complete(coro)


def _finish(video_db_id: int, status: str, error: str = "") -> None:
    """Video yakuniy statusini yozadi. Masofaviy worker (REMOTE_WORKER=1) —
    master'ga HTTP; master'ning o'z worker'i — to'g'ridan-to'g'ri DB."""
    if settings.remote_worker:
        from worker.distributed import report_finish

        report_finish(video_db_id, status, error)
    else:
        from db.crud import finish_video

        _run_async(finish_video(video_db_id, status, error_message=error or None))


@app.task(bind=True, name="worker.celery_app.process_video_task", max_retries=1)
def process_video_task(
    self,
    job_id: str,
    in_path: str,
    modes: list,
    source_lang: str | None,
    target_lang: str | None,
    user_tg_id: int,
    video_db_id: int,
    style: dict | None = None,
    in_url: str = "",
):
    """Video qayta ishlash va natijani Telegram ga yuborish.

    Bu task Celery worker'da sinxron ishlaydi. Ichida asyncio loop
    yaratib async funksiyalarni chaqiradi (Telegram API, DB).
    """
    from aiogram import Bot
    from aiogram.client.session.aiohttp import AiohttpSession

    from worker.pipeline import process_video_modes, cleanup_all, job_paths

    logger.info(
        "Task boshlandi: job=%s, user=%s, modes=%s",
        job_id, user_tg_id, modes,
    )

    start_ts = time.monotonic()

    # Bitta bot sessiyasi butun task uchun: jonli progress + natija yuborish
    session = AiohttpSession(timeout=settings.bot_request_timeout)
    bot = Bot(token=settings.bot_token, session=session)

    # Jonli progress: foydalanuvchiga bosqich xabari yuboriladi va har
    # bosqichda TAHRIRLANADI — "bot javob bermayapti" degan taassurot qolmaydi.
    # Telegram edit limitiga tushmaslik uchun 2.5s dan tez yangilamaymiz
    # (bosqichlar odatda daqiqalab davom etadi, bu amalda cheklamaydi).
    _prog = {"msg_id": None, "text": "", "ts": 0.0}

    async def _progress(text: str) -> None:
        logger.info("Progress [%s]: %s", job_id, text)
        if text == _prog["text"]:
            return
        now = time.monotonic()
        try:
            if _prog["msg_id"] is None:
                m = await bot.send_message(user_tg_id, text)
                _prog["msg_id"] = m.message_id
            else:
                if now - _prog["ts"] < 2.5:
                    return
                await bot.edit_message_text(
                    text, chat_id=user_tg_id, message_id=_prog["msg_id"]
                )
            _prog["text"] = text
            _prog["ts"] = now
        except Exception as exc:  # progress asosiy ishga xalal bermasin
            logger.debug("Progress xabari yuborilmadi: %s", exc)

    async def _progress_cleanup() -> None:
        """Ish tugagach (natija/xato oldidan) progress xabarini o'chiradi."""
        if _prog["msg_id"] is not None:
            try:
                await bot.delete_message(user_tg_id, _prog["msg_id"])
            except Exception:
                pass
            _prog["msg_id"] = None

    try:
        # Masofaviy worker: kirish video lokalda yo'q bo'lsa master'dan yuklab olamiz
        from worker.distributed import fetch_input

        local_in = fetch_input(in_path, in_url)

        # Video qayta ishlash (sync wrapper)
        async def _do_process():
            return await process_video_modes(
                local_in, job_id, _progress,
                modes=modes, source_lang=source_lang,
                target_lang=target_lang, style=style,
            )

        results = _run_async(_do_process())

        elapsed = int(time.monotonic() - start_ts)
        elapsed_str = f"{elapsed // 60}:{elapsed % 60:02d}" if elapsed >= 60 else f"{elapsed}s"

        # Natijani Telegram orqali foydalanuvchiga yuborish
        async def _send_results():
            from aiogram.types import FSInputFile
            from web.server import publish_file

            await _progress_cleanup()
            for out_path, kind, mode in results:
                slug = _name_of(out_path, kind or "subtitr")
                if kind == "srt":
                    await bot.send_document(
                        user_tg_id,
                        FSInputFile(out_path, filename=f"{slug}.srt"),
                        caption=f"✅ .SRT fayl tayyor! ⏱ {elapsed_str}\n"
                                "📋 Istalgan subtitr muharririda oching.\n\n@subtitle_srtbot",
                    )
                elif kind == "audio":
                    out_mb = os.path.getsize(out_path) / (1024 * 1024)
                    if out_mb > settings.max_send_mb:
                        dl_url = publish_file(out_path)
                        await bot.send_message(
                            user_tg_id,
                            f"🎵 Audio (MP3) tayyor! ⏱ {elapsed_str}\n\n"
                            f"Fayl katta ({out_mb:.0f}MB) — havola orqali yuklab oling:\n{dl_url}"
                            f"\n\n@subtitle_srtbot",
                            disable_web_page_preview=True,
                        )
                    else:
                        await bot.send_audio(
                            user_tg_id,
                            FSInputFile(out_path, filename=f"{slug}.mp3"),
                            caption=f"🎵 Audio (MP3) tayyor! ✅ ⏱ {elapsed_str}\n\n@subtitle_srtbot",
                        )
                elif kind in ("text", "vocab"):
                    base = out_path[:-4]
                    pdf_path = base + ".pdf"
                    await bot.send_document(
                        user_tg_id,
                        FSInputFile(out_path, filename=f"{slug}.txt"),
                    )
                    if os.path.isfile(pdf_path):
                        await bot.send_document(
                            user_tg_id,
                            FSInputFile(pdf_path, filename=f"{slug}.pdf"),
                            caption="⬇️ PDF yoki txt — qulayini oling\n\n@subtitle_srtbot",
                        )
                else:
                    # Video
                    out_mb = os.path.getsize(out_path) / (1024 * 1024)
                    if out_mb > settings.max_send_mb:
                        dl_url = publish_file(out_path)
                        await bot.send_message(
                            user_tg_id,
                            f"🎬 Subtitr video tayyor! ⏱ {elapsed_str}\n\n"
                            f"Video katta ({out_mb:.0f}MB) — havola orqali yuklab oling:\n{dl_url}"
                            f"\n\n@subtitle_srtbot",
                            disable_web_page_preview=True,
                        )
                    else:
                        await bot.send_video(
                            user_tg_id,
                            FSInputFile(out_path, filename=f"{slug}.mp4"),
                            caption=f"🎉 Subtitr video tayyor! ✅ ⏱ {elapsed_str}\n\n@subtitle_srtbot",
                        )

        _run_async(_send_results())
        _finish(video_db_id, "done")

        logger.info("Task tugadi: job=%s, %s", job_id, elapsed_str)
        return {"status": "done", "elapsed": elapsed_str}

    except Exception as exc:
        logger.exception("Task xatosi: job=%s", job_id)

        # Status (master DB yoki HTTP) — xabar yuborishdan oldin yozamiz
        _finish(video_db_id, "error", str(exc))

        # Xatolik xabarini foydalanuvchiga yuborish
        async def _send_error():
            await _progress_cleanup()
            err = str(exc)
            if "Nutq aniqlanmadi" in err:
                msg = (
                    "❌ Video ichida nutq (ovoz) aniqlanmadi.\n"
                    "Ovozli video ekanini tekshirib, qayta yuboring."
                )
            elif "429" in err or "rate" in err.lower() or "quota" in err.lower():
                msg = (
                    "❌ AI xizmat vaqtincha band (so'rov limiti).\n"
                    "1-2 daqiqadan keyin qayta urinib ko'ring."
                )
            else:
                msg = (
                    "❌ Videoni qayta ishlashda xatolik bo'ldi.\n"
                    "Qayta urinib ko'ring yoki /help."
                )
            await bot.send_message(user_tg_id, msg)

        try:
            _run_async(_send_error())
        except Exception:
            logger.exception("Xatolik xabarini yuborib bo'lmadi")

        raise  # Celery retry uchun

    finally:
        try:
            _run_async(bot.session.close())
        except Exception:
            pass
        cleanup_all(job_id)

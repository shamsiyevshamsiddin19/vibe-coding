import os
import shutil
import time
import asyncio
import collections
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, FSInputFile

from core.database import db
from services.converter import create_pdf_from_images, create_zip_from_files, text_to_docx, pdf_to_docx, merge_pdfs, split_pdf, add_watermark, office_to_pdf, image_to_text_docx
from services.lang import get_text

router = Router()
UPLOAD_DIR = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

HEAVY_TASK_SEMAPHORE = asyncio.Semaphore(2)
CHAT_LOCKS = collections.defaultdict(asyncio.Lock)

def get_user_dir(chat_id: int):
    d = os.path.join(UPLOAD_DIR, str(chat_id))
    os.makedirs(d, exist_ok=True)
    return d

def count_files(user_dir: str):
    return len([name for name in os.listdir(user_dir) if "___" in name])

def clear_user_dir(user_dir: str):
    for filename in os.listdir(user_dir):
        file_path = os.path.join(user_dir, filename)
        if os.path.isfile(file_path):
            os.unlink(file_path)

@router.message(F.document | F.photo | F.video | F.audio)
async def handle_files(message: Message):
    user = await db.get_user(message.chat.id)
    if not user: return
    lang = user.get('lang') if user.get('lang') else 'uz'
    mode = user.get('mode')
    user_dir = get_user_dir(message.chat.id)
    
    if user.get('finished'):
        clear_user_dir(user_dir)
        await db.update_user(message.chat.id, finished=False)

    if mode == 'pdf_to_docx' and message.document:
        msg = await message.answer("Navbat kutilmoqda...")
        if HEAVY_TASK_SEMAPHORE.locked():
            await msg.edit_text("Server hozir band. Navbatingizni kuting...")
            
        async with HEAVY_TASK_SEMAPHORE:
            await msg.edit_text("Kuting, konvertatsiya qilinmoqda...")
            file_id = message.document.file_id
            if not message.document.file_name.lower().endswith('.pdf'):
                await msg.edit_text("PDF yuboring!")
                return
            in_path = os.path.join(user_dir, f"in_{time.time()}.pdf")
            out_path = os.path.join(user_dir, f"out_{time.time()}.docx")
            await message.bot.download(file_id, destination=in_path)
            if pdf_to_docx(in_path, out_path):
                await message.answer_document(FSInputFile(out_path))
            else:
                await msg.edit_text("Xatolik yuz berdi.")
            clear_user_dir(user_dir)
            await db.update_user(message.chat.id, mode=None)
        return

    if mode == 'office_to_pdf' and message.document:
        msg = await message.answer("Navbat kutilmoqda...")
        if HEAVY_TASK_SEMAPHORE.locked():
            await msg.edit_text("Server hozir band. Navbatingizni kuting...")
            
        async with HEAVY_TASK_SEMAPHORE:
            await msg.edit_text("Konvertatsiya qilinmoqda, kutib turing...")
            file_id = message.document.file_id
            ext = message.document.file_name.lower().split('.')[-1]
            if ext not in ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt']:
                await msg.edit_text("Faqat Word, Excel yoki PowerPoint fayl yuboring!")
                return
            in_path = os.path.join(user_dir, f"in_{time.time()}.{ext}")
            await message.bot.download(file_id, destination=in_path)
            out_pdf = office_to_pdf(in_path, user_dir)
            if out_pdf:
                await message.answer_document(FSInputFile(out_pdf))
            else:
                await msg.edit_text("Xatolik yuz berdi.")
            clear_user_dir(user_dir)
            await db.update_user(message.chat.id, mode=None)
        return

    if mode == 'ocr' and message.photo:
        msg = await message.answer("Navbat kutilmoqda...")
        if HEAVY_TASK_SEMAPHORE.locked():
            await msg.edit_text("Server hozir band. Navbatingizni kuting...")
            
        async with HEAVY_TASK_SEMAPHORE:
            await msg.edit_text("Skaner qilinmoqda (OCR), kuting...")
            file_id = message.photo[-1].file_id
            in_path = os.path.join(user_dir, f"img_{time.time()}.jpg")
            out_path = os.path.join(user_dir, f"ocr_{time.time()}.docx")
            await message.bot.download(file_id, destination=in_path)
            
            # User lang is already extracted
            lang_map = {'uz': 'uzb', 'ru': 'rus', 'en': 'eng'}
            ocr_lang = lang_map.get(lang, 'uzb')
            
            if image_to_text_docx(in_path, out_path, lang=ocr_lang):
                await message.answer_document(FSInputFile(out_path), caption="Matn faylga saqlandi!")
            else:
                await msg.edit_text("Rasmdan matn o'qib bo'lmadi.")
            clear_user_dir(user_dir)
            await db.update_user(message.chat.id, mode=None)
        return

    if mode == 'split_pdf' and message.document:
        if not message.document.file_name.lower().endswith('.pdf'):
            await message.answer("PDF yuboring!")
            return
        file_id = message.document.file_id
        in_path = os.path.join(user_dir, f"{time.time()}___split.pdf")
        await message.bot.download(file_id, destination=in_path)
        await db.update_user(message.chat.id, temp_data=in_path)
        await message.answer("Endi menga qirqib olinadigan sahifalar oralig'ini yuboring.\nMasalan: 1-5")
        return

    if mode == 'watermark_pdf' and message.document:
        if not message.document.file_name.lower().endswith('.pdf'):
            await message.answer("PDF yuboring!")
            return
        file_id = message.document.file_id
        in_path = os.path.join(user_dir, f"{time.time()}___watermark.pdf")
        await message.bot.download(file_id, destination=in_path)
        await db.update_user(message.chat.id, temp_data=in_path)
        await message.answer("Endi PDF orqasiga bosiladigan matnni yuboring (Watermark):")
        return

    if mode is None:
        mode = 'pdf' if message.photo else 'zip'
        await db.update_user(message.chat.id, mode=mode)
    elif mode == 'pdf' and not message.photo:
        mode = 'zip'
        await db.update_user(message.chat.id, mode=mode)
    
    file_id = None
    file_name = f"file_{int(time.time())}"
    if message.photo:
        file_id = message.photo[-1].file_id; file_name += ".jpg"
    elif message.document:
        file_id = message.document.file_id; file_name = message.document.file_name
        
    if file_id:
        safe_name = "".join([c for c in file_name if c.isalnum() or c in '._- ']).strip()
        save_path = os.path.join(user_dir, f"{time.time()}___{safe_name}")
        await message.bot.download(file_id, destination=save_path)
        
    count = count_files(user_dir)
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=f"YAKUNLASH ({count})", callback_data="finish_upload")]])
    text = f"Qabul qilindi: {count} ta fayl. Davom etishingiz mumkin yoki YAKUNLASH ni bosing."
    
    async with CHAT_LOCKS[message.chat.id]:
        user_fresh = await db.get_user(message.chat.id)
        last_msg_id = user_fresh.get('last_msg_id')
        if last_msg_id:
            try:
                await message.bot.edit_message_text(chat_id=message.chat.id, message_id=last_msg_id, text=text, reply_markup=kb)
                return
            except Exception: pass
        sent_msg = await message.answer(text, reply_markup=kb)
        await db.update_user(message.chat.id, last_msg_id=sent_msg.message_id)

@router.callback_query(F.data == "finish_upload")
async def finish_upload_callback(callback: CallbackQuery):
    await callback.answer()
    user = await db.get_user(callback.message.chat.id)
    if not user: return
    if HEAVY_TASK_SEMAPHORE.locked():
        await callback.message.edit_text("Server hozir band. Navbatingizni kuting...")
    else:
        await callback.message.edit_text("Jarayon ketmoqda...")
        
    async with HEAVY_TASK_SEMAPHORE:
        await process_finish_with_bot(callback.bot, callback.message.chat.id, f"hujjat_{int(time.time())}")
    
    await db.update_user(callback.message.chat.id, finished=True, last_msg_id=None)
    try: await callback.message.delete()
    except: pass

async def process_finish_with_bot(bot, chat_id: int, custom_name: str):
    user_dir = get_user_dir(chat_id)
    files = sorted([os.path.join(user_dir, f) for f in os.listdir(user_dir) if "___" in f])
    if not files: return
    
    user = await db.get_user(chat_id)
    mode = user.get('mode')
    
    if mode == 'merge_pdf':
        out_pdf = os.path.join(user_dir, 'merged.pdf')
        if merge_pdfs(files, out_pdf):
            await bot.send_document(chat_id, FSInputFile(out_pdf, filename=f"{custom_name}.pdf"), caption="Tayyor!")
        else:
            await bot.send_message(chat_id, "Xatolik yuz berdi.")
        clear_user_dir(user_dir)
        await db.update_user(chat_id, mode=None)
        return

    has_images = any(f.lower().endswith(('.jpg', '.jpeg', '.png')) for f in files)
    if has_images and (mode == 'pdf' or mode is None):
        out_pdf = os.path.join(user_dir, 'output.pdf')
        if create_pdf_from_images(files, out_pdf):
            await bot.send_document(chat_id, FSInputFile(out_pdf, filename=f"{custom_name}.pdf"), caption="Tayyor! Nomi uchun Reply qilib yozing.")
    else:
        out_zip = os.path.join(user_dir, 'output.zip')
        if create_zip_from_files(files, out_zip):
            await bot.send_document(chat_id, FSInputFile(out_zip, filename=f"{custom_name}.zip"), caption="Tayyor! Nomi uchun Reply qilib yozing.")

@router.message(F.text, ~F.text.startswith('/'))
async def process_text_reply(message: Message):
    user = await db.get_user(message.chat.id)
    if not user: return
    mode = user.get('mode')
    lang = user.get('lang') if user.get('lang') else 'uz'
    
    from services.lang import TEXTS
    all_btns = []
    for l in TEXTS.values():
        all_btns.extend(list(l.values()))
    if message.text in all_btns:
        return
        
    if mode == 'text_to_doc':
        user_dir = get_user_dir(message.chat.id)
        out_path = os.path.join(user_dir, 'matn_hujjat.docx')
        text_to_docx(message.text, out_path)
        await message.answer_document(FSInputFile(out_path), caption="Tayyor!")
        clear_user_dir(user_dir)
        await db.update_user(message.chat.id, mode=None)
        return
        
    if mode == 'split_pdf':
        in_path = user.get('temp_data')
        if not in_path or not os.path.exists(in_path):
            await message.answer("Fayl topilmadi, boshqatdan yuboring.")
            return
        try:
            start, end = map(int, message.text.split('-'))
            out_path = os.path.join(get_user_dir(message.chat.id), f"split_{time.time()}.pdf")
            if split_pdf(in_path, out_path, start, end):
                await message.answer_document(FSInputFile(out_path), caption="Tayyor!")
            else:
                await message.answer("PDF ni qirqishda xato (balki sahifalar soni xatodir).")
        except:
            await message.answer("Noto'g'ri format! Iltimos '1-5' kabi yozing.")
        clear_user_dir(get_user_dir(message.chat.id))
        await db.update_user(message.chat.id, mode=None, temp_data=None)
        return

    if mode == 'watermark_pdf':
        in_path = user.get('temp_data')
        if not in_path or not os.path.exists(in_path):
            return
        out_path = os.path.join(get_user_dir(message.chat.id), f"wm_{time.time()}.pdf")
        if add_watermark(in_path, out_path, message.text):
            await message.answer_document(FSInputFile(out_path), caption="Tayyor!")
        else:
            await message.answer("Xatolik yuz berdi.")
        clear_user_dir(get_user_dir(message.chat.id))
        await db.update_user(message.chat.id, mode=None, temp_data=None)
        return

    if message.reply_to_message:
        user_dir = get_user_dir(message.chat.id)
        if count_files(user_dir) > 0:
            await process_finish_with_bot(message.bot, message.chat.id, message.text.strip())
            return

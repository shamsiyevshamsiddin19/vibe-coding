from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton

from core.database import db
from core.config import ADMIN_ID

router = Router()

def get_admin_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="STATISTIKA"), KeyboardButton(text="XABAR YUBORISH")],
            [KeyboardButton(text="MAJBURIY OBUNA"), KeyboardButton(text="CHIQISH")]
        ],
        resize_keyboard=True
    )

def get_sub_hub_keyboard(is_active: bool):
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="KANAL QO'SHISH"), KeyboardButton(text="KANAL O'CHIRISH")],
            [KeyboardButton(text="O'CHIRISH" if is_active else "YOQISH"), KeyboardButton(text="ORQAGA")]
        ],
        resize_keyboard=True
    )

@router.message(F.text == "2501", F.chat.id == ADMIN_ID)
async def admin_login(message: Message):
    await db.update_user(message.chat.id, mode="admin_main", admin_login_id=message.message_id)
    await message.answer("<b>ADMIN PANEL</b>\nBoshqaruv bo'limiga xush kelibsiz.", reply_markup=get_admin_keyboard())

@router.message(F.chat.id == ADMIN_ID)
async def admin_actions(message: Message):
    user = await db.get_user(message.chat.id)
    if not user or not user['mode'] or not user['mode'].startswith('admin_'):
        return # Not in admin mode, let other handlers process

    mode = user['mode']
    text = message.text

    if mode == 'admin_main':
        if text == "CHIQISH":
            await db.update_user(message.chat.id, mode=None, admin_login_id=None)
            from handlers.user_handlers import get_main_keyboard
            await message.answer("Admin paneldan chiqildi.", reply_markup=get_main_keyboard())
        elif text == "XABAR YUBORISH":
            await db.update_user(message.chat.id, mode="admin_broadcast")
            kb = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="BEKOR QILISH")]], resize_keyboard=True)
            await message.answer("<b>Tarqatma xabar matnini yozing (rasm/video ham mumkin):</b>", reply_markup=kb)
        elif text == "STATISTIKA":
            stats = await db.get_stats()
            await message.answer(f"<b>BOT STATISTIKASI</b>\n\nJami: {stats['total']}\nBugun: {stats['today']}")
        elif text == "MAJBURIY OBUNA":
            await db.update_user(message.chat.id, mode="admin_sub_hub")
            active = await db.get_setting('subscription_active')
            is_active = active == '1'
            channels = await db.get_channels()
            ch_list = "\n".join([f"• {c['channel_id']}" for c in channels]) if channels else "(Kanallar yo'q)"
            
            msg = f"<b>MAJBURIY OBUNA SOZLAMALARI</b>\n\nHolat: {'YONIQ' if is_active else 'O\'CHIQ'}\nUlangan kanallar:\n{ch_list}"
            await message.answer(msg, reply_markup=get_sub_hub_keyboard(is_active))

    elif mode == 'admin_sub_hub':
        if text == "ORQAGA":
            await db.update_user(message.chat.id, mode="admin_main")
            await message.answer("Boshqaruv bo'limi", reply_markup=get_admin_keyboard())
        elif text in ["YOQISH", "O'CHIRISH"]:
            new_val = '1' if text == "YOQISH" else '0'
            await db.set_setting('subscription_active', new_val)
            await message.answer(f"Obuna tizimi {text} qilingan!")
            await admin_actions(message) # Reload hub
        elif text == "KANAL QO'SHISH":
            await db.update_user(message.chat.id, mode="admin_add_channel")
            kb = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="BEKOR QILISH")]], resize_keyboard=True)
            await message.answer("Kanalning Username (@kanal) yoki ID raqamini yuboring.", reply_markup=kb)
        elif text == "KANAL O'CHIRISH":
            channels = await db.get_channels()
            if not channels:
                await message.answer("O'chirish uchun kanallar yo'q.")
                return
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=f"O'CHIRISH: {c['channel_id']}", callback_data=f"del_ch_{c['id']}")] for c in channels
            ])
            await message.answer("Qaysi kanalni o'chirmoqchisiz?", reply_markup=kb)

    elif mode == 'admin_add_channel':
        if text == "BEKOR QILISH":
            await db.update_user(message.chat.id, mode="admin_sub_hub")
            await admin_actions(message)
            return
        
        try:
            member = await message.bot.get_chat_member(chat_id=text, user_id=message.bot.id)
            if member.status not in ['administrator', 'creator']:
                await message.answer("Bot bu kanalda admin emas!")
                return
        except Exception as e:
            await message.answer(f"Xatolik: Kanal topilmadi yoki bot admin emas.\n{e}")
            return
            
        await db.add_channel(text)
        await db.update_user(message.chat.id, mode="admin_sub_hub")
        await message.answer(f"Kanal {text} muvaffaqiyatli qo'shildi!")
        
    elif mode == 'admin_broadcast':
        if text == "BEKOR QILISH":
            await db.update_user(message.chat.id, mode="admin_main")
            await message.answer("Boshqaruv bo'limi", reply_markup=get_admin_keyboard())
            return
            
        await message.answer("Xabar tarqatilmoqda...")
        # (Very simple broadcast logic, for production needs background task/asyncio.gather)
        # Assuming postgres `users` table
        import asyncpg
        from core.config import DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME
        pool = await asyncpg.create_pool(user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT, database=DB_NAME)
        count = 0
        async with pool.acquire() as conn:
            users = await conn.fetch("SELECT chat_id FROM users")
            for u in users:
                if u['chat_id'] == message.chat.id: continue
                try:
                    await message.copy_to(chat_id=u['chat_id'])
                    count += 1
                except Exception:
                    pass
        await message.answer(f"Hisobot: Xabar {count} ta odamga bordi.")
        await db.update_user(message.chat.id, mode="admin_main")
        await message.answer("Boshqaruv bo'limi", reply_markup=get_admin_keyboard())

@router.callback_query(F.data.startswith('del_ch_'))
async def del_channel(callback: CallbackQuery):
    ch_id = int(callback.data.split('_')[-1])
    await db.delete_channel(ch_id)
    await callback.answer("Kanal o'chirildi")
    await callback.message.delete()

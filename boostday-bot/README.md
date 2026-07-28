# 🚀 Boostday bot — Telegram reja va vazifa boti

Kanalingizga **avtomatik kunlik rejalar**, TO-DO ro'yxatlari, challenge va
eslatmalar yuboradigan Telegram bot. Vazifalar tugmalar orqali belgilanadi,
kun oxirida avtomatik hisobot chiqadi.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Mini_App-2CA5E0?logo=telegram&logoColor=white)

---

## ✨ Imkoniyatlar

**6 xil reja turi:**

| Tur | Tavsif |
| :--- | :--- |
| `daily_todo` | Har kuni belgilangan vaqtda takrorlanadigan TO-DO ro'yxati |
| `todo` | Bir martalik vazifalar ro'yxati |
| `super_todo` | Vaqt cheklovli vazifalar — 50%, 75% va tugashiga 1 daqiqa qolganda ogohlantiradi |
| `daily_plan` | Kunlik reja (media bilan: rasm, video, audio, hujjat) |
| `challenge` | N kunlik challenge — progress bar va qolgan kunlar bilan |
| `reminder` | Oddiy eslatma |

**Qo'shimcha:**

- 🗂 **Bo'limlar** — vazifalarni nomlangan guruhlarga ajratish ("1-bo'lim: Ish")
- ✅ **Tugmali interfeys** — vazifani bosib bajarilgan/jarayonda deb belgilash, taymer
- 📊 **Avtomatik hisobotlar** — kunlik, haftalik, oylik va yillik statistika
- 🔄 **Rollover** — bajarilmagan vazifalar bo'lim tuzilishini saqlab ertangi kunga o'tadi
- 📱 **Telegram Mini App** — rejalarni qulay interfeysda boshqarish, galereyadan ko'p
  fayl yuklash
- 🌐 **Sayt integratsiyasi** — [`yordamchi-sayt`](../yordamchi-sayt) dan ham boshqarish

## 🏗️ Arxitektura

```
boostday-bot/
└── bot_py/
    ├── app/
    │   ├── main.py        # FastAPI: webhook + Mini App API
    │   ├── handlers.py    # buyruq va xabar handlerlari
    │   ├── callbacks.py   # inline tugma bosishlari
    │   ├── scheduler.py   # cron: rejalarni yuborish, hisobotlar
    │   ├── miniauth.py    # Mini App initData HMAC tekshiruvi
    │   ├── tg.py          # Telegram API qatlami
    │   └── config.py      # sozlamalar (.env dan)
    ├── deploy/            # systemd service + timer namunalari
    ├── miniapp.html       # Mini App frontend
    ├── run_polling.py     # lokal test uchun (webhook'siz)
    └── run_cron.py        # rejalashtirilgan vazifalar
```

Bot **webhook** rejimida ishlaydi (production) yoki **polling** rejimida
(lokal test). Rejalarni yuborish `run_cron.py` orqali — systemd timer yoki
oddiy cron har daqiqada chaqiradi.

## 🚀 Ishga tushirish

**Talablar:** Python 3.9+, PostgreSQL 12+ (sayt bilan bitta baza)

### 1. Botni yaratish

[@BotFather](https://t.me/BotFather) da yangi bot yarating va tokenni oling.
O'z Telegram ID'ingizni [@userinfobot](https://t.me/userinfobot) dan bilib oling.

### 2. O'rnatish

```bash
cd bot_py
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# .env ni to'ldiring: BOT_TOKEN, BOT_USERNAME, BOT_ADMIN_IDS, DB_* ...
```

Baza sxemasi [`yordamchi-sayt/database/schema.sql`](../yordamchi-sayt/database/schema.sql)
da — bot va sayt bitta PostgreSQL bazasidan foydalanadi, shuning uchun
`DB_*` qiymatlari ikkalasida bir xil bo'lishi kerak.

### 3. Sinash (lokal, webhook'siz)

```bash
python run_polling.py
```

Telegram'da botingizga `/start` yuboring.

### 4. Production (webhook)

```bash
# Serverda
uvicorn app.main:app --host 127.0.0.1 --port 8090

# Webhook'ni ro'yxatdan o'tkazish
python set_webhook.py
```

Rejalar o'z vaqtida yuborilishi uchun `run_cron.py` ni har daqiqada ishga
tushiring — `deploy/` papkasida tayyor systemd `service` + `timer` namunalari bor.

## 🔐 Xavfsizlik

- `.env` **hech qachon** git'ga qo'shilmaydi.
- `WEBHOOK_SECRET` va `SITE_SECRET` ni yarating: `openssl rand -hex 32`
- Mini App har so'rovda Telegram `initData` ni HMAC bilan tekshiradi — mijoz
  soxta `owner_id` yubora olmaydi, har kim faqat o'z rejalarini ko'radi.
- `SITE_SECRET` bo'sh bo'lsa, `initData`siz murojaat **umuman qabul qilinmaydi**
  (xavfsiz default).

## ⚙️ Sozlash

Kodda hech qanday token, ID yoki domen qattiq yozilmagan — hammasi `.env` orqali.
Masalan post oxiridagi imzo (`@bot_useri`) `BOT_USERNAME` dan olinadi; uni bo'sh
qoldirsangiz imzo umuman qo'shilmaydi.

To'liq ro'yxat: [`bot_py/.env.example`](bot_py/.env.example)

## 📄 Litsenziya

MIT — erkin foydalaning, o'zgartiring va tarqating.

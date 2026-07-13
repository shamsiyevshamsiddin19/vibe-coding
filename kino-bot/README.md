# 🎬 Kino Bot

[@Tarjimakinolarubot](https://t.me/Tarjimakinolarubot) — kino va seriallarni kod orqali qidirib
topish, TMDB integratsiyasi, inline rejim va to'liq web-admin panelli Telegram bot. Eski PHP
versiyadan **to'liq Python (Aiogram 3) + PostgreSQL**ga ko'chirilgan.

## ✨ Imkoniyatlari

| Funksiya | Tavsif |
| :--- | :--- |
| 🔎 Kod bo'yicha qidirish | Foydalanuvchi kod yuborsa, mos kino/serial darhol chiqadi |
| 🌐 TMDB integratsiyasi | Kino haqida qo'shimcha ma'lumot (rasm, tavsif, reyting) TMDB API'dan |
| 🔀 Inline rejim | Istalgan chatda `@Tarjimakinolarubot nomi` yozib, natijani ulashish |
| 🎲 Tasodifiy kino | Bazadan tasodifiy kontent tavsiya qilish |
| ⭐ Reyting va statistika | Kengaytirilgan foydalanish statistikasi |
| 🖥️ Web-admin panel | Master domen dropdown uslubida, kontent qo'shish/tahrirlash |
| 📥 Obuna tekshiruvi | Majburiy kanal/guruhga a'zolikni tekshirish |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Bot | Python 3.11+, [Aiogram 3](https://docs.aiogram.dev/) |
| Baza | PostgreSQL (`asyncpg`) |
| Web-server | `aiohttp` |
| Tashqi API | TMDB (kino ma'lumotlari) |

## 📁 Tuzilma

| Fayl / Papka | Vazifasi |
| :--- | :--- |
| `bot.py` | Kirish nuqtasi (polling + web-admin birga) |
| `config.py` | `.env`dan sozlamalarni o'qiydi |
| `db.py` | PostgreSQL ulanishi + sxema |
| `utils.py` | Caption yasash, obuna tekshiruvi, matn yordamchilari |
| `tmdb.py` | TMDB API bilan qidiruv |
| `keyboards.py` | Inline/reply klaviaturalar |
| `states.py` | FSM holatlari (admin kontent qo'shish oqimi) |
| `handlers/user.py` | `/start`, kod bo'yicha qidirish, menyular, reyting, tasodifiy kino |
| `handlers/admin.py` | Telegram ichidan admin panel (kontent qo'shish) |
| `handlers/inline.py` | Inline so'rovlarni qayta ishlash |
| `handlers/callbacks.py` | Obuna tasdiqlash, guruhga so'rov tugmalari |
| `web/admin.py` | Web-admin sahifalari (HTML) |
| `web/theme.py` | Master sayt bilan bir xil dizayn + bot dropdown |
| `web/server.py` | `aiohttp` runner |
| `migrate_mysql_to_pg.py` | Eski MySQL bazadan PostgreSQL'ga ko'chirish skripti |
| `migrate_from_json.py` | Eski JSON eksportdan ma'lumot import qilish |

## ⚙️ O'rnatish (Hetzner / Ubuntu)

```bash
sudo apt update && sudo apt install -y python3-venv postgresql
sudo -u postgres psql -c "CREATE USER kino WITH PASSWORD 'KUCHLI_PAROL';"
sudo -u postgres psql -c "CREATE DATABASE kino OWNER kino;"

cd /opt/kino
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # BOT_TOKEN, DATABASE_URL, TMDB_KEY va h.k. to'ldiring
python bot.py
```

## 🔑 `.env` o'zgaruvchilari

| O'zgaruvchi | Tavsif |
| :--- | :--- |
| `BOT_TOKEN` | BotFather tokeni |
| `ADMIN_IDS` | Admin Telegram ID'lari (vergul bilan) |
| `DATABASE_URL` | PostgreSQL ulanish satri |
| `TMDB_KEY` | TMDB API kaliti |
| `SUPPORT_GROUP`, `UPLOAD_CHANNEL`, `ARCHIVE_CHANNEL` | Bot bog'langan kanal/guruhlar |
| `WEB_ADMIN_USER` / `WEB_ADMIN_PASSWORD` | To'g'ridan-to'g'ri web-admin panelga kirish |
| `WEB_BRIDGE_SECRET` | Master domen dropdown orqali ulanish siri |

## 🔄 Eski MySQL bazani ko'chirish

```bash
pip install pymysql
export MYSQL_HOST=... MYSQL_USER=... MYSQL_PASS=... MYSQL_DB=...
python migrate_mysql_to_pg.py
```

## 🖥️ Web-admin

- To'g'ridan: `http://SERVER_IP:8080/admin` (`WEB_ADMIN_USER` / `WEB_ADMIN_PASSWORD`)
- Master domen dropdown orqali: `https://DOMEN/kino/admin`
  (master va kino `.env`larida bir xil `*_BRIDGE_SECRET` bo'lishi shart)

## 🔁 systemd (avto-ishga tushirish)

```ini
# /etc/systemd/system/kinobot.service
[Unit]
Description=Kino Bot
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/kino
ExecStart=/opt/kino/.venv/bin/python bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now kinobot
```

## 🔀 Inline rejimni yoqish

1. @BotFather → `/setinline` → botni tanlang → placeholder matn kiriting (masalan: `Kino nomi...`).
2. Istalgan chatda: `@Tarjimakinolarubot spider` → natijani bosing → bot orqali ochiladi.

# 📝 Subtitr Bot

[@subtitle_srtbot](https://t.me/subtitle_srtbot) — video yuborasiz → rejimni tanlaysiz →
tayyor subtitrli/tarjima qilingan videoni olasiz. Transkripsiya, tarjima, lug'at va
YouTube/Instagram'dan video yuklab olishni bitta botda birlashtirgan.

## ✨ Imkoniyatlari

| Rejim | Tavsif |
| :--- | :--- |
| `original` | Video tilida subtitr (transkripsiya) |
| `translate` | Boshqa tilga tarjima qilingan subtitr |
| `dual` | Ikki qatlamli subtitr (asl + tarjima birga) |
| `dual_vocab` | Ikki qatlam + suzuvchi lug'at (o'quv rejimi) |
| `srt` | Faqat `.srt` fayl (videoga kuydirmasdan) |
| `transcript` | To'liq matn transkripti |
| `vocabulary` | Videodan lug'at (so'z + chastota) |
| `audio` | Faqat audio ajratib olish |

| Qo'shimcha funksiya | Tavsif |
| :--- | :--- |
| 🔊 TTS | Matnni ovozga aylantirish |
| 📥 YouTube/Instagram yuklash | `yt-dlp` orqali havoladan video yuklab olish |
| 💳 Tariflar | Kunlik limit, ruxsat etilgan rejimlar tarifga bog'liq |
| 🎁 Donate / obuna tekshiruvi | Kanalga a'zolik va homiylik tizimi |
| 📱 Mini App | Telegram Mini App interfeysi |
| 🌐 Web admin panel | To'liq boshqaruv va sayt analitikasi |
| ⚡ Taqsimlangan qayta ishlash | Celery + `home_relay` orqali og'ir ishlarni bo'lish |
| 🔀 Inline rejim | Istalgan chatda botdan foydalanish |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Bot | Python 3.11+, [Aiogram 3](https://docs.aiogram.dev/) |
| Transkripsiya | Groq Whisper (`faster-whisper` zaxira) |
| Tarjima / AI | OpenAI, Anthropic Claude, Google Gemini, Groq |
| Video/audio | FFmpeg |
| Video yuklash | `yt-dlp` |
| Navbat | Celery (og'ir vazifalar uchun) |
| Web | `aiohttp` (admin, Mini App, yuklab olish serveri) |
| To'lov | Click |

## 📁 Tuzilma

| Papka | Vazifasi |
| :--- | :--- |
| `bot/handlers/` | `start`, `video`, `tts`, `subscribe`, `donate`, `feedback`, `inline`, `admin` |
| `worker/` | Og'ir ishlar: `transcribe`, `translate`, `tts`, `pipeline`, `ffmpeg_utils`, `vocab`, `distributed`, `home_relay` |
| `web/` | `admin.py`, `admin_control.py`, `click.py` (to'lov), `miniapp.py`, `dlserver.py`, `site_analytics.py` |
| `miniapp/` | Telegram Mini App frontend (HTML/JS/CSS) |
| `tools/` | Yordamchi skriptlar (`home_relay_client.py` va h.k.) |
| `config.py` | Sozlamalar (`.env`dan) |
| `tariffs.py` | Tarif rejimlari va limitlar |
| `access.py` | Foydalanuvchi ruxsatlari |
| `db/` | Ma'lumotlar bazasi qatlami |

## ⚙️ Talablar

| Talab | Izoh |
| :--- | :--- |
| Python | 3.11+ |
| FFmpeg | Tizimga o'rnatilgan va `PATH`da bo'lishi shart (`ffmpeg -version` bilan tekshiring) |
| Telegram bot tokeni | [@BotFather](https://t.me/BotFather) orqali |
| Groq API kaliti | [console.groq.com](https://console.groq.com) |

## 📥 O'rnatish

```bash
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env          # BOT_TOKEN va GROQ_API_KEY'ni kiriting
python -m bot.main
```

## 🔑 `.env` asosiy o'zgaruvchilari

| O'zgaruvchi | Tavsif |
| :--- | :--- |
| `BOT_TOKEN` | BotFather tokeni |
| `GROQ_API_KEY` | Transkripsiya (Whisper) uchun |
| `WHISPER_MODEL` | Modelning nomi (standart: `whisper-large-v3`) |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Web admin panel kirishi |
| `SUB_FONT`, `SUB_FONT_SIZE` | Subtitr ko'rinishi |
| `MAX_UPLOAD_MB` | Yuklab olish hajmi chegarasi |
| `YTDLP_MAX_HEIGHT`, `YTDLP_COOKIES_BROWSER` | YouTube/Instagram yuklab olish sozlamalari |
| `MINIAPP_DEV`, `MINIAPP_MAX_MB` | Mini App sozlamalari |
| `WORK_DIR` | Vaqtinchalik fayllar papkasi |

## 📌 Eslatmalar

- **Fayl hajmi**: oddiy Telegram Bot API 20MB gacha qabul qiladi. Kattaroq fayllar uchun
  Local Bot API server kerak bo'ladi.
- **Shrift**: standart `Arial`. Brendli ko'rinish uchun `Inter.ttf` o'rnatib `SUB_FONT=Inter`
  qiling.
- **Bloklanmaydi**: og'ir ishlar asinxron/`Celery` orqali, botning asosiy oqimini
  to'xtatmaydi.

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

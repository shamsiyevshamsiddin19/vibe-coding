# ❓ Quiz Bot

[@tez_quizbot](https://t.me/tez_quizbot) — `.txt` fayldan savollarni o'qib, Telegram
**Quiz Poll** rejimida interaktiv viktorina o'tkazuvchi bot. Ketma-ket savol beradi,
javoblarni avtomatik tekshiradi va natijani hisoblaydi.

## ✨ Imkoniyatlari

| Funksiya | Tavsif |
| :--- | :--- |
| 📄 Ikki fayl formati | Harfli (A/B/C/D) va `+/-` belgili formatlarni bir vaqtda tushunadi |
| 🎯 Telegram Quiz Poll | Native Telegram viktorina (to'g'ri/noto'g'ri avtomatik belgilanadi) |
| 🏆 Natija kartochkasi | Test oxirida ball va sertifikat rasm shaklida (Pillow) |
| 👮 Admin nazorati | Faqat ruxsat etilgan foydalanuvchilar test yuklay oladi |
| 🌐 Web admin panel | Testlarni boshqarish uchun veb-interfeys |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Bot | Python 3.11+, [Aiogram 3](https://docs.aiogram.dev/) |
| Baza | PostgreSQL (`asyncpg`) |
| Rasm | Pillow (natija kartochkasi) |
| Web | `aiohttp` (admin panel) |

## 📁 Tuzilma

| Fayl / Papka | Vazifasi |
| :--- | :--- |
| `bot.py` | Asosiy bot mantig'i |
| `main.py` | Kirish nuqtasi |
| `parser.py` | Fayldan savollarni o'qish (ikki format) |
| `game.py` | Viktorina o'yin oqimi (savol → javob → ball) |
| `cards.py` | Natija kartochkasi (rasm) generatsiyasi |
| `db.py` | PostgreSQL ulanishi |
| `config.py` | Sozlamalar (token, adminlar) |
| `web/` | Admin panel |
| `deploy/` | nginx konfiguratsiyasi va systemd service fayli |
| `quizzes/` | Saqlangan testlar (avtomatik yaratiladi) |

## ⚙️ O'rnatish

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # yoki .env faylini qo'lda yarating (pastga qarang)
python main.py
```

## 📄 Fayl formatlari

Bot ikkala formatni ham (hatto bitta faylda aralash) tushunadi:

**1-format (harfli):**
```
1. Savol matni
A) Variant
B) Variant
C) Variant
D) Variant
Javob: A
```

**2-format (+/- belgili — to'g'ri javob `+`):**
```
# Savol matni
+ To'g'ri variant
- Variant
- Variant
- Variant
```

## 💬 Foydalanish

| Qadam | Amal |
| :-: | :--- |
| 1 | Botga `/start` yozing |
| 2 | `.txt` faylni yuboring → bot uni saqlaydi |
| 3 | **▶️ Testni boshlash** tugmasini bosing |
| 4 | Savollarga javob bering, oxirida natijangizni ko'rasiz |

| Buyruq | Vazifasi |
| :--- | :--- |
| `/testlar` | Saqlangan testlar ro'yxati |
| `/stop` | Joriy testni to'xtatish |

## 🔒 `.env` o'zgaruvchilari

| O'zgaruvchi | Tavsif |
| :--- | :--- |
| `BOT_TOKEN` | BotFather tokeni |
| `BOT_USERNAME` | Bot username'i (havolalar uchun) |
| `ADMIN_IDS` | Test yuklashga ruxsat etilgan Telegram ID'lar (vergul bilan). Bo'sh qoldirilsa — hamma yuklay oladi |
| `DATABASE_URL` | PostgreSQL ulanish satri |

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

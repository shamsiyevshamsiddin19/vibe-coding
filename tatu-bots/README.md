# 🎓 TATU Bots

[@tatulmsbot](https://t.me/tatulmsbot) — TATU (Toshkent Axborot Texnologiyalari
Universiteti) talabalari uchun LMS tizimiga to'g'ridan-to'g'ri ulanadigan yordamchi
Telegram bot. Talaba profilini, jadvalini, vazifalarini va GPA'sini Telegram ichida
ko'rsatadi.

## ✨ Imkoniyatlari

| Funksiya | Tavsif |
| :--- | :--- |
| 🔐 LMS login | `lms.tuit.uz` hisobiga to'g'ridan-to'g'ri kirish (sessiya-cookie orqali) |
| 👤 Profil | Yo'nalish, kurs, guruh va boshqa shaxsiy ma'lumotlar |
| ⭐ GPA | Joriy o'zlashtirish ko'rsatkichi |
| 📅 Dars jadvali | Kunlik/haftalik jadval, dars turi bo'yicha (ma'ruza, amaliyot, laboratoriya, seminar) |
| 📝 Vazifalar | Berilgan topshiriqlar va muddatlar |
| ❌ Qoldirilgan darslar | Yo'qlama bo'yicha eslatma |
| 🏁 Yakuniy nazorat | Final imtihonlar jadvali |
| ⏰ Eslatmalar | Rejalashtiruvchi (`scheduler`) orqali avtomatik xabarlar |
| 🌐 Web admin panel | Foydalanuvchilarni boshqarish |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Bot | Python 3.11+, [Aiogram 3](https://docs.aiogram.dev/) |
| LMS klienti | `httpx` (sessiya-cookie asosida, faqat serverdan ishlaydi) |
| HTML parsing | `lxml` |
| Shifrlash | `cryptography` (foydalanuvchi LMS parolini xavfsiz saqlash) |
| Rejalashtiruvchi | `APScheduler` |
| Baza | `aiosqlite` |

## 📁 Tuzilma

| Papka / Fayl | Vazifasi |
| :--- | :--- |
| `run.py` | Kirish nuqtasi (`python run.py`) |
| `core/config.py` | Sozlamalar (`.env`dan) |
| `core/db.py` | Ma'lumotlar bazasi qatlami |
| `core/crypto.py` | LMS login ma'lumotlarini shifrlash |
| `core/util.py` | Yordamchi funksiyalar |
| `bots/lms_bot.py` | Asosiy foydalanuvchi handlerlari |
| `bots/inline.py` | Inline rejim |
| `bots/scheduler.py` | Avtomatik eslatmalar |
| `bots/admin_web.py` | Web admin panel |
| `bots/texts.py` | Xabar shablonlari (profil, jadval, vazifa va h.k.) |
| `lms/client.py` | `lms.tuit.uz` bilan muloqot (httpx) |
| `lms/parse.py` | HTML/JSON javoblarni tahlil qilish |
| `lms/models.py` | Ma'lumot modellari (Profile, Course, Task, ScheduleItem va h.k.) |
| `lms/stats.py` | GPA va statistik hisob-kitoblar |
| `deploy/` | systemd service, watchdog timer va skript |
| `scripts/smoke_lms.py` | LMS ulanishini tekshirish skripti |

## ⚙️ O'rnatish

```bash
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # BOT_TOKEN va boshqa sozlamalarni to'ldiring (fayl bo'lmasa yarating)
python run.py
```

> ⚠️ `lms.tuit.uz` sandbox/test muhitlarni bloklaydi — bot **faqat haqiqiy serverdan**
> to'g'ri ishlaydi.

## 🔁 Deploy (systemd + watchdog)

`deploy/` papkasida tayyor systemd birliklari bor:

| Fayl | Vazifasi |
| :--- | :--- |
| `tatulmsbot.service` | Botning asosiy systemd xizmati |
| `tatulms-watchdog.service` / `.timer` | Bot ishlamay qolsa avtomatik qayta ishga tushirish |
| `watchdog.sh` | Watchdog skripti |

```bash
sudo cp deploy/*.service deploy/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tatulmsbot tatulms-watchdog.timer
```

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

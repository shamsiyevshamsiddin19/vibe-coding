# 🗓️ Sessiya Tayyorgarlik Bot

Talabalarga sessiyaga tayyorgarlik materiallarini sotuvchi Telegram bot. Click orqali
onlayn to'lov qabul qiladi va do'stni taklif qilib bepul materiallar olish imkonini
beruvchi referal tizimi bilan ishlaydi. Eski PHP botdan (`baza_bot.php`) toza Python
kodiga 1:1 mantiq bilan ko'chirilgan.

## ✨ Imkoniyatlari

| Funksiya | Tavsif |
| :--- | :--- |
| 🛒 Mahsulotlar | Sessiya tayyorgarlik materiallarini ko'rish va sotib olish |
| 💳 Click to'lov | To'lov havolasi yaratish va tasdiqlashni qabul qilish |
| 🔑 Aktivatsiya kaliti | To'langandan so'ng materialga kirish kaliti generatsiyasi |
| 🎁 Referal tizimi | Do'stni taklif qilib bonus ball to'plash — yetarli bo'lsa bepul olish |
| 🌐 Web admin panel | Mahsulot, foydalanuvchi va to'lovlarni boshqarish |
| 🌉 Eski server bilan ko'prik | `baza_bridge.php` orqali eski PHP infratuzilmasi bilan moslashuvchanlik |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Bot | Python 3.11+, [Aiogram 3](https://docs.aiogram.dev/) |
| Baza | PostgreSQL (`asyncpg`) |
| To'lov | Click API |
| Web | `aiohttp` (admin panel) |
| Ko'prik | PHP (`baza_bridge.php`, `export_baza.php`) — eski server bilan moslik uchun |

## 📁 Tuzilma

| Fayl | Vazifasi |
| :--- | :--- |
| `main.py` | Kirish nuqtasi |
| `bot.py` | Asosiy handlerlar (baza-asoslangan step/temp FSM) |
| `config.py` | Sozlamalar (`.env`dan) |
| `db.py` | PostgreSQL ulanishi |
| `keyboards.py` | Klaviaturalar |
| `services.py` | Aktivatsiya kaliti, Click to'lov havolasi yasash |
| `click_api.py` | Click `prepare`/`complete` so'rovlarini qayta ishlash |
| `admin_web.py` | Web admin panel |
| `baza_bridge.php` | Eski PHP serverdan yangi serverga so'rov yo'naltirish ko'prigi |
| `export_baza.php` | Eski bazadan ma'lumot eksport qilish |
| `import_data.py` | Eksport qilingan ma'lumotni yangi bazaga import qilish |
| `schema.sql` | PostgreSQL jadval sxemasi (`users`, `products`, `payments`, `referrals`, `settings`) |
| `deploy.sh` | Serverga avtomatik o'rnatish skripti (PostgreSQL, venv, import) |

## ⚙️ O'rnatish

```bash
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # BOT_TOKEN, DATABASE_URL va h.k. to'ldiring
python main.py
```

Yoki tayyor skript orqali (Ubuntu server, PostgreSQL + venv + import birga):

```bash
bash deploy.sh
```

## 🔑 `.env` asosiy o'zgaruvchilari

| Guruh | O'zgaruvchilar |
| :--- | :--- |
| Bot | `BOT_TOKEN`, `BOT_USERNAME`, `ADMIN_IDS` |
| Biznes | `SECRET_SALT`, `BASE_PRICE`, `REFERRALS_FOR_FREE` |
| Click to'lov | `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_MERCHANT_USER_ID`, `CLICK_BASE_URL`, `CLICK_TX_PREFIX` |
| Ko'prik | `INTERNAL_SECRET` (eski PHP bilan bir xil bo'lishi shart) |
| Web | `WEB_HOST`, `WEB_PORT` |
| Baza | `DATABASE_URL` |

## 🗃️ Ma'lumotlar bazasi sxemasi

| Jadval | Vazifasi |
| :--- | :--- |
| `users` | Foydalanuvchilar va referal balansi |
| `products` | Sotiladigan tayyorgarlik materiallari |
| `payments` | Click orqali amalga oshirilgan to'lovlar |
| `referrals` | Kim kimni taklif qilgani va bonuslar |
| `settings` | Botning umumiy sozlamalari |

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

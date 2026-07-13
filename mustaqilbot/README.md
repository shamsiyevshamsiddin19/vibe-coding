# 📚 Mustaqil Ish Bot

[@talabaxizmatlaribot](https://t.me/talabaxizmatlaribot) — O'zbekiston talabalari uchun
sun'iy intellekt yordamida akademik hujjatlarni avtomatik tayyorlab beruvchi Telegram bot.

## ✨ Imkoniyatlari

| Hujjat turi | Tavsif |
| :--- | :--- |
| Referat | Standart formatlangan, manbalar bilan |
| Mustaqil ish | Fanga moslashtirilgan tuzilma |
| Kurs ishi | Kengaytirilgan, bo'limlarga bo'lingan |
| Diplom ishi | To'liq ilmiy apparat bilan |
| Tezis | Qisqa va aniq |
| Ilmiy maqola | Iqtibos va adabiyotlar ro'yxati bilan |
| Taqdimot (slayd) | 12 xil maket, 6 rang-mavzu, gradient fon |
| Krossvord | Fan bo'yicha avtomatik generatsiya |

| Xususiyat | Tavsif |
| :--- | :--- |
| 📝 Professional formatlash | Haqiqiy Word jadvallari, LaTeX formulalar (OMML), grafik/diagrammalar |
| 🎯 Fanga moslashuvchi | Iqtisodga statistika, matematikaga formulalar, huquqqa qonun havolalari |
| 📏 Aniq hajm | Buyurtma qilingan bet soniga kalibrlangan natija |
| 🔍 Haqiqiy manbalar | Web-search orqali real adabiyot va statistika |
| 💳 To'lov | Click integratsiyasi, balans tizimi |
| 🎁 Referal | Do'stni taklif qilib bonus/cashback olish |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Bot | Python 3.11+, [Aiogram 3](https://docs.aiogram.dev/) |
| Sun'iy intellekt | Anthropic Claude (asosiy) + OpenAI (zaxira) |
| Baza | PostgreSQL + SQLAlchemy (async) |
| Hujjatlar | `python-docx`, `python-pptx`, `reportlab`, `Pillow` |
| Formulalar | `latex2mathml` + `mathml2omml` (LaTeX → Word formula) |
| Web | `aiohttp` (admin panel + Click webhook) |
| To'lov | Click API (PHP ko'prik orqali) |

## 📁 Arxitektura

| Papka | Vazifasi |
| :--- | :--- |
| `ai/` | AI promptlari va provayder qatlami (Claude + OpenAI) |
| `bot/` | Telegram handlerlar, klaviaturalar, FSM holatlar |
| `db/` | SQLAlchemy modellar va CRUD |
| `docs/` | Hujjat generatorlari (docx, pdf, pptx, charts, crossword) |
| `payment/` | Click to'lov integratsiyasi |
| `services/` | Generatsiya xizmati (navbat, bo'laklab yozish) |
| `web/` | Admin panel va Click webhook |
| `config.py` | Sozlamalar (`.env`dan) |
| `main.py` | Kirish nuqtasi |
| `mustaqil_bridge.php` | Eski PHP tomonidan yangi serverga so'rov yo'naltirish ko'prigi |

## ⚙️ O'rnatish

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # BOT_TOKEN, ANTHROPIC_API_KEY, DATABASE_URL, Click sozlamalari
python main.py
```

## 🔑 `.env` asosiy o'zgaruvchilari

| Guruh | O'zgaruvchilar |
| :--- | :--- |
| Bot | `BOT_TOKEN`, `BOT_USERNAME`, `ADMIN_IDS` |
| Admin panel | `ADMIN_USER`, `ADMIN_PASSWORD` |
| Baza | `DATABASE_URL` |
| AI | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `CLAUDE_MODEL`, `OPENAI_MODEL` |
| Click to'lov | `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY`, `CLICK_MERCHANT_USER_ID`, `BRIDGE_SECRET` |
| Narxlar / bonuslar | `PRICE_*`, `REF_BONUS_*`, `MIN_TOPUP` |

> Batafsil ro'yxat va izohlar uchun `.env.example` fayliga qarang — barcha qiymatlar
> xavfsizlik uchun bo'sh qoldirilgan.

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

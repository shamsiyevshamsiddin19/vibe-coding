# 📚 Yordamchi — shaxsiy o'quv platformasi

Bitta saytda: **testlar, lug'at, maqsadlar, sport, dars jadvali, grammatika va arxiv**.
O'zingiz uchun shaxsiy o'quv makoni — ma'lumotlar o'z serveringizda saqlanadi,
hech qanday tashqi xizmatga bog'liq emas.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Imkoniyatlar

| Bo'lim | Nima qiladi |
| :--- | :--- |
| **Testlar** | Fan/baza yaratish, `.txt` dan savol yuklash, test yechish, xatolar ustida ishlash, natijalar tarixi va grafik. LaTeX (`[tex]...[/tex]`) qo'llab-quvvatlanadi |
| **Lug'at** | So'z qo'shish, flashcard, yodlash svaypi, test rejimi va **SRS** (interval takrorlash: 1-3-7-16-35-90 kun) |
| **Tillar / Grammatika** | Mavzular bo'yicha matn + test + interaktiv o'yin (4 tur: to'ldirish, saralash, moslashtirish, tartiblash) |
| **Maqsadlar** | Maqsad va deadline'lar, bosh sahifada eng yaqinlari ko'rinadi |
| **Sport** | 12 kategoriya, mashqlar, og'irlik o'sishi tarixi, dam olish taymeri, media (rasm/video) biriktirish |
| **Kun hisobi** | Haftalik dars jadvali — saytdan tahrirlanadi, juft/toq hafta almashinuvi bilan |
| **Arxiv** | Nusxalar, saytlar, qoidalar + JSON eksport/import |
| **Faollik** | Kunlik seriya (streak) va oxirgi 7 kun ko'rsatkichi |

Qo'shimcha: qorong'u/yorug' mavzu, shrift o'lchami, menyu bo'limlarini yashirish,
PWA (telefon bosh ekraniga o'rnatiladi), to'liq zaxira eksporti.

## 🏗️ Arxitektura

```
yordamchi-sayt/
├── index.html              # SPA qobiq (hash-router)
├── assets/
│   ├── css/app.css         # dizayn tizimi
│   ├── js/app2/            # modullar: quiz, vocab, sport, kun, goals, arxiv...
│   └── js/core/            # umumiy: router/api, localStorage↔server sinxron, ikonlar
├── backend_py/
│   ├── app/handlers/       # API endpointlari (har bo'lim uchun alohida fayl)
│   ├── app/config.py       # sozlamalar (.env dan)
│   └── deploy/             # nginx + systemd namunalari
└── database/schema.sql     # PostgreSQL sxemasi
```

**Frontend build talab qilmaydi** — oddiy vanilla JS, `npm install` shart emas.
Ko'p ma'lumot `localStorage`da saqlanadi va `core/remote-storage.js` uni avtomatik
serverga sinxronlaydi; faqat katta yoki so'rov talab qiladigan narsalar (testlar,
natijalar, mavzular) bazada.

## 🚀 Ishga tushirish

**Talablar:** Python 3.9+, PostgreSQL 12+

```bash
# 1) Baza
sudo -u postgres psql -c "CREATE USER yordamchi WITH PASSWORD 'parolingiz';"
sudo -u postgres psql -c "CREATE DATABASE yordamchi OWNER yordamchi;"
psql -U yordamchi -d yordamchi -f database/schema.sql

# 2) Backend
cd backend_py
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # va qiymatlarni to'ldiring (DB_PASS, SESSION_SECRET...)

# 3) Ishga tushirish
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend'ni ham shu server tarqatishi uchun `.env` da `SERVE_STATIC=true` qiling,
so'ng brauzerda `http://127.0.0.1:8000` ni oching. Ishlab chiqarishda (production)
esa `SERVE_STATIC=false` qoldirib, statikani nginx tarqatgani ma'qul —
namuna: `backend_py/deploy/nginx.conf`.

## 🔐 Xavfsizlik

- `.env` **hech qachon** git'ga qo'shilmaydi (`.gitignore`da).
- `SESSION_SECRET` ni albatta yarating: `openssl rand -hex 32`
- Internetga ochiq serverda `REQUIRE_AUTH=true` qoldiring — aks holda manzilni
  bilgan har kim ma'lumotlaringizni o'qiy va o'zgartira oladi.
- Ro'yxatdan o'tish faqat **birinchi** akkaunt uchun ochiq, keyin avtomatik yopiladi.

## ⚙️ Sozlash

Loyihada shaxsiy ma'lumot qattiq yozilmagan — hammasi sozlanadi:

- **Dars jadvali** bo'sh boshlanadi, saytdagi "+" tugmasi orqali to'ldiriladi.
  Tayyor jadval bilan tarqatmoqchi bo'lsangiz — `assets/js/app2/kun.js` dagi
  `DEFAULT_SCHEDULE` ni to'ldiring (format faylning boshida izohlangan).
- **Juft/toq hafta** boshlanishi: o'sha faylda `REF_WEEK_START`.
- **Domen, baza, kalitlar** — barchasi `.env` orqali.

## 🤖 Boostday bot bilan integratsiya (ixtiyoriy)

Saytdagi "Boost" bo'limi [`boostday-bot`](../boostday-bot) API'siga proxy qiladi.
Ishlatish uchun `.env` da `BOOST_API_URL` va `BOOST_SITE_SECRET` ni to'ldiring
(kalit botning `SITE_SECRET` i bilan bir xil bo'lishi shart). Botni ishlatmasangiz —
bo'sh qoldiring, sayt shusiz ham to'liq ishlayveradi.

## 📄 Litsenziya

MIT — erkin foydalaning, o'zgartiring va tarqating.

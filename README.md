# 🚀 Vibe Coding

Ushbu repozitoriyada turli xil Telegram botlar, foydali skriptlar va dasturlar jamlangan. Loyihalar asosan zamonaviy texnologiyalar (Python, Aiogram 3, Flutter) yordamida ishlab chiqilgan bo'lib, o'ziga xos vazifalarni bajarishga mo'ljallangan.

---

## 📂 Loyihalar Ro'yxati

| Loyiha Nomi | Tavsif | Texnologiyalar |
| :--- | :--- | :--- |
| 📄 **[document-convertor](./document-convertor)** | Rasm/Fayl→PDF/ZIP, Matn→DOCX, PDF↔DOCX, Office→PDF, OCR, PDF birlashtirish/qirqish/watermark qiluvchi bot. | `Python`, `Aiogram 3`, `PostgreSQL` |
| 🎬 **[kino-bot](./kino-bot)** | Telegram orqali kino va seriallarni qidirib topish hamda yuklab olish imkonini beruvchi bot. | `Python`, `Aiogram 3`, `PostgreSQL` |
| 📚 **[mustaqilbot](./mustaqilbot)** | Talabalar uchun akademik yordamchi va mustaqil ishlarni tayyorlashda ko'maklashuvchi AI bot. | `Python`, `Aiogram`, `AI` |
| ❓ **[quiz-bot](./quiz-bot)** | Foydalanuvchilar o'rtasida interaktiv savol-javoblar (viktorina) o'tkazuvchi mukammal Telegram bot. | `Python`, `Aiogram`, `Database` |
| 🗓️ **[sessiyabot](./sessiyabot)** | Sessiyaga tayyorgarlik materiallari sotuvchi bot — Click to'lov, referal va HWID-aktivatsiya bilan. | `Python`, `Aiogram 3`, `PostgreSQL` |
| 📝 **[subtitr-bot](./subtitr-bot)** | Videolarga avtomatik tarzda subtitr yaratib va qo'shib beruvchi Telegram bot. | `Python`, `FFmpeg`, `Aiogram` |
| 💻 **[subtitr-desktop](./subtitr-desktop)** | Subtitr yaratish jarayonini kompyuterda (desktop) osonlashtiruvchi ilova. | `Flutter`, `Python` |
| 🎓 **[tatu-bots](./tatu-bots)** | TATU talabalari uchun maxsus mo'ljallangan yordamchi botlar to'plami (@tatulmsbot va boshqalar). | `Python`, `API` |
| 🛒 **[wstore](./wstore)** | Raqamli mahsulotlar (kod loyihalari, botlar, saytlar) sotish marketpleysi — wstore.uz. | `Next.js`, `TypeScript`, `Prisma`, `PostgreSQL` |

---

## ⚙️ O'rnatish va Ishlatish

Har bir loyihaning o'ziga xos ishlash tartibi va arxitekturasi mavjud. Odatda loyihalarni ishga tushirish uchun quyidagi umumiy qadamlar bajariladi:

1. O'zingizga kerakli loyiha papkasiga kiring (masalan, `cd quiz-bot`).
2. Kerakli kutubxonalarni o'rnating: 
   ```bash
   pip install -r requirements.txt
   ```
3. O'zgaruvchilarni sozlash uchun `.env` faylini o'zingizning ma'lumotlaringiz asosida to'ldiring.
4. Asosiy dasturni ishga tushiring: 
   ```bash
   python bot.py
   ```
*(Eslatma: Ayrim loyihalarda ishga tushirish tartibi farq qilishi mumkin. Ularning ichki papkalarini ko'rib chiqish tavsiya etiladi).*

---

## 👨‍💻 Muallif

**Shamsiddin Shamsiyev**
- GitHub: [@shamsiyevshamsiddin19](https://github.com/shamsiyevshamsiddin19)
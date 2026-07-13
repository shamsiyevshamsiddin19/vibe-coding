# 🌐 shamsiyev.uz

Shamsiddin Shamsiyev — Backend Developer'ning shaxsiy portfolio sayti.

**Live:** [shamsiyev.uz](https://shamsiyev.uz)

## ✨ Bo'limlar

| Sahifa | Tavsif |
| :--- | :--- |
| Bosh sahifa (`index.html`) | Hero, "men haqimda", ko'nikmalar, loyihalar, blog, aloqa |
| CV / Resume (`cv.html`, `resume.html`) | Chop etish uchun tayyor tarjimai hol sahifalari |
| Qiziqishlar | Kitoblar, filmlar, sport, sayohat, g'oyalar bo'yicha alohida sahifalar |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| Frontend | Static HTML / CSS / Vanilla JavaScript (freymvorksiz) |
| Shriftlar | Google Fonts |
| Ikonkalar | RemixIcon (CDN) |
| Kino ma'lumotlari | TMDB API |
| Kontakt forma | [FormSubmit](https://formsubmit.co) |
| Tillar | EN / RU / UZ (`assets/js/i18n.js`) |
| Hosting | Cloudflare Pages |
| Analitika | Cloudflare Pages Function orqali o'ziga xos tashrif hisoblagichi |

## 📁 Tuzilma

| Fayl / Papka | Vazifasi |
| :--- | :--- |
| `index.html` | Bosh sahifa (hero, about, skills, projects, blog, contact) |
| `cv.html` / `resume.html` | CV va rezyume sahifalari |
| `books.html`, `movies.html`, `sport.html`, `travel.html`, `ideas.html` | Qiziqish sahifalari |
| `assets/css/` | Uslub fayllari |
| `assets/js/` | Sahifa skriptlari — **manba (source of truth)**, to'g'ridan-to'g'ri shu yerni tahrirlang |
| `assets/images/` | Rasmlar |
| `functions/api/` | Cloudflare Pages Functions (tashrif hisoblagich, analitika) |

## 🛠️ Build (minifikatsiya)

`index.html` **minifikatsiya qilingan** fayllarni (`*.min.css` / `*.min.js`) yuklaydi.
`assets/` ostidagi `.js`/`.css` fayllar — manba, ularni tahrirlagandan keyin minifikatsiya
qilingan versiyalarni qayta yaratish kerak:

```bash
npm install    # birinchi marta (esbuild o'rnatiladi)
npm run build  # assets/css/main.min.css va assets/js/*.min.js larni qayta yasaydi
```

> Eskirgan minifikatsiya qilingan fayllar bo'lmasligi uchun **Cloudflare Pages build
> buyrug'ini** `npm run build` qilib qo'ying — shunda har bir deploy'da avtomatik
> qayta yasaladi.

## 🚀 Lokal ishga tushirish

```bash
npm start        # `npx serve` orqali papkani serverga chiqaradi
# yoki oddiygina index.html faylini brauzerda oching
```

## 📦 Deploy

| Bosqich | Tavsif |
| :--- | :--- |
| Hosting | Cloudflare Pages |
| Avtomatik deploy | GitHub'ga push qilish **o'z-o'zidan saytni yangilamaydi** — Cloudflare Pages deploy jarayoni ishga tushishi kerak |
| Build buyrug'i | `npm run build` (Cloudflare Pages sozlamalarida o'rnatilgan bo'lishi kerak) |

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

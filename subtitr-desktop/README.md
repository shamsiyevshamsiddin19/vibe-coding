# 💻 Subtitr Desktop

Video subtitr yozish va tarjima qilish uchun **Windows desktop ilova** — Flutter GUI +
Python backend. `Subtitr Bot`ning kompyuter versiyasi, cheklovlarsiz (fayl hajmi, tezlik)
ishlash uchun.

## ✨ Imkoniyatlari

| Funksiya | Tavsif |
| :--- | :--- |
| 🎙️ Transkripsiya | Groq Whisper yoki lokal `faster-whisper` |
| 🌍 Tarjima | OpenAI / Anthropic Claude / Google Gemini / Groq — tanlash imkoni |
| 📖 Lug'at | Lemma + chastota tahlili, o'quv uchun so'z animatsiyasi |
| 🔥 Apparat kodlash | NVENC / QSV / AMF — GPU orqali tez subtitr kuydirish (FFmpeg) |
| 📥 Video yuklash | YouTube, Instagram va boshqa saytlardan (`yt-dlp`) |
| 🧩 Chrome kengaytmasi | "Subtitr Grabber" — sahifadagi video oqim havolasini topib beradi |

## 🧰 Texnologiyalar

| Qatlam | Vosita |
| :--- | :--- |
| GUI | Flutter (Windows desktop) |
| Backend | Python (`desktop_processor.py`, PyInstaller bilan `.exe`ga qotiriladi) |
| Video/audio | FFmpeg (apparat kodlash bilan) |
| Video yuklash | `yt-dlp` |
| O'rnatuvchi | Inno Setup |

## 📁 Tuzilma

| Fayl / Papka | Vazifasi |
| :--- | :--- |
| `desktop_processor.py` | Python backend — barcha og'ir ishlov (transkripsiya, tarjima, kuydirish) |
| `subtitr_app/` | Flutter Windows desktop GUI |
| `chrome-extension/` | "Subtitr Grabber" Chrome kengaytmasi |
| `build_release.ps1` | To'liq release (`.exe` + o'rnatuvchi + zip) yig'ish skripti |
| `installer.iss` | Inno Setup o'rnatuvchi skripti |
| `.env.example` | API kalitlar namunasi (dastur ichida ham kiritish mumkin) |

## ⚙️ Sozlash

API kalitlarni odatda **dastur ichidagi "API kalitlar" oynasidan** kiritasiz — alohida
`.env` fayl shart emas. Fayl orqali sozlamoqchi bo'lsangiz:

```bash
cp .env.example .env
# GROQ_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY'dan kerakligini kiriting
```

| O'zgaruvchi | Xizmat |
| :--- | :--- |
| `GROQ_API_KEY` | Whisper transkripsiya + tez tarjima (bepul) |
| `OPENAI_API_KEY` | Eng sifatli tarjima |
| `GEMINI_API_KEY` | Muqobil tarjima |
| `ANTHROPIC_API_KEY` | Sifatli va tejamkor tarjima (Claude) |

## 📌 Muhim eslatma

Bu papkada faqat **manba kod** bor. Quyidagilar reponi shishirmasligi uchun repoga
**qo'shilmagan**:

- Katta binary fayllar (`ffmpeg.exe`, `ffprobe.exe`, `yt-dlp.exe`) — build qilishdan oldin
  `tools/` papkasiga qo'lda qo'shish kerak.
- Build/dist chiqishlari va tayyor o'rnatuvchi fayllar.
- `.env` — hech qachon repoga qo'shilmaydi, faqat bo'sh namuna (`.env.example`) bor.

## 📄 Litsenziya

Shaxsiy loyiha. Barcha huquqlar mualliflikда saqlanadi.

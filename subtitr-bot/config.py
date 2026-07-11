"""Loyiha sozlamalari (.env dan o'qiladi)."""
from __future__ import annotations
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    bot_token: str = os.getenv("BOT_TOKEN", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    whisper_model: str = os.getenv("WHISPER_MODEL", "whisper-large-v3")
    # API limit monitoringi (admin "API & Limitlar" sahifasi).
    # Groq bepul tier ~7200 daqiqa/oy. Ogohlantirish chegarasi (%).
    groq_monthly_minutes: int = int(os.getenv("GROQ_MONTHLY_MINUTES", "7200"))
    api_alert_threshold: int = int(os.getenv("API_ALERT_THRESHOLD", "80"))
    # Gemini bepul tier KUNLIK limiti (RPD — requests-per-day). flash-lite ~1000.
    gemini_daily_limit: int = int(os.getenv("GEMINI_DAILY_LIMIT", "1000"))
    # OpenAI oylik chaqiruv "yumshoq" limiti (0 = limitsiz, faqat sanaladi).
    openai_monthly_limit: int = int(os.getenv("OPENAI_MONTHLY_LIMIT", "0"))
    # AI subtitr tuzatish (xom Whisper matnini to'g'rilaydi). Fallback:
    # avval Gemini (bepul), tugasa OpenAI (ChatGPT).
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    # Claude (Anthropic) — birinchi zaxira provayder (Gemini'dan keyin).
    # Kalit: https://platform.claude.com/settings/keys
    # DIQQAT: ataylab CLAUDE_* nomi — ba'zi mashinalarda ANTHROPIC_API_KEY /
    # ANTHROPIC_MODEL boshqa dastur (proxy) tomonidan band va load_dotenv
    # ularni almashtirmaydi — bot noto'g'ri kalit/model olib qolardi.
    anthropic_api_key: str = os.getenv("CLAUDE_API_KEY", "")
    # Standart: eng kuchli model. Byudjetni tejash uchun .env da
    # CLAUDE_MODEL=claude-haiku-4-5 qilsa bo'ladi (~5x arzon).
    anthropic_model: str = os.getenv("CLAUDE_MODEL", "claude-opus-4-8")
    # Tarjima/lug'at uchun — Flash-Lite: bepul kvota ~4x ko'p (1000 RPD),
    # arzonroq, tarjima sifati Flash bilan deyarli teng.
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    # Imlo tuzatish (correct.py) uchun kuchliroq model — o'zbek imlosi murakkabroq.
    gemini_correct_model: str = os.getenv("GEMINI_CORRECT_MODEL", "gemini-2.5-flash")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    correct_enabled: bool = os.getenv("CORRECT_ENABLED", "1") not in ("0", "false", "")
    # Qaysi tillarda tuzatish ishlasin (vergul bilan). Default: faqat o'zbek.
    correct_langs: str = os.getenv("CORRECT_LANGS", "uz")
    # Subtitr shrifti — Noto Sans (Google, ekran uchun, to'liq Unicode:
    # o'zbek lotin + rus kiril + ingliz). Eng o'qiluvchan zamonaviy shrift.
    sub_font: str = os.getenv("SUB_FONT", "Noto Sans")
    # PDF suvbelgisi/futeri uchun bot brendi. Celery worker (PDF shu yerda
    # yaratiladi) main.py'ni ishga tushirmaydi, shuning uchun .env'dan o'qiladi.
    bot_brand: str = os.getenv("BOT_BRAND", "@subtitle_srtbot")
    # Shrift balandligi video balandligiga nisbatan (0.033 ≈ 3.3% — YouTube uslubi).
    # Kattaroq xohlasangiz 0.04, kichikroq uchun 0.03 qiling.
    sub_font_scale: float = float(os.getenv("SUB_FONT_SCALE", "0.033"))
    # ffmpeg burn sozlamalari (hajmni nazoratda tutish uchun):
    # veryfast = tez + hajmi me'yorida; crf 28 = yaxshi sifat, kichik fayl
    sub_preset: str = os.getenv("SUB_PRESET", "veryfast")
    sub_crf: int = int(os.getenv("SUB_CRF", "28"))
    # Yuklab olish va yuborish chegaralari (oddiy Bot API)
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    max_send_mb: int = int(os.getenv("MAX_SEND_MB", "49"))
    # Telegramga fayl yuklash (upload) timeout — soniya. Standart 60s katta
    # videoni sekin internetda yuborishga yetmaydi, shuning uchun oshiramiz.
    bot_request_timeout: int = int(os.getenv("BOT_REQUEST_TIMEOUT", "300"))
    # YouTube/Instagram yuklab olishda maksimal video balandligi (px).
    # Kichikroq = tez yuklab olish + kichik fayl. 720 = HD, yetarli.
    ytdlp_max_height: int = int(os.getenv("YTDLP_MAX_HEIGHT", "720"))
    # yt-dlp cookie — YouTube "bot tekshiruvi"ni (Sign in to confirm) chetlab o'tish.
    # Brauzerdan: chrome / edge / firefox / brave ...  YOKI cookies.txt fayl yo'li.
    ytdlp_cookies_browser: str = os.getenv("YTDLP_COOKIES_BROWSER", "")
    ytdlp_cookies_file: str = os.getenv("YTDLP_COOKIES_FILE", "")
    # RapidAPI fallback — yt-dlp bot-blok bo'lganda YouTube videoni API orqali
    # olish (datacenter IP bloki chetlab o'tiladi). Bo'sh bo'lsa o'chiq.
    rapidapi_key: str = os.getenv("RAPIDAPI_KEY", "")
    rapidapi_host: str = os.getenv(
        "RAPIDAPI_HOST", "youtube-media-downloader.p.rapidapi.com"
    )
    work_dir: str = os.getenv("WORK_DIR", "tmp")
    # Mini App: dev-rejim brauzerда sinash uchun initData'siz kirishga ruxsat
    # beradi (DIQQAT: faqat ishlab chiqishда! Prod'da 0 bo'lsin). Maks fayl (MB).
    miniapp_dev: bool = os.getenv("MINIAPP_DEV", "0") not in ("0", "false", "")
    miniapp_max_mb: int = int(os.getenv("MINIAPP_MAX_MB", "500"))
    # Web yuklab olish (katta videolar uchun)
    web_port: int = int(os.getenv("WEB_PORT", "8080"))
    # Bo'sh bo'lsa LAN IP avtomatik aniqlanadi (bir xil Wi-Fi da ishlaydi).
    # Internetga ochiq server bo'lsa: PUBLIC_BASE_URL=https://domeningiz.uz
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "")
    download_dir: str = os.getenv("DOWNLOAD_DIR", "downloads")
    download_ttl_hours: int = int(os.getenv("DOWNLOAD_TTL_HOURS", "6"))
    # Ma'lumotlar bazasi (PostgreSQL — asyncpg driver)
    database_url: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://subtitr:SubT1r_Pg2026!@localhost:5432/subtitr_db")
    # Admin Telegram ID lari (vergul bilan) — /grant kabi buyruqlar uchun
    admin_ids: str = os.getenv("ADMIN_IDS", "")
    # Admin web panel kirishi (Basic Auth). Parol bo'sh bo'lsa panel yopiq.
    admin_user: str = os.getenv("ADMIN_USER", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "")
    # Click to'lov (merchant kabinetdan olinadi). Bir nechta bot bitta Click
    # xizmatini (service_id) baham ko'radi — callback myxvest PHP ko'prigi
    # orqali keladi (merchant_trans_id "SUBT" prefiksi bilan).
    click_service_id: str = os.getenv("CLICK_SERVICE_ID", "")
    click_merchant_id: str = os.getenv("CLICK_MERCHANT_ID", "")
    click_secret_key: str = os.getenv("CLICK_SECRET_KEY", "")
    click_merchant_user_id: str = os.getenv("CLICK_MERCHANT_USER_ID", "")
    # To'lovdan keyin foydalanuvchi qaytadigan manzil (odatda bot havolasi).
    click_return_url: str = os.getenv("CLICK_RETURN_URL", "")
    # Obuna narxlari (so'm) va muddati (kun)
    price_basic: int = int(os.getenv("PRICE_BASIC", "30000"))
    price_premium: int = int(os.getenv("PRICE_PREMIUM", "60000"))
    sub_days: int = int(os.getenv("SUB_DAYS", "30"))
    # Redis va Celery (navbat tizimi)
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    celery_broker: str = os.getenv("CELERY_BROKER", "redis://localhost:6379/0")
    celery_backend: str = os.getenv("CELERY_BACKEND", "redis://localhost:6379/1")
    # Taqsimlangan worker (boshqa serverda): master'ga DB statusini HTTP orqali
    # yuboradi va kirish videoni master'dan yuklab oladi (lokal fayl yo'q).
    remote_worker: bool = os.getenv("REMOTE_WORKER", "0") not in ("0", "false", "")
    # Worker -> master ichki API manzili (status callback). Bo'sh = master o'zi.
    master_url: str = os.getenv("MASTER_URL", "")
    # Ichki API umumiy siri (worker va master bir xil bo'lishi shart).
    internal_secret: str = os.getenv("INTERNAL_SECRET", "")
    # Master kirish videoni worker'larга beradigan to'g'ridan-to'g'ri manzil
    # (tunnel emas — masalan http://161.33.36.218:8080). Bo'sh = base_url ishlatiladi.
    internal_base_url: str = os.getenv("INTERNAL_BASE_URL", "")

    @property
    def correct_lang_set(self) -> set[str]:
        return {x.strip().lower() for x in self.correct_langs.split(",") if x.strip()}

    @property
    def click_configured(self) -> bool:
        return bool(
            self.click_service_id and self.click_merchant_id and self.click_secret_key
        )

    def price_of(self, plan: str) -> int:
        return self.price_premium if plan == "premium" else self.price_basic

    def click_pay_url(self, transaction_param: str, amount: int) -> str:
        """Click to'lov havolasini yasaydi.

        transaction_param Click callback'ida merchant_trans_id bo'lib qaytadi.
        Subtitr bot uchun "SUBT"/"SUBTD" prefiksi myxvest ko'prigida
        yo'naltirish uchun ishlatiladi.
        """
        from urllib.parse import quote

        # DIQQAT: oxiridagi "/" muhim — Click mobil ilovasi aynan
        # "/services/pay/" yo'lini ushlaydi (App Links / Universal Links).
        # Slashsiz bo'lsa havola faqat brauzerda (saytda) ochiladi.
        url = (
            "https://my.click.uz/services/pay/"
            f"?service_id={self.click_service_id}"
            f"&merchant_id={self.click_merchant_id}"
            f"&amount={amount}"
            f"&transaction_param={transaction_param}"
        )
        if self.click_merchant_user_id:
            url += f"&merchant_user_id={self.click_merchant_user_id}"
        if self.click_return_url:
            url += f"&return_url={quote(self.click_return_url, safe='')}"
        return url

    @property
    def admin_id_set(self) -> set[int]:
        out: set[int] = set()
        for part in self.admin_ids.split(","):
            part = part.strip()
            if part.isdigit():
                out.add(int(part))
        return out

    def validate(self) -> None:
        """Ishga tushishdan oldin majburiy sozlamalarni tekshiradi."""
        missing = []
        if not self.bot_token:
            missing.append("BOT_TOKEN")
        if not self.groq_api_key:
            missing.append("GROQ_API_KEY")
        if missing:
            raise RuntimeError(
                ".env da quyidagilar yo'q: " + ", ".join(missing)
                + " (.env.example dan nusxa oling)"
            )


settings = Settings()

"""Yordamchi funksiyalar: sana/vaqt, matn, foydalanuvchi holati, kanal tahlili."""

from __future__ import annotations

import calendar
import html
import json
import re
from datetime import datetime, timedelta

from . import db
from .config import settings

DT_FMT = "%Y-%m-%d %H:%M:%S"


# --- Sana/vaqt (konfiguratsiyadagi timezone bilan) ---

def now() -> datetime:
    return datetime.now(settings.tz)


def now_str() -> str:
    return now().strftime(DT_FMT)


def today_str() -> str:
    return now().strftime("%Y-%m-%d")


def date_str(value) -> str:
    """DB DATE/DATETIME obyektini yoki stringni 'YYYY-MM-DD' ko'rinishiga keltiradi.

    psycopg DATE/TIMESTAMP ustunlarini date/datetime obyekt qilib qaytaradi; kod esa
    ko'p joyda string kutadi. Bu yordamchi ikkalasini ham qo'llaydi.
    """
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    try:
        return value.strftime("%Y-%m-%d")  # date yoki datetime
    except Exception:
        return str(value)


def valid_date(value) -> bool:
    try:
        datetime.strptime(date_str(value), "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


def valid_time(t: str) -> bool:
    return re.match(r"^(2[0-3]|[01]?[0-9]):([0-5][0-9])$", t or "") is not None


def month_name_uz(month: int) -> str:
    names = {
        1: "Yanvar", 2: "Fevral", 3: "Mart", 4: "Aprel", 5: "May", 6: "Iyun",
        7: "Iyul", 8: "Avgust", 9: "Sentyabr", 10: "Oktyabr", 11: "Noyabr", 12: "Dekabr",
    }
    return names.get(month, str(month))


def days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]


def age_text(birth_date) -> str:
    birth_date = date_str(birth_date)
    if not birth_date or not valid_date(birth_date):
        return "Noma’lum"
    b = datetime.strptime(birth_date, "%Y-%m-%d")
    n = datetime.strptime(today_str(), "%Y-%m-%d")
    years = n.year - b.year
    months = n.month - b.month
    days = n.day - b.day
    if days < 0:
        months -= 1
        prev_month = n.month - 1 or 12
        prev_year = n.year if n.month > 1 else n.year - 1
        days += days_in_month(prev_year, prev_month)
    if months < 0:
        years -= 1
        months += 12
    return f"{years} yosh, {months} oy, {days} kun"


def progress_bar(percent: float, size: int = 10) -> str:
    filled = int((percent / 100) * size)
    filled = max(0, min(size, filled))
    return "■" * filled + "□" * (size - filled)


def next_datetime_for_daily(time_str: str, reference: datetime | None = None) -> str:
    ref = reference or now()
    run = datetime.strptime(f"{ref.strftime('%Y-%m-%d')} {time_str}:00", DT_FMT).replace(tzinfo=settings.tz)
    if run <= ref:
        run += timedelta(days=1)
    return run.strftime(DT_FMT)


# --- Matn ---

def escape_html(text: str) -> str:
    return html.escape(str(text or ""), quote=True)


def bot_signature() -> str:
    """Post oxiridagi bot imzosi (masalan "@mening_botim").

    Bot useri `.env` dagi BOT_USERNAME dan olinadi — kodda qattiq yozilmagan,
    shuning uchun loyihani boshqa bot uchun ishlatganda hech narsani
    tahrirlash shart emas. BOT_USERNAME berilmasa imzo umuman qo'shilmaydi.
    """
    username = (settings.BOT_USERNAME or "").strip().lstrip("@")
    return f"@{username}" if username else ""


def starts_with(haystack: str, needle: str) -> bool:
    return (haystack or "").startswith(needle)


# --- Vazifalarni bo'limlarga (guruhlarga) ajratish ---
#
# DB `tasks` ustunida ikki format qo'llab-quvvatlanadi:
#   1) Tekis (eski/oddiy):  [{"text":..,"status":0}, ...]
#   2) Bo'limli (yangi):    {"groups": [{"name": "Ish", "tasks": [...]}, ...]}
# Har ikkalasi ham decode_task_groups() orqali bir xil ko'rinishga ([{"name","tasks"}])
# keltiriladi. Vazifa raqamlari (va callback_data indekslari) BUTUN reja bo'yicha
# uzluksiz — bo'lim faqat vizual sarlavha, indekslash mantiqiga ta'sir qilmaydi.

def decode_task_groups(raw) -> list:
    if not raw:
        return [{"name": "", "tasks": []}]
    try:
        v = json.loads(raw)
    except (ValueError, TypeError):
        return [{"name": "", "tasks": []}]
    if isinstance(v, list):
        return [{"name": "", "tasks": v}]
    if isinstance(v, dict) and isinstance(v.get("groups"), list):
        out = []
        for g in v["groups"]:
            if isinstance(g, dict):
                out.append({
                    "name": str(g.get("name") or ""),
                    "tasks": g["tasks"] if isinstance(g.get("tasks"), list) else [],
                })
        return out or [{"name": "", "tasks": []}]
    return [{"name": "", "tasks": []}]


def flatten_task_groups(groups: list) -> list:
    flat = []
    for g in groups:
        flat.extend(g.get("tasks") or [])
    return flat


def encode_task_groups(groups: list) -> str:
    is_grouped = len(groups) > 1 or (len(groups) == 1 and (groups[0].get("name") or "").strip() != "")
    if is_grouped:
        clean = [{"name": str(g.get("name") or ""), "tasks": g.get("tasks") or []} for g in groups]
        return json.dumps({"groups": clean}, ensure_ascii=False)
    return json.dumps(flatten_task_groups(groups), ensure_ascii=False)


def build_todo_text(groups: list, title: str = "🗓 TO-DO") -> str:
    flat = flatten_task_groups(groups)
    total = len(flat)
    completed = sum(1 for t in flat if int(t.get("status", 0) or 0) == 1)
    percent = round((completed / total) * 100, 1) if total > 0 else 0

    lines = [f"<b>{title}</b>", f"📊 Progress: <b>{completed}/{total}</b> | <b>{percent}%</b>", ""]

    show_headers = len(groups) > 1 or (len(groups) == 1 and (groups[0].get("name") or "").strip() != "")
    counter = 0
    for gi, g in enumerate(groups):
        g_tasks = g.get("tasks") or []
        if not g_tasks:
            continue
        if show_headers:
            g_completed = sum(1 for t in g_tasks if int(t.get("status", 0) or 0) == 1)
            g_name = (g.get("name") or "").strip()
            header = f"{gi + 1}-bo'lim" + (f": {escape_html(g_name)}" if g_name else "")
            lines.append(f"<b>{header}</b> ({g_completed}/{len(g_tasks)})")
        for task in g_tasks:
            counter += 1
            status = int(task.get("status", 0) or 0)
            mark = "✅" if status == 1 else ("⏱" if status == 2 else "▫️")
            duration = f" ({task['duration']} daq)" if task.get("duration") else ""
            timer = ""
            if status == 2 and task.get("started_at") and task.get("duration"):
                try:
                    started = datetime.strptime(task["started_at"], DT_FMT).replace(tzinfo=settings.tz)
                    end_ts = started + timedelta(minutes=int(task["duration"]))
                    left_sec = (end_ts - now()).total_seconds()
                    if left_sec > 0:
                        timer = f" | qoldi: {max(1, int((left_sec + 59) // 60))} daq"
                    else:
                        timer = " | vaqt tugadi"
                except (ValueError, TypeError):
                    timer = ""
            lines.append(f"{counter}. {mark} {escape_html(task.get('text', ''))}{duration}{timer}")
        if show_headers:
            lines.append("")

    if not show_headers:
        lines.append("")
    signature = bot_signature()
    if signature:
        lines.append(signature)
    return "\n".join(lines)


def todo_keyboard(plan_id: int, groups: list, plan_type: str = "") -> dict:
    rows = []
    current = []
    counter = 0
    for g in groups:
        g_tasks = g.get("tasks") or []
        if not g_tasks:
            continue
        if current:
            rows.append(current)
            current = []
        for task in g_tasks:
            i = counter
            number = i + 1
            status = int(task.get("status", 0) or 0)
            is_done = status == 1
            text = ("✅" + str(number)) if is_done else str(number)
            if plan_type == "super_todo":
                if status == 2:
                    text = f"Tugatish {number}"
                elif is_done:
                    text = f"Qayta {number}"
                else:
                    text = f"Boshlash {number}"
            current.append({"text": text, "callback_data": f"todo_toggle:{plan_id}:{i}"})
            counter += 1
            if len(current) == 4:
                rows.append(current)
                current = []
    if current:
        rows.append(current)
    return {"inline_keyboard": rows}


# --- Foydalanuvchi holati ---

def normalize_user(from_: dict) -> dict:
    return {
        "chat_id": int(from_["id"]),
        "first_name": from_.get("first_name", "") or "",
        "username": from_.get("username", "") or "",
    }


def user_get_or_create(from_: dict) -> dict:
    u = normalize_user(from_)
    ts = now_str()
    user = db.one("SELECT * FROM users WHERE chat_id = :c", {"c": u["chat_id"]})
    if not user:
        db.run(
            "INSERT INTO users (chat_id, first_name, username, created_at, updated_at) "
            "VALUES (:c, :f, :u, :n, :n)",
            {"c": u["chat_id"], "f": u["first_name"], "u": u["username"], "n": ts},
        )
    else:
        db.run(
            "UPDATE users SET first_name = :f, username = :u, updated_at = :n WHERE id = :id",
            {"f": u["first_name"], "u": u["username"], "n": ts, "id": user["id"]},
        )
    return db.one("SELECT * FROM users WHERE chat_id = :c", {"c": u["chat_id"]})


def user_update_step(user_id: int, step: str | None, temp_data: dict | None = None) -> None:
    db.run(
        "UPDATE users SET step = :s, temp_data = :t, updated_at = :n WHERE id = :id",
        {
            "s": step,
            "t": json.dumps(temp_data, ensure_ascii=False) if temp_data is not None else None,
            "n": now_str(),
            "id": user_id,
        },
    )


def user_temp(user: dict) -> dict:
    if not user.get("temp_data"):
        return {}
    try:
        d = json.loads(user["temp_data"])
        return d if isinstance(d, dict) else {}
    except (ValueError, TypeError):
        return {}


def reset_user_flow(user_id: int) -> None:
    user_update_step(user_id, None, None)


# --- Kanal tahlili ---

def normalize_channel_candidates(raw: str) -> list[str]:
    raw = (raw or "").strip()
    if raw == "":
        return []
    m = re.match(r"^@([A-Za-z0-9_]{5,})$", raw)
    if m:
        return ["@" + m.group(1)]
    m = re.match(r"^https?://t\.me/([A-Za-z0-9_]{5,})/?$", raw, re.IGNORECASE)
    if m:
        return ["@" + m.group(1)]
    if re.match(r"^-100\d+$", raw):
        return [raw]
    if re.match(r"^-\d+$", raw):
        return [raw]
    if re.match(r"^\d+$", raw):
        return ["-100" + raw, raw]
    return []


def parse_channel_input(message: dict) -> dict | None:
    text = (message.get("text") or "").strip()
    if message.get("forward_from_chat"):
        chat = message["forward_from_chat"]
        return {
            "channel_id": str(chat["id"]),
            "channel_name": chat.get("title", "Forward qilingan chat"),
            "channel_username": ("@" + chat["username"]) if chat.get("username") else None,
        }
    if text != "":
        candidates = normalize_channel_candidates(text)
        if candidates:
            return {
                "channel_id": candidates[0],
                "channel_candidates": candidates,
                "channel_name": candidates[0],
                "channel_username": candidates[0] if candidates[0].startswith("@") else None,
            }
    return None

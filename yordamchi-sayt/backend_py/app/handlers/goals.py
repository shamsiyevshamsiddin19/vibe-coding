"""Maqsadlar (goals): jildlar, bo'limlar, maqsadlar CRUD + global data."""

from __future__ import annotations

from fastapi import Request
from sqlalchemy import text

from .. import db
from ..errors import ApiError, success
from ..owner import owner_context
from .common import s, to_int


def get_global_data(request: Request, body: dict):
    ctx = owner_context(request)

    folder_rows = db.fetch_all(
        "SELECT id, name FROM goal_folders WHERE owner_type = :ot AND owner_key = :ok ORDER BY sort_order, id",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    folders = [{"id": "default", "name": "Umumiy"}]
    folders += [{"id": int(r["id"]), "name": str(r["name"])} for r in folder_rows]

    section_rows = db.fetch_all(
        "SELECT id, folder_id, name FROM goal_sections WHERE owner_type = :ot AND owner_key = :ok "
        "ORDER BY folder_id IS NOT NULL, folder_id, sort_order, id",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    sections = [
        {
            "id": int(r["id"]),
            "folder_id": "default" if not r["folder_id"] else int(r["folder_id"]),
            "name": str(r["name"]),
        }
        for r in section_rows
    ]

    goal_rows = db.fetch_all(
        "SELECT id, folder_id, section_id, text, completed FROM goals "
        "WHERE owner_type = :ot AND owner_key = :ok "
        "ORDER BY folder_id IS NOT NULL, folder_id, section_id IS NOT NULL, section_id, sort_order, id",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    goals = [
        {
            "id": int(r["id"]),
            "folder_id": "default" if not r["folder_id"] else int(r["folder_id"]),
            "section_id": "default" if not r["section_id"] else int(r["section_id"]),
            "text": r["text"],
            "completed": int(r["completed"]),
        }
        for r in goal_rows
    ]

    return success({"goal_folders": folders, "goal_sections": sections, "goals": goals})


def _folder_id_from_input(ctx, value) -> int | None:
    raw = s(value)
    if raw in ("", "default", "0"):
        return None
    folder_id = to_int(raw)
    if folder_id <= 0:
        raise ApiError("Jild noto'g'ri tanlangan.", 422)
    found = db.fetch_one(
        "SELECT id FROM goal_folders WHERE id = :id AND owner_type = :ot AND owner_key = :ok LIMIT 1",
        {"id": folder_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    if not found:
        raise ApiError("Jild topilmadi.", 404)
    return folder_id


def _section_id_from_input(ctx, folder_id, value) -> int | None:
    raw = s(value)
    if raw in ("", "default", "0"):
        return None
    section_id = to_int(raw)
    if section_id <= 0:
        raise ApiError("Bo'lim noto'g'ri tanlangan.", 422)
    if folder_id is None:
        found = db.fetch_one(
            "SELECT id FROM goal_sections WHERE id = :id AND owner_type = :ot AND owner_key = :ok "
            "AND folder_id IS NULL LIMIT 1",
            {"id": section_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
        )
    else:
        found = db.fetch_one(
            "SELECT id FROM goal_sections WHERE id = :id AND owner_type = :ot AND owner_key = :ok "
            "AND folder_id = :fid LIMIT 1",
            {"id": section_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"], "fid": folder_id},
        )
    if not found:
        raise ApiError("Bo'lim topilmadi.", 404)
    return section_id


def add_goal_folder(request: Request, body: dict):
    name = s(body.get("name"))
    if name == "":
        raise ApiError("Jild nomi bo'sh.")
    ctx = owner_context(request)
    sort_order = int(db.fetch_value(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM goal_folders WHERE owner_type = :ot AND owner_key = :ok",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    ) or 0)
    new_id = db.execute_returning_id(
        "INSERT INTO goal_folders (owner_type, owner_key, name, sort_order) VALUES (:ot, :ok, :n, :so)",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"], "n": name, "so": sort_order},
    )
    return success({"id": new_id})


def edit_goal_folder(request: Request, body: dict):
    folder_id = to_int(body.get("id"))
    name = s(body.get("name"))
    if folder_id <= 0 or name == "":
        raise ApiError("Jildni tahrirlash uchun ma'lumot yetarli emas.", 422)
    ctx = owner_context(request)
    db.execute(
        "UPDATE goal_folders SET name = :n WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"n": name, "id": folder_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()


def delete_goal_folder(request: Request, body: dict):
    folder_id = to_int(body.get("id"))
    if folder_id <= 0:
        raise ApiError("Jild ID kelmadi.", 422)
    ctx = owner_context(request)
    with db.tx() as conn:
        p = {"id": folder_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]}
        conn.execute(text("DELETE FROM goals WHERE folder_id = :id AND owner_type = :ot AND owner_key = :ok"), p)
        conn.execute(text("DELETE FROM goal_sections WHERE folder_id = :id AND owner_type = :ot AND owner_key = :ok"), p)
        conn.execute(text("DELETE FROM goal_folders WHERE id = :id AND owner_type = :ot AND owner_key = :ok"), p)
    return success()


def add_goal_section(request: Request, body: dict):
    name = s(body.get("name"))
    if name == "":
        raise ApiError("Bo'lim nomi bo'sh.")
    ctx = owner_context(request)
    folder_id = _folder_id_from_input(ctx, body.get("folder_id"))
    if folder_id is None:
        sort_order = db.fetch_value(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM goal_sections "
            "WHERE owner_type = :ot AND owner_key = :ok AND folder_id IS NULL",
            {"ot": ctx["owner_type"], "ok": ctx["owner_key"]},
        )
    else:
        sort_order = db.fetch_value(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM goal_sections "
            "WHERE owner_type = :ot AND owner_key = :ok AND folder_id = :fid",
            {"ot": ctx["owner_type"], "ok": ctx["owner_key"], "fid": folder_id},
        )
    new_id = db.execute_returning_id(
        "INSERT INTO goal_sections (owner_type, owner_key, folder_id, name, sort_order) "
        "VALUES (:ot, :ok, :fid, :n, :so)",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"], "fid": folder_id, "n": name, "so": int(sort_order or 0)},
    )
    return success({"id": new_id})


def edit_goal_section(request: Request, body: dict):
    section_id = to_int(body.get("id"))
    name = s(body.get("name"))
    if section_id <= 0 or name == "":
        raise ApiError("Bo'limni tahrirlash uchun ma'lumot yetarli emas.", 422)
    ctx = owner_context(request)
    db.execute(
        "UPDATE goal_sections SET name = :n WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"n": name, "id": section_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()


def delete_goal_section(request: Request, body: dict):
    section_id = to_int(body.get("id"))
    if section_id <= 0:
        raise ApiError("Bo'lim ID kelmadi.", 422)
    ctx = owner_context(request)
    with db.tx() as conn:
        p = {"id": section_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]}
        conn.execute(text("DELETE FROM goals WHERE section_id = :id AND owner_type = :ot AND owner_key = :ok"), p)
        conn.execute(text("DELETE FROM goal_sections WHERE id = :id AND owner_type = :ot AND owner_key = :ok"), p)
    return success()


def add_goal(request: Request, body: dict):
    text_val = s(body.get("text"))
    if text_val == "":
        raise ApiError("Maqsad matni bo'sh.")
    ctx = owner_context(request)
    folder_id = _folder_id_from_input(ctx, body.get("folder_id"))
    section_id = _section_id_from_input(ctx, folder_id, body.get("section_id"))

    base = "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM goals WHERE owner_type = :ot AND owner_key = :ok"
    p = {"ot": ctx["owner_type"], "ok": ctx["owner_key"]}
    if folder_id is None and section_id is None:
        sort_order = db.fetch_value(base + " AND folder_id IS NULL AND section_id IS NULL", p)
    elif folder_id is None:
        sort_order = db.fetch_value(base + " AND folder_id IS NULL AND section_id = :sid", {**p, "sid": section_id})
    elif section_id is None:
        sort_order = db.fetch_value(base + " AND folder_id = :fid AND section_id IS NULL", {**p, "fid": folder_id})
    else:
        sort_order = db.fetch_value(
            base + " AND folder_id = :fid AND section_id = :sid", {**p, "fid": folder_id, "sid": section_id}
        )

    new_id = db.execute_returning_id(
        "INSERT INTO goals (owner_type, owner_key, folder_id, section_id, text, completed, sort_order) "
        "VALUES (:ot, :ok, :fid, :sid, :t, 0, :so)",
        {
            "ot": ctx["owner_type"], "ok": ctx["owner_key"], "fid": folder_id, "sid": section_id,
            "t": text_val, "so": int(sort_order or 0),
        },
    )
    return success({"id": new_id})


def toggle_goal(request: Request, body: dict):
    goal_id = to_int(body.get("id"))
    if goal_id <= 0:
        raise ApiError("Maqsad ID kelmadi.")
    ctx = owner_context(request)
    db.execute(
        "UPDATE goals SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END "
        "WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"id": goal_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()


def edit_goal(request: Request, body: dict):
    goal_id = to_int(body.get("id"))
    text_val = s(body.get("text"))
    if goal_id <= 0 or text_val == "":
        raise ApiError("Maqsadni tahrirlash uchun ma'lumot yetarli emas.")
    ctx = owner_context(request)
    db.execute(
        "UPDATE goals SET text = :t WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"t": text_val, "id": goal_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()


def delete_goal(request: Request, body: dict):
    goal_id = to_int(body.get("id"))
    if goal_id <= 0:
        raise ApiError("Maqsad ID kelmadi.")
    ctx = owner_context(request)
    db.execute(
        "DELETE FROM goals WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"id": goal_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()

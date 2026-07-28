"""Til mavzulari (Grammar va h.k.): Ingliz/Rus bo'limlari uchun mavzu ro'yxati + .md kontent."""

from __future__ import annotations

from fastapi import Request

from .. import db
from ..errors import ApiError, success
from ..owner import owner_context
from .common import s, to_int

# `coding` ham shu yerda: Tillar > Dasturlash bo'limi ham mavzu/matn/test/o'yin tizimidan foydalanadi
ALLOWED_LANGS = {"english", "russian", "coding"}


def _clean_lang(value) -> str:
    lang = s(value).lower()
    if lang not in ALLOWED_LANGS:
        raise ApiError("Til noto'g'ri.", 422)
    return lang


def get_topics(request: Request, body: dict, lang: str):
    lang = _clean_lang(lang)
    ctx = owner_context(request)
    rows = db.fetch_all(
        "SELECT id, name FROM language_topics WHERE owner_type = :ot AND owner_key = :ok AND lang = :l "
        "ORDER BY sort_order, id",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"], "l": lang},
    )
    return success({"topics": [{"id": int(r["id"]), "name": r["name"]} for r in rows]})


def get_topic(request: Request, body: dict, topic_id: int):
    ctx = owner_context(request)
    row = db.fetch_one(
        "SELECT id, lang, name, content, test_content, game_content, game_type FROM language_topics "
        "WHERE id = :id AND owner_type = :ot AND owner_key = :ok LIMIT 1",
        {"id": topic_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    if not row:
        raise ApiError("Mavzu topilmadi.", 404)
    return success({
        "id": int(row["id"]), "lang": row["lang"], "name": row["name"],
        "content": row["content"] or "",
        "test_content": row["test_content"] or "",
        "game_content": row["game_content"] or "",
        "game_type": row["game_type"] or "fill",
    })


def add_topic(request: Request, body: dict):
    lang = _clean_lang(body.get("lang"))
    name = s(body.get("name"))
    if name == "":
        raise ApiError("Mavzu nomi bo'sh.")
    ctx = owner_context(request)
    sort_order = int(db.fetch_value(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM language_topics "
        "WHERE owner_type = :ot AND owner_key = :ok AND lang = :l",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"], "l": lang},
    ) or 0)
    new_id = db.execute_returning_id(
        "INSERT INTO language_topics (owner_type, owner_key, lang, name, sort_order) "
        "VALUES (:ot, :ok, :l, :n, :so)",
        {"ot": ctx["owner_type"], "ok": ctx["owner_key"], "l": lang, "n": name, "so": sort_order},
    )
    return success({"id": new_id})


def rename_topic(request: Request, body: dict):
    topic_id = to_int(body.get("id"))
    name = s(body.get("name"))
    if topic_id <= 0 or name == "":
        raise ApiError("Mavzuni tahrirlash uchun ma'lumot yetarli emas.", 422)
    ctx = owner_context(request)
    db.execute(
        "UPDATE language_topics SET name = :n, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"n": name, "id": topic_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()


ALLOWED_GAME_TYPES = {"fill", "sort", "match", "order"}
_PART_COLUMN = {"content": "content", "test": "test_content", "game": "game_content"}


def upload_topic_content(request: Request, body: dict):
    """Mavzuning bir qismini saqlaydi: `part` = content (matn) | test | game."""
    topic_id = to_int(body.get("id"))
    content = "" if body.get("content") is None else str(body.get("content"))
    part = s(body.get("part")) or "content"
    if topic_id <= 0:
        raise ApiError("Mavzu ID kelmadi.", 422)
    column = _PART_COLUMN.get(part)
    if column is None:
        raise ApiError("Noma'lum bo'lim.", 422)

    ctx = owner_context(request)
    params = {"c": content, "id": topic_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]}
    extra = ""
    if part == "game":
        game_type = s(body.get("game_type")).lower()
        if game_type not in ALLOWED_GAME_TYPES:
            game_type = "fill"
        params["gt"] = game_type
        extra = ", game_type = :gt"

    # `column` faqat yuqoridagi qat'iy lug'atdan olinadi (injection'siz).
    db.execute(
        f"UPDATE language_topics SET {column} = :c{extra}, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        params,
    )
    return success()


def delete_topic(request: Request, body: dict):
    topic_id = to_int(body.get("id"))
    if topic_id <= 0:
        raise ApiError("Mavzu ID kelmadi.", 422)
    ctx = owner_context(request)
    db.execute(
        "DELETE FROM language_topics WHERE id = :id AND owner_type = :ot AND owner_key = :ok",
        {"id": topic_id, "ot": ctx["owner_type"], "ok": ctx["owner_key"]},
    )
    return success()

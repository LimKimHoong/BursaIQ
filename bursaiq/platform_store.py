"""SQLite persistence for BursaIQ employee workspace entities."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ITEM_TYPES = {"room", "project", "decision", "email-automation", "connector", "skill", "room-item"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class PlatformStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS platform_items (
                    id TEXT PRIMARY KEY,
                    item_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    status TEXT NOT NULL,
                    data_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS platform_items_by_type ON platform_items(item_type, updated_at DESC);
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id TEXT NOT NULL,
                    setting_key TEXT NOT NULL,
                    value_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY(user_id, setting_key)
                );
                """
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _check_type(item_type: str) -> None:
        if item_type not in ITEM_TYPES:
            raise ValueError("Unsupported platform item type.")

    def create(self, item_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        self._check_type(item_type)
        item_id = f"{item_type[:3].upper()}-{uuid.uuid4().hex[:8].upper()}"
        now = utc_now()
        data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO platform_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (item_id, item_type, payload["title"], payload.get("owner", "Lim Kim Hoong"), payload.get("status", "DRAFT"), json.dumps(data, ensure_ascii=True, sort_keys=True), now, now),
            )
        return self.get(item_type, item_id)

    def list(self, item_type: str | None = None) -> list[dict[str, Any]]:
        with self._connect() as connection:
            if item_type:
                self._check_type(item_type)
                rows = connection.execute("SELECT * FROM platform_items WHERE item_type = ? ORDER BY updated_at DESC, rowid DESC", (item_type,)).fetchall()
            else:
                rows = connection.execute("SELECT * FROM platform_items ORDER BY updated_at DESC, rowid DESC").fetchall()
        return [self._item(row) for row in rows]

    def get(self, item_type: str, item_id: str) -> dict[str, Any]:
        self._check_type(item_type)
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM platform_items WHERE item_type = ? AND id = ?", (item_type, item_id)).fetchone()
        if row is None:
            raise KeyError(item_id)
        return self._item(row)

    def update(self, item_type: str, item_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get(item_type, item_id)
        data = payload.get("data", current["data"])
        if not isinstance(data, dict):
            raise ValueError("data must be an object.")
        with self._connect() as connection:
            cursor = connection.execute(
                "UPDATE platform_items SET title = ?, owner = ?, status = ?, data_json = ?, updated_at = ? WHERE item_type = ? AND id = ?",
                (payload.get("title", current["title"]), payload.get("owner", current["owner"]), payload.get("status", current["status"]), json.dumps(data, ensure_ascii=True, sort_keys=True), utc_now(), item_type, item_id),
            )
        if cursor.rowcount == 0:
            raise KeyError(item_id)
        return self.get(item_type, item_id)

    def delete(self, item_type: str, item_id: str) -> None:
        self._check_type(item_type)
        with self._connect() as connection:
            cursor = connection.execute("DELETE FROM platform_items WHERE item_type = ? AND id = ?", (item_type, item_id))
        if cursor.rowcount == 0:
            raise KeyError(item_id)

    def settings(self, user_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            rows = connection.execute("SELECT setting_key, value_json FROM user_settings WHERE user_id = ?", (user_id,)).fetchall()
        return {row["setting_key"]: json.loads(row["value_json"]) for row in rows}

    def save_settings(self, user_id: str, values: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        with self._connect() as connection:
            for key, value in values.items():
                connection.execute(
                    """INSERT INTO user_settings VALUES (?, ?, ?, ?)
                       ON CONFLICT(user_id, setting_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at""",
                    (user_id, str(key), json.dumps(value, ensure_ascii=True), now),
                )
        return self.settings(user_id)

    @staticmethod
    def _item(row: sqlite3.Row) -> dict[str, Any]:
        return {"id": row["id"], "type": row["item_type"], "title": row["title"], "owner": row["owner"], "status": row["status"], "data": json.loads(row["data_json"]), "createdAt": row["created_at"], "updatedAt": row["updated_at"]}

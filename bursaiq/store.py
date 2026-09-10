"""Small local audit store for the visible human-verification demo workflow."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class VerificationStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialise()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialise(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS verification_cases (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    workspace TEXT NOT NULL,
                    requested_by TEXT NOT NULL,
                    reviewer TEXT NOT NULL,
                    status TEXT NOT NULL,
                    scope TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    reviewed_at TEXT,
                    report_filename TEXT,
                    details_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS audit_events (
                    event_id TEXT PRIMARY KEY,
                    case_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    occurred_at TEXT NOT NULL,
                    metadata TEXT NOT NULL,
                    FOREIGN KEY(case_id) REFERENCES verification_cases(id)
                );
                """
            )
            columns = {row["name"] for row in connection.execute("PRAGMA table_info(verification_cases)").fetchall()}
            if "details_json" not in columns:
                connection.execute("ALTER TABLE verification_cases ADD COLUMN details_json TEXT NOT NULL DEFAULT '{}'")
            seed_details = {
                "question": "How did the market perform in July?",
                "answerTitle": "The market advanced in July, with broad but selective support",
                "answerText": "The synthetic FBM KLCI closed at 1,638.2, up 2.4% month to date. Technology and Financial Services contributed 17.8 index points together, while market breadth remained positive.",
                "formula": "MTD return = (1,638.2 / 1,599.8 - 1) x 100 = 2.40%",
                "context": {"Reporting period": "1-31 Jul 2026", "Data class": "Synthetic demo"},
                "sources": [{"title": "GCMC Market Pulse - July 2026", "filename": "GCMC_Market_Pulse.xlsx", "owner": "GCMC", "detail": "Index Summary, Sector Attribution and Market Breadth worksheets"}],
            }
            count = connection.execute("SELECT COUNT(*) AS count FROM verification_cases").fetchone()["count"]
            if count == 0:
                case_id = "VER-260731-01"
                created = "2026-07-31T10:12:00+00:00"
                connection.execute(
                    """INSERT INTO verification_cases
                       (id, title, workspace, requested_by, reviewer, status, scope, created_at, reviewed_at, report_filename, details_json)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (case_id, "July market performance briefing", "GCMC", "Nadia Karim", "Market Intelligence Lead", "Pending review", "Answer narrative, calculations and source citations", created, None, None, json.dumps(seed_details, ensure_ascii=True, sort_keys=True)),
                )
                self._audit(connection, case_id, "submitted", "Nadia Karim", {"seed": True}, created)
            else:
                connection.execute(
                    "UPDATE verification_cases SET details_json = ? WHERE id = ? AND details_json = '{}'",
                    (json.dumps(seed_details, ensure_ascii=True, sort_keys=True), "VER-260731-01"),
                )

    @staticmethod
    def _audit(connection: sqlite3.Connection, case_id: str, action: str, actor: str, metadata: dict[str, Any], occurred_at: str | None = None) -> None:
        connection.execute(
            "INSERT INTO audit_events VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), case_id, action, actor, occurred_at or utc_now(), json.dumps(metadata, sort_keys=True)),
        )

    def list_cases(self, reviewers: set[str] | None = None) -> list[dict[str, Any]]:
        if reviewers is not None and not reviewers:
            return []
        with self._connect() as connection:
            if reviewers is None:
                rows = connection.execute("SELECT * FROM verification_cases ORDER BY created_at DESC").fetchall()
            else:
                placeholders = ",".join("?" for _ in reviewers)
                rows = connection.execute(
                    f"SELECT * FROM verification_cases WHERE reviewer IN ({placeholders}) ORDER BY created_at DESC",
                    tuple(sorted(reviewers)),
                ).fetchall()
        return [self._case_dict(row) for row in rows]

    def create_case(self, title: str, workspace: str, requested_by: str, report_filename: str | None = None, details: dict[str, Any] | None = None) -> dict[str, Any]:
        case_id = f"VER-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        reviewer = "HR Policy Owner" if workspace.lower().startswith("people") or workspace.lower() == "hr" else "Market Intelligence Lead"
        created = utc_now()
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO verification_cases
                   (id, title, workspace, requested_by, reviewer, status, scope, created_at, reviewed_at, report_filename, details_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (case_id, title, workspace, requested_by, reviewer, "Pending review", "Answer narrative, calculations and source citations", created, None, report_filename, json.dumps(details or {}, ensure_ascii=True, sort_keys=True)),
            )
            self._audit(connection, case_id, "submitted", requested_by, {"reportFilename": report_filename})
        return self.get_case(case_id)

    def get_case(self, case_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM verification_cases WHERE id = ?", (case_id,)).fetchone()
        if row is None:
            raise KeyError(case_id)
        return self._case_dict(row)

    def update_status(self, case_id: str, status: str, actor: str) -> dict[str, Any]:
        if status not in {"Approved", "Changes requested"}:
            raise ValueError("Status must be Approved or Changes requested")
        reviewed = utc_now()
        with self._connect() as connection:
            cursor = connection.execute("UPDATE verification_cases SET status = ?, reviewed_at = ? WHERE id = ?", (status, reviewed, case_id))
            if cursor.rowcount == 0:
                raise KeyError(case_id)
            self._audit(connection, case_id, status.lower().replace(" ", "_"), actor, {})
        return self.get_case(case_id)

    def history(self, case_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM audit_events WHERE case_id = ? ORDER BY occurred_at", (case_id,)).fetchall()
        return [{"eventId": row["event_id"], "action": row["action"], "actor": row["actor"], "occurredAt": row["occurred_at"], "metadata": json.loads(row["metadata"])} for row in rows]

    @staticmethod
    def _case_dict(row: sqlite3.Row) -> dict[str, Any]:
        created = row["created_at"]
        try:
            details = json.loads(row["details_json"] or "{}") if "details_json" in row.keys() else {}
        except (json.JSONDecodeError, TypeError):
            details = {}
        return {
            "id": row["id"],
            "title": row["title"],
            "workspace": row["workspace"],
            "requestedBy": row["requested_by"],
            "reviewer": row["reviewer"],
            "status": row["status"],
            "scope": row["scope"],
            "created": created,
            "createdAt": created,
            "reviewedAt": row["reviewed_at"],
            "reportFilename": row["report_filename"],
            "details": details,
        }

"""Persisted, deterministic ADV mission execution for the competition demo."""

from __future__ import annotations

import csv
import hashlib
import json
import sqlite3
import threading
import time
import uuid
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable

from .capabilities import ADV_CAPABILITY, MissionCapabilityRegistry


MISSION_WORKERS = (
    ("mission-manager", "Mission Manager"),
    ("data-agent", "Data Agent"),
    ("analysis-agent", "Analysis Agent"),
    ("insight-agent", "Insight Agent"),
    ("report-agent", "Report Agent"),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _month_label(value: str) -> str:
    return datetime.strptime(value, "%Y-%m").strftime("%b %Y")


def _money(value: float) -> str:
    return f"RM{value / 1_000_000_000:.2f}bn"


def normalize_mission_result(result: dict[str, Any] | None) -> dict[str, Any] | None:
    """Upgrade persisted pre-schema ADV results without changing their evidence payload."""
    if not result or "summaryMetrics" in result or "metrics" not in result:
        return result
    metrics, quality = result.get("metrics", {}), result.get("quality", {})
    result.update({
        "summaryMetrics": [
            {"label": "Primary result", "value": metrics.get("periodAdvBn"), "valueType": "currency", "unit": "RM bn", "decimals": 3},
            {"label": "Total measured value", "value": float(metrics.get("totalTradedValueMyr", 0)) / 1_000_000_000, "valueType": "currency", "unit": "RM bn", "decimals": 3},
            {"label": "Reporting periods", "value": metrics.get("tradingDays"), "valueType": "number", "unit": "days", "decimals": 0},
        ],
        "tables": [],
        "charts": [{"title": "Monthly result trend", "type": "line", "categories": [item.get("label", "") for item in result.get("monthly", [])], "series": [{"name": "Result", "values": [item.get("advBn", 0) for item in result.get("monthly", [])], "unit": "RM bn"}]}] if result.get("monthly") else [],
        "evidence": [{"title": item.get("filename", "Evidence"), "detail": item.get("role", ""), "reference": item.get("sha256", "")} for item in result.get("sources", [])],
        "qualityChecks": [{"label": "Source record validation", "status": "PASSED" if quality.get("passed") else "EXCEPTION", "detail": f"{int(quality.get('marketRowsEligible', 0)):,} eligible source records."}],
        "interpretationBoundaries": [result["interpretationBoundary"]] if result.get("interpretationBoundary") else [],
        "downloadableOutputs": [],
    })
    return result


class MissionStore:
    """SQLite-backed mission state and append-only worker event ledger."""

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._initialise()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialise(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS missions (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    objective TEXT NOT NULL,
                    requested_by TEXT NOT NULL,
                    date_start TEXT NOT NULL,
                    date_end TEXT NOT NULL,
                    boards_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    current_worker TEXT,
                    progress INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    result_json TEXT,
                    report_filename TEXT,
                    verification_case_id TEXT,
                    error TEXT,
                    root_mission_id TEXT,
                    version INTEGER NOT NULL DEFAULT 1,
                    supersedes_mission_id TEXT
                    ,team_id TEXT
                    ,team_snapshot_json TEXT
                    ,capability_id TEXT
                    ,capability_snapshot_json TEXT
                );
                CREATE TABLE IF NOT EXISTS mission_events (
                    event_id TEXT PRIMARY KEY,
                    mission_id TEXT NOT NULL,
                    worker_id TEXT NOT NULL,
                    worker_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    message TEXT NOT NULL,
                    occurred_at TEXT NOT NULL,
                    duration_ms INTEGER,
                    payload_json TEXT NOT NULL,
                    FOREIGN KEY(mission_id) REFERENCES missions(id)
                );
                CREATE INDEX IF NOT EXISTS mission_events_by_mission
                    ON mission_events(mission_id, occurred_at);
                CREATE TABLE IF NOT EXISTS intelligence_assets (
                    id TEXT PRIMARY KEY,
                    source_mission_id TEXT NOT NULL UNIQUE,
                    title TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    owner TEXT NOT NULL,
                    published_by TEXT NOT NULL,
                    published_at TEXT NOT NULL,
                    asset_json TEXT NOT NULL,
                    reuse_count INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(source_mission_id) REFERENCES missions(id)
                );
                """
            )
            columns = {row["name"] for row in connection.execute("PRAGMA table_info(missions)").fetchall()}
            if "root_mission_id" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN root_mission_id TEXT")
            if "version" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN version INTEGER NOT NULL DEFAULT 1")
            if "supersedes_mission_id" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN supersedes_mission_id TEXT")
            if "team_id" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN team_id TEXT")
            if "team_snapshot_json" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN team_snapshot_json TEXT")
            if "capability_id" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN capability_id TEXT")
            if "capability_snapshot_json" not in columns:
                connection.execute("ALTER TABLE missions ADD COLUMN capability_snapshot_json TEXT")
            connection.execute("UPDATE missions SET root_mission_id = id WHERE root_mission_id IS NULL")

    def create(self, payload: dict[str, Any], *, root_mission_id: str | None = None, version: int = 1, supersedes_mission_id: str | None = None) -> dict[str, Any]:
        mission_id = f"MIS-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        created = utc_now()
        with self._lock, self._connect() as connection:
            connection.execute(
                """INSERT INTO missions
                   (id, title, objective, requested_by, date_start, date_end, boards_json,
                    status, current_worker, progress, created_at, updated_at, root_mission_id, version, supersedes_mission_id,
                    team_id, team_snapshot_json, capability_id, capability_snapshot_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'PLANNED', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mission_id,
                    payload["title"],
                    payload["objective"],
                    payload["requestedBy"],
                    payload["dateStart"],
                    payload["dateEnd"],
                    json.dumps(payload["boards"], sort_keys=True),
                    (payload.get("team") or {}).get("stages", [{}])[0].get("agentId", "mission-manager"),
                    created,
                    created,
                    root_mission_id or mission_id,
                    version,
                    supersedes_mission_id,
                    payload.get("teamId"),
                    json.dumps(payload.get("team"), ensure_ascii=True, sort_keys=True) if payload.get("team") else None,
                    payload.get("capabilityId"),
                    json.dumps(payload.get("capability"), ensure_ascii=True, sort_keys=True) if payload.get("capability") else None,
                ),
            )
            first_stage = (payload.get("team") or {}).get("stages", [{}])[0]
            self._event(connection, mission_id, first_stage.get("agentId", "mission-manager"), first_stage.get("agentName", "Mission Manager"), "PLANNED", "Mission request persisted with an adjustable reporting window and versioned team snapshot.", payload={"dateStart": payload["dateStart"], "dateEnd": payload["dateEnd"], "boards": payload["boards"], "objective": payload["objective"], "teamId": payload.get("teamId")})
        return self.get(mission_id)

    @staticmethod
    def _event(connection: sqlite3.Connection, mission_id: str, worker_id: str, worker_name: str, status: str, message: str, payload: dict[str, Any] | None = None, duration_ms: int | None = None) -> None:
        connection.execute(
            "INSERT INTO mission_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), mission_id, worker_id, worker_name, status, message, utc_now(), duration_ms, json.dumps(payload or {}, ensure_ascii=True, sort_keys=True)),
        )

    def event(self, mission_id: str, worker_id: str, status: str, message: str, payload: dict[str, Any] | None = None, duration_ms: int | None = None) -> None:
        mission = self.get(mission_id)
        team_stage = next((stage for stage in (mission.get("team") or {}).get("stages", []) if stage.get("agentId") == worker_id), None)
        worker_name = (team_stage or {}).get("agentName") or dict(MISSION_WORKERS).get(worker_id, worker_id)
        with self._lock, self._connect() as connection:
            self._event(connection, mission_id, worker_id, worker_name, status, message, payload, duration_ms)

    def update(self, mission_id: str, *, status: str | None = None, current_worker: str | None = None, progress: int | None = None, result: dict[str, Any] | None = None, report_filename: str | None = None, verification_case_id: str | None = None, error: str | None = None) -> None:
        updates = ["updated_at = ?"]
        values: list[Any] = [utc_now()]
        for column, value in (
            ("status", status),
            ("current_worker", current_worker),
            ("progress", progress),
            ("result_json", json.dumps(result, ensure_ascii=True, sort_keys=True) if result is not None else None),
            ("report_filename", report_filename),
            ("verification_case_id", verification_case_id),
            ("error", error),
        ):
            if value is not None:
                updates.append(f"{column} = ?")
                values.append(value)
        values.append(mission_id)
        with self._lock, self._connect() as connection:
            cursor = connection.execute(f"UPDATE missions SET {', '.join(updates)} WHERE id = ?", values)
            if cursor.rowcount == 0:
                raise KeyError(mission_id)

    def list(self, limit: int = 20) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM missions ORDER BY created_at DESC LIMIT ?", (max(1, min(limit, 100)),)).fetchall()
        return [self._mission_dict(row, include_events=False) for row in rows]

    def get(self, mission_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM missions WHERE id = ?", (mission_id,)).fetchone()
            events = connection.execute("SELECT * FROM mission_events WHERE mission_id = ? ORDER BY occurred_at, rowid", (mission_id,)).fetchall()
        if row is None:
            raise KeyError(mission_id)
        mission = self._mission_dict(row, include_events=True)
        mission["events"] = [self._event_dict(event) for event in events]
        return mission

    def by_verification_case(self, case_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM missions WHERE verification_case_id = ?", (case_id,)).fetchone()
        return self._mission_dict(row, include_events=False) if row else None

    def create_revision(self, mission_id: str, requested_by: str) -> dict[str, Any]:
        prior = self.get(mission_id)
        if prior["status"] != "REVISION REQUESTED":
            raise ValueError("Only a mission with requested changes can be revised.")
        root_id = prior.get("rootMissionId") or prior["id"]
        with self._connect() as connection:
            latest = connection.execute("SELECT MAX(version) AS version FROM missions WHERE root_mission_id = ?", (root_id,)).fetchone()["version"] or prior.get("version", 1)
        revised = self.create({
            "title": prior["title"], "objective": prior["objective"], "requestedBy": requested_by,
            "dateStart": prior["dateStart"], "dateEnd": prior["dateEnd"], "boards": prior["boards"],
            "teamId": prior.get("teamId"), "team": prior.get("team"),
            "capabilityId": prior.get("capabilityId"), "capability": prior.get("capability"),
        }, root_mission_id=root_id, version=int(latest) + 1, supersedes_mission_id=prior["id"])
        self.event(revised["id"], "mission-manager", "REVISION", "New mission version created from reviewer-requested changes.", {"previousMissionId": prior["id"], "version": revised["version"]})
        self.event(prior["id"], "mission-manager", "SUPERSEDED", "A new revision was created while this version remains immutable.", {"revisionMissionId": revised["id"], "version": revised["version"]})
        return self.get(revised["id"])

    def version_history(self, mission_id: str) -> list[dict[str, Any]]:
        mission = self.get(mission_id)
        root_id = mission.get("rootMissionId") or mission["id"]
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM missions WHERE root_mission_id = ? ORDER BY version", (root_id,)).fetchall()
        return [self._mission_dict(row, include_events=False) for row in rows]

    def publish_asset(self, mission_id: str, published_by: str, approval: dict[str, Any]) -> dict[str, Any]:
        mission = self.get(mission_id)
        if mission["status"] != "APPROVED" or not mission.get("result"):
            raise ValueError("Only an approved mission result can be published.")
        with self._lock, self._connect() as connection:
            existing = connection.execute("SELECT * FROM intelligence_assets WHERE source_mission_id = ?", (mission_id,)).fetchone()
            if existing:
                return self._asset_dict(existing)
            version = connection.execute("SELECT COUNT(*) + 1 AS version FROM intelligence_assets WHERE title = ?", (mission["title"],)).fetchone()["version"]
            asset_id = f"ASSET-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
            published_at = utc_now()
            asset = {
                "id": asset_id,
                "type": "Reusable Mission",
                "title": mission["title"],
                "version": f"v{version}.0",
                "owner": mission["requestedBy"],
                "publishedBy": published_by,
                "publishedAt": published_at,
                "sourceMissionId": mission_id,
                "report": {"filename": mission.get("reportFilename"), "downloadUrl": mission.get("downloadUrl")},
                "evidence": mission["result"].get("evidence") or mission["result"].get("sources", []),
                "parameters": {"objective": mission["objective"], "dateStart": mission["dateStart"], "dateEnd": mission["dateEnd"], "boards": mission["boards"], "teamId": mission.get("teamId"), "capabilityId": mission.get("capabilityId"), "capability": mission.get("capability")},
                "approvalRecord": approval,
                "resultSummary": {"summaryMetrics": mission["result"].get("summaryMetrics", []), "findings": mission["result"].get("findings", []), "classification": mission["result"].get("classification", "")},
                "reuseCount": 0,
            }
            connection.execute(
                "INSERT INTO intelligence_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
                (asset_id, mission_id, mission["title"], version, mission["requestedBy"], published_by, published_at, json.dumps(asset, ensure_ascii=True, sort_keys=True)),
            )
        self.event(mission_id, "mission-manager", "PUBLISHED", "Approved mission published to the Intelligence Exchange.", {"assetId": asset_id, "version": asset["version"], "publishedBy": published_by})
        return asset

    def list_assets(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM intelligence_assets ORDER BY published_at DESC").fetchall()
        return [self._asset_dict(row) for row in rows]

    def get_asset(self, asset_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM intelligence_assets WHERE id = ?", (asset_id,)).fetchone()
        if row is None:
            raise KeyError(asset_id)
        return self._asset_dict(row)

    def asset_for_mission(self, mission_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM intelligence_assets WHERE source_mission_id = ?", (mission_id,)).fetchone()
        return self._asset_dict(row) if row else None

    def record_reuse(self, asset_id: str) -> dict[str, Any]:
        with self._lock, self._connect() as connection:
            cursor = connection.execute("UPDATE intelligence_assets SET reuse_count = reuse_count + 1 WHERE id = ?", (asset_id,))
            if cursor.rowcount == 0:
                raise KeyError(asset_id)
            row = connection.execute("SELECT * FROM intelligence_assets WHERE id = ?", (asset_id,)).fetchone()
        return self._asset_dict(row)

    @staticmethod
    def _asset_dict(row: sqlite3.Row) -> dict[str, Any]:
        asset = json.loads(row["asset_json"])
        asset["reuseCount"] = row["reuse_count"]
        return asset

    @staticmethod
    def _mission_dict(row: sqlite3.Row, include_events: bool) -> dict[str, Any]:
        result = normalize_mission_result(json.loads(row["result_json"]) if row["result_json"] else None)
        mission = {
            "id": row["id"],
            "title": row["title"],
            "objective": row["objective"],
            "requestedBy": row["requested_by"],
            "dateStart": row["date_start"],
            "dateEnd": row["date_end"],
            "boards": json.loads(row["boards_json"]),
            "status": row["status"],
            "currentWorker": row["current_worker"],
            "progress": row["progress"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "result": result,
            "reportFilename": row["report_filename"],
            "downloadUrl": f"/api/reports/{row['report_filename']}" if row["report_filename"] else None,
            "verificationCaseId": row["verification_case_id"],
            "rootMissionId": row["root_mission_id"] or row["id"],
            "version": row["version"] if "version" in row.keys() else 1,
            "supersedesMissionId": row["supersedes_mission_id"] if "supersedes_mission_id" in row.keys() else None,
            "teamId": row["team_id"] if "team_id" in row.keys() else None,
            "team": json.loads(row["team_snapshot_json"]) if "team_snapshot_json" in row.keys() and row["team_snapshot_json"] else None,
            "capabilityId": row["capability_id"] if "capability_id" in row.keys() else None,
            "capability": json.loads(row["capability_snapshot_json"]) if "capability_snapshot_json" in row.keys() and row["capability_snapshot_json"] else None,
            "error": row["error"],
        }
        if include_events:
            mission["events"] = []
        return mission

    @staticmethod
    def _event_dict(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "eventId": row["event_id"],
            "workerId": row["worker_id"],
            "workerName": row["worker_name"],
            "status": row["status"],
            "message": row["message"],
            "occurredAt": row["occurred_at"],
            "durationMs": row["duration_ms"],
            "payload": json.loads(row["payload_json"] or "{}"),
        }


class AdvMissionAnalyser:
    REQUIRED_MARKET_COLUMNS = {"trading_date", "stock_code", "sector", "market_board", "traded_value_myr", "traded_volume"}
    REQUIRED_INVESTOR_COLUMNS = {"trade_date", "investor_group", "buy_value_myr", "sell_value_myr"}

    def __init__(self, market_path: Path, investor_path: Path) -> None:
        self.market_path = market_path
        self.investor_path = investor_path

    @staticmethod
    def _fingerprint(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    @staticmethod
    def _date(value: str) -> date:
        return date.fromisoformat(value[:10])

    def analyse(self, date_start: str, date_end: str, boards: list[str], progress: Callable[[str, str, dict[str, Any]], None]) -> dict[str, Any]:
        start = self._date(date_start)
        end = self._date(date_end)
        if end < start:
            raise ValueError("dateEnd must be on or after dateStart.")
        if not self.market_path.exists() or not self.investor_path.exists():
            raise FileNotFoundError("Both demo CSV files are required in the input folder.")

        selected_boards = set(boards)
        daily: dict[str, float] = defaultdict(float)
        monthly_total: dict[str, float] = defaultdict(float)
        monthly_days: dict[str, set[str]] = defaultdict(set)
        sector_total: dict[str, float] = defaultdict(float)
        seen_exact: set[tuple[str, ...]] = set()
        market_rows = eligible_rows = invalid_rows = exact_duplicates = 0
        available_boards: set[str] = set()

        with self.market_path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            headers = set(reader.fieldnames or [])
            missing = self.REQUIRED_MARKET_COLUMNS - headers
            if missing:
                raise ValueError(f"market_trades_demo.csv is missing columns: {', '.join(sorted(missing))}")
            for row in reader:
                market_rows += 1
                try:
                    row_date = self._date(row["trading_date"])
                    value = float(row["traded_value_myr"])
                    volume = float(row["traded_volume"])
                    if value < 0 or volume < 0:
                        raise ValueError
                except (TypeError, ValueError):
                    invalid_rows += 1
                    continue
                available_boards.add(row["market_board"])
                record = tuple(row.get(name, "") for name in reader.fieldnames or [])
                if record in seen_exact:
                    exact_duplicates += 1
                    continue
                seen_exact.add(record)
                if not (start <= row_date <= end):
                    continue
                if selected_boards and row["market_board"] not in selected_boards:
                    continue
                eligible_rows += 1
                day = row_date.isoformat()
                month = day[:7]
                daily[day] += value
                monthly_total[month] += value
                monthly_days[month].add(day)
                sector_total[row["sector"]] += value

        if not daily:
            raise ValueError("No eligible market records were found for the selected date window and boards.")

        progress("data", "Market activity source validated and filtered.", {"rowsRead": market_rows, "eligibleRows": eligible_rows, "tradingDays": len(daily), "invalidRows": invalid_rows, "exactDuplicatesExcluded": exact_duplicates})

        investor_rows = investor_invalid = investor_eligible = 0
        investor_totals: dict[str, dict[str, float]] = defaultdict(lambda: {"buy": 0.0, "sell": 0.0})
        with self.investor_path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            headers = set(reader.fieldnames or [])
            missing = self.REQUIRED_INVESTOR_COLUMNS - headers
            if missing:
                raise ValueError(f"investor_participation_demo.csv is missing columns: {', '.join(sorted(missing))}")
            for row in reader:
                investor_rows += 1
                try:
                    row_date = self._date(row["trade_date"])
                    buy = float(row["buy_value_myr"])
                    sell = float(row["sell_value_myr"])
                    if buy < 0 or sell < 0:
                        raise ValueError
                except (TypeError, ValueError):
                    investor_invalid += 1
                    continue
                if start <= row_date <= end:
                    investor_eligible += 1
                    investor_totals[row["investor_group"]]["buy"] += buy
                    investor_totals[row["investor_group"]]["sell"] += sell

        trading_days = len(daily)
        total_value = sum(daily.values())
        period_adv = total_value / trading_days
        monthly = []
        for month in sorted(monthly_total):
            days = len(monthly_days[month])
            monthly.append({"month": month, "label": _month_label(month), "totalMyr": round(monthly_total[month], 2), "tradingDays": days, "advMyr": round(monthly_total[month] / days, 2), "advBn": round(monthly_total[month] / days / 1_000_000_000, 3)})
        first = monthly[0]
        last = monthly[-1]
        change_pct = ((last["advMyr"] / first["advMyr"]) - 1) * 100 if first["advMyr"] else 0.0
        peak = max(monthly, key=lambda item: item["advMyr"])
        trough = min(monthly, key=lambda item: item["advMyr"])
        sectors = [
            {"sector": sector, "tradedValueMyr": round(value, 2), "sharePct": round(value / total_value * 100, 2)}
            for sector, value in sorted(sector_total.items(), key=lambda item: item[1], reverse=True)[:8]
        ]
        investor_gross = sum(values["buy"] + values["sell"] for values in investor_totals.values())
        investors = [
            {"group": group, "buyMyr": round(values["buy"], 2), "sellMyr": round(values["sell"], 2), "netMyr": round(values["buy"] - values["sell"], 2), "grossSharePct": round((values["buy"] + values["sell"]) / investor_gross * 100, 2) if investor_gross else 0.0}
            for group, values in sorted(investor_totals.items())
        ]
        progress("analysis", "ADV, monthly trend, sector contribution and investor participation recomputed.", {"formula": "sum(eligible traded_value_myr) / distinct eligible trading dates", "periodAdvMyr": round(period_adv, 2), "tradingDays": trading_days})

        direction = "higher" if change_pct >= 0 else "lower"
        leader = sectors[0]
        findings = [
            f"Period ADV was {_money(period_adv)} across {trading_days} eligible trading days from {start.strftime('%d %b %Y')} to {end.strftime('%d %b %Y')}.",
            f"Monthly ADV ended {abs(change_pct):.1f}% {direction} in {last['label']} than in {first['label']}; the peak was {peak['label']} at {_money(peak['advMyr'])}.",
            f"{leader['sector'].title()} was the largest recorded sector by traded value, contributing {leader['sharePct']:.1f}% of the selected scope.",
        ]
        interpretation = "These are descriptive synthetic-data observations. BursaIQ does not attribute the shifts to policy, news, fund flows or other causes without corroborating evidence."
        progress("insight", "Rule-based findings written only from verified metric fields.", {"findingCount": len(findings), "unsupportedCausalClaims": 0})

        source_register = [
            {"filename": self.market_path.name, "sha256": self._fingerprint(self.market_path), "rowsRead": market_rows, "eligibleRows": eligible_rows, "coveredDates": f"{min(daily)} to {max(daily)}", "role": "ADV, monthly trend and sector contribution"},
            {"filename": self.investor_path.name, "sha256": self._fingerprint(self.investor_path), "rowsRead": investor_rows, "eligibleRows": investor_eligible, "coveredDates": f"{start.isoformat()} to {end.isoformat()}", "role": "Investor participation and net activity"},
        ]
        result = {
            "classification": "SYNTHETIC DEMONSTRATION DATA — NOT FOR MARKET DECISIONS",
            "scope": {"dateStart": start.isoformat(), "dateEnd": end.isoformat(), "boards": sorted(selected_boards) if selected_boards else sorted(available_boards), "unit": "MYR", "tradingDayRule": "Distinct dates with at least one eligible market record", "duplicateRule": "Exact duplicate rows are excluded; repeated stock/date rows with different attributes remain distinct source records."},
            "quality": {"marketRowsRead": market_rows, "marketRowsEligible": eligible_rows, "marketInvalidRows": invalid_rows, "marketExactDuplicatesExcluded": exact_duplicates, "investorRowsRead": investor_rows, "investorInvalidRows": investor_invalid, "availableBoards": sorted(available_boards), "passed": invalid_rows == 0 and investor_invalid == 0},
            "metrics": {"totalTradedValueMyr": round(total_value, 2), "tradingDays": trading_days, "periodAdvMyr": round(period_adv, 2), "periodAdvBn": round(period_adv / 1_000_000_000, 3), "firstMonthAdvMyr": first["advMyr"], "lastMonthAdvMyr": last["advMyr"], "firstToLastChangePct": round(change_pct, 2), "peakMonth": peak["month"], "troughMonth": trough["month"]},
            "monthly": monthly,
            "sectors": sectors,
            "investors": investors,
            "findings": findings,
            "interpretationBoundary": interpretation,
            "formula": "Average Daily Trading Value (ADV) = total eligible traded value / number of distinct eligible trading dates",
            "sources": source_register,
        }
        result.update({
            "summaryMetrics": [
                {"id": "period-adv", "label": "Period average daily trading value", "value": round(period_adv / 1_000_000_000, 3), "valueType": "currency", "unit": "RM bn", "decimals": 3},
                {"id": "total-value", "label": "Total measured traded value", "value": round(total_value / 1_000_000_000, 3), "valueType": "currency", "unit": "RM bn", "decimals": 3},
                {"id": "period-count", "label": "Eligible trading days", "value": trading_days, "valueType": "number", "unit": "days", "decimals": 0},
                {"id": "period-change", "label": "First to last period change", "value": round(change_pct, 2), "valueType": "percentage", "unit": "%", "decimals": 2},
            ],
            "tables": [
                {"id": "sector-contribution", "title": "Sector contribution", "columns": [{"key": "sector", "label": "Sector"}, {"key": "sharePct", "label": "Share", "valueType": "percentage", "unit": "%"}], "rows": sectors},
                {"id": "investor-participation", "title": "Investor participation", "columns": [{"key": "group", "label": "Investor group"}, {"key": "netMyr", "label": "Net value", "valueType": "currency", "unit": "MYR"}, {"key": "grossSharePct", "label": "Gross share", "valueType": "percentage", "unit": "%"}], "rows": investors},
            ],
            "charts": [{"id": "monthly-trend", "title": "Monthly average daily trading value", "type": "line", "categories": [item["label"] for item in monthly], "series": [{"name": "ADV", "values": [item["advBn"] for item in monthly], "unit": "RM bn"}]}],
            "evidence": [{"title": item["filename"], "reference": item["sha256"], "detail": item["role"], "metadata": {"rowsRead": item["rowsRead"], "eligibleRows": item["eligibleRows"], "coveredDates": item["coveredDates"]}} for item in source_register],
            "qualityChecks": [
                {"id": "market-validity", "label": "Market record validation", "status": "PASSED" if invalid_rows == 0 else "EXCEPTION", "detail": f"{eligible_rows:,} eligible rows; {invalid_rows:,} invalid rows; {exact_duplicates:,} exact duplicates excluded."},
                {"id": "investor-validity", "label": "Investor record validation", "status": "PASSED" if investor_invalid == 0 else "EXCEPTION", "detail": f"{investor_eligible:,} eligible rows; {investor_invalid:,} invalid rows."},
            ],
            "interpretationBoundaries": [interpretation],
            "downloadableOutputs": [],
        })
        return result


class MissionRunner:
    """Runs one mission at a time per ID and keeps every stage inspectable."""

    def __init__(self, store: MissionStore, analyser: Any, report_factory: Callable[[dict[str, Any]], dict[str, Any]]) -> None:
        self.store = store
        self.analyser = analyser
        self.report_factory = report_factory
        self._running: set[str] = set()
        self._lock = threading.Lock()

    def start(self, mission_id: str) -> dict[str, Any]:
        mission = self.store.get(mission_id)
        if mission["status"] in {"RUNNING", "AWAITING REVIEW", "APPROVED"}:
            return mission
        with self._lock:
            if mission_id in self._running:
                return mission
            self._running.add(mission_id)
        thread = threading.Thread(target=self._run, args=(mission_id,), daemon=True, name=f"bursaiq-{mission_id}")
        thread.start()
        return self.store.get(mission_id)

    def _stage(self, mission_id: str, worker_id: str, progress: int, message: str, payload: dict[str, Any] | None = None) -> float:
        self.store.update(mission_id, status="RUNNING", current_worker=worker_id, progress=progress)
        self.store.event(mission_id, worker_id, "RUNNING", message, payload)
        return time.perf_counter()

    def _complete_stage(self, mission_id: str, worker_id: str, started: float, message: str, payload: dict[str, Any] | None = None) -> None:
        elapsed = max(0.0, time.perf_counter() - started)
        if elapsed < 0.18:
            time.sleep(0.18 - elapsed)
        self.store.event(mission_id, worker_id, "COMPLETED", message, payload, round((time.perf_counter() - started) * 1000))

    def _run(self, mission_id: str) -> None:
        try:
            mission = self.store.get(mission_id)
            default_stages = [{"stageType": stage_type, "agentId": agent_id, "agentName": name} for stage_type, agent_id, name in (("mission-manager", "mission-manager", "Mission Manager"), ("data", "data-agent", "Data Agent"), ("analysis", "analysis-agent", "Analysis Agent"), ("insight", "insight-agent", "Insight Agent"), ("report", "report-agent", "Report Agent"))]
            stages = (mission.get("team") or {}).get("stages") or default_stages
            stage_payloads: dict[str, dict[str, Any]] = {}
            result: dict[str, Any] | None = None
            report: dict[str, Any] | None = None

            def capture(stage: str, message: str, payload: dict[str, Any]) -> None:
                stage_payloads[stage] = {"message": message, "payload": payload}
            for index, stage in enumerate(stages):
                stage_type, worker_id = stage["stageType"], stage["agentId"]
                progress = max(5, round((index / max(1, len(stages))) * 90))
                if stage_type == "mission-manager":
                    started = self._stage(mission_id, worker_id, progress, "Validating scope, dates, output contract and team dependencies.", {"dateStart": mission["dateStart"], "dateEnd": mission["dateEnd"], "boards": mission["boards"], "objective": mission["objective"], "teamId": mission.get("teamId")})
                    date.fromisoformat(mission["dateStart"]); date.fromisoformat(mission["dateEnd"])
                    self._complete_stage(mission_id, worker_id, started, "Mission plan and configurable team accepted.", {"stages": len(stages), "output": "dashboard + charts + PDF + review package"})
                elif stage_type == "data":
                    source_paths = getattr(self.analyser, "source_paths", None) or [self.analyser.market_path, self.analyser.investor_path]
                    started = self._stage(mission_id, worker_id, progress, "Reading and validating approved mission sources.", {"sources": [path.name for path in source_paths]})
                    result = self.analyser.analyse(mission["dateStart"], mission["dateEnd"], mission["boards"], capture)
                    info = stage_payloads.get("data", {})
                    self._complete_stage(mission_id, worker_id, started, info.get("message", "Sources validated."), info.get("payload"))
                elif stage_type == "analysis":
                    if result is None: raise ValueError("Analysis requires a completed data stage.")
                    started = self._stage(mission_id, worker_id, progress, "Executing the governed analytical capability.", {"formula": result["formula"]})
                    info = stage_payloads.get("analysis", {})
                    self._complete_stage(mission_id, worker_id, started, info.get("message", "Metrics recomputed."), info.get("payload"))
                elif stage_type == "insight":
                    if result is None: raise ValueError("Insight development requires a completed analysis payload.")
                    started = self._stage(mission_id, worker_id, progress, "Translating verified fields into bounded management observations.", {"causalClaimsAllowed": False})
                    info = stage_payloads.get("insight", {})
                    self._complete_stage(mission_id, worker_id, started, info.get("message", "Findings prepared."), info.get("payload"))
                elif stage_type == "report":
                    if result is None: raise ValueError("Report generation requires a verified result payload.")
                    started = self._stage(mission_id, worker_id, progress, "Rendering the deliverable from the verified mission payload.", {"classification": result["classification"], "sourceCount": len(result["sources"])})
                    report = self.report_factory({"mission": mission, "result": result})
                    self._complete_stage(mission_id, worker_id, started, "Dashboard payload and verified PDF assembled.", {"filename": report["filename"], "validation": report["validation"]})
            if result is None or report is None:
                raise ValueError("The mission team did not produce the required analysis and report outputs.")
            result["downloadableOutputs"] = [{"id": "mission-report", "label": "Mission report", "filename": report["filename"], "url": f"/api/reports/{report['filename']}", "mimeType": "application/pdf"}]
            capability_contract = mission.get("capability") or ADV_CAPABILITY
            MissionCapabilityRegistry.validate_result(capability_contract, result)
            last_worker = stages[-1]["agentId"]
            manager = next((stage["agentId"] for stage in stages if stage["stageType"] == "mission-manager"), last_worker)
            self.store.update(mission_id, status="DRAFT READY", current_worker=last_worker, progress=100, result=result, report_filename=report["filename"])
            self.store.event(mission_id, manager, "DRAFT READY", "Mission completed successfully and is ready for human review.", {"reportFilename": report["filename"], "teamId": mission.get("teamId")})
        except Exception as exc:  # The failure remains inspectable in mission history.
            failed_worker = self.store.get(mission_id).get("currentWorker") or "mission-manager"
            self.store.event(mission_id, failed_worker, "FAILED", "Worker stopped with an inspectable error.", {"error": str(exc)[:1000]})
            self.store.update(mission_id, status="FAILED", current_worker="mission-manager", progress=100, error=str(exc)[:1000])
            self.store.event(mission_id, "mission-manager", "FAILED", "Mission stopped with an inspectable error.", {"error": str(exc)[:1000]})
        finally:
            with self._lock:
                self._running.discard(mission_id)

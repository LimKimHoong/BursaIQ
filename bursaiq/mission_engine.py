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
                    error TEXT
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
                """
            )

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        mission_id = f"MIS-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        created = utc_now()
        with self._lock, self._connect() as connection:
            connection.execute(
                """INSERT INTO missions
                   (id, title, objective, requested_by, date_start, date_end, boards_json,
                    status, current_worker, progress, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'PLANNED', 'mission-manager', 0, ?, ?)""",
                (
                    mission_id,
                    payload["title"],
                    payload["objective"],
                    payload["requestedBy"],
                    payload["dateStart"],
                    payload["dateEnd"],
                    json.dumps(payload["boards"], sort_keys=True),
                    created,
                    created,
                ),
            )
            self._event(connection, mission_id, "mission-manager", "Mission Manager", "PLANNED", "Mission request persisted with an adjustable reporting window.", payload={"dateStart": payload["dateStart"], "dateEnd": payload["dateEnd"], "boards": payload["boards"], "objective": payload["objective"]})
        return self.get(mission_id)

    @staticmethod
    def _event(connection: sqlite3.Connection, mission_id: str, worker_id: str, worker_name: str, status: str, message: str, payload: dict[str, Any] | None = None, duration_ms: int | None = None) -> None:
        connection.execute(
            "INSERT INTO mission_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), mission_id, worker_id, worker_name, status, message, utc_now(), duration_ms, json.dumps(payload or {}, ensure_ascii=True, sort_keys=True)),
        )

    def event(self, mission_id: str, worker_id: str, status: str, message: str, payload: dict[str, Any] | None = None, duration_ms: int | None = None) -> None:
        worker_name = dict(MISSION_WORKERS).get(worker_id, worker_id)
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

    @staticmethod
    def _mission_dict(row: sqlite3.Row, include_events: bool) -> dict[str, Any]:
        result = json.loads(row["result_json"]) if row["result_json"] else None
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
        return {
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


class MissionRunner:
    """Runs one mission at a time per ID and keeps every stage inspectable."""

    def __init__(self, store: MissionStore, analyser: AdvMissionAnalyser, report_factory: Callable[[dict[str, Any]], dict[str, Any]]) -> None:
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
            started = self._stage(mission_id, "mission-manager", 8, "Validating scope, dates, output contract and worker dependencies.", {"dateStart": mission["dateStart"], "dateEnd": mission["dateEnd"], "boards": mission["boards"], "objective": mission["objective"]})
            date.fromisoformat(mission["dateStart"])
            date.fromisoformat(mission["dateEnd"])
            self._complete_stage(mission_id, "mission-manager", started, "Mission plan accepted; four specialist workers assigned.", {"workers": [name for _, name in MISSION_WORKERS[1:]], "output": "dashboard + charts + PDF + review package"})

            started = self._stage(mission_id, "data-agent", 24, "Reading and validating the two approved CSV sources.", {"sources": [self.analyser.market_path.name, self.analyser.investor_path.name], "dateStart": mission["dateStart"], "dateEnd": mission["dateEnd"], "boards": mission["boards"]})
            stage_payloads: dict[str, dict[str, Any]] = {}

            def capture(stage: str, message: str, payload: dict[str, Any]) -> None:
                stage_payloads[stage] = {"message": message, "payload": payload}

            result = self.analyser.analyse(mission["dateStart"], mission["dateEnd"], mission["boards"], capture)
            data_info = stage_payloads.get("data", {})
            self._complete_stage(mission_id, "data-agent", started, data_info.get("message", "Sources validated."), data_info.get("payload"))

            started = self._stage(mission_id, "analysis-agent", 50, "Executing governed ADV and contribution calculations.", {"formula": "sum(eligible traded_value_myr) / distinct eligible trading dates", "marketRowsEligible": result["quality"]["marketRowsEligible"], "tradingDays": result["metrics"]["tradingDays"]})
            analysis_info = stage_payloads.get("analysis", {})
            self._complete_stage(mission_id, "analysis-agent", started, analysis_info.get("message", "Metrics recomputed."), analysis_info.get("payload"))

            started = self._stage(mission_id, "insight-agent", 70, "Translating verified fields into bounded management observations.", {"verifiedMetrics": ["periodAdvMyr", "firstToLastChangePct", "peakMonth"], "causalClaimsAllowed": False})
            insight_info = stage_payloads.get("insight", {})
            self._complete_stage(mission_id, "insight-agent", started, insight_info.get("message", "Findings prepared."), insight_info.get("payload"))

            started = self._stage(mission_id, "report-agent", 86, "Rendering the PDF from the same verified result payload used by the dashboard.", {"output": "dashboard + PDF", "classification": result["classification"], "sourceCount": len(result["sources"])})
            report = self.report_factory({"mission": mission, "result": result})
            self._complete_stage(mission_id, "report-agent", started, "Dashboard payload and verified PDF assembled.", {"filename": report["filename"], "validation": report["validation"]})
            self.store.update(mission_id, status="DRAFT READY", current_worker="report-agent", progress=100, result=result, report_filename=report["filename"])
            self.store.event(mission_id, "mission-manager", "DRAFT READY", "Mission completed successfully and is ready for human review.", {"reportFilename": report["filename"]})
        except Exception as exc:  # The failure remains inspectable in mission history.
            failed_worker = self.store.get(mission_id).get("currentWorker") or "mission-manager"
            self.store.event(mission_id, failed_worker, "FAILED", "Worker stopped with an inspectable error.", {"error": str(exc)[:1000]})
            self.store.update(mission_id, status="FAILED", current_worker="mission-manager", progress=100, error=str(exc)[:1000])
            self.store.event(mission_id, "mission-manager", "FAILED", "Mission stopped with an inspectable error.", {"error": str(exc)[:1000]})
        finally:
            with self._lock:
                self._running.discard(mission_id)

"""Persistent mission capability contracts with an explicit executor allowlist."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


ADV_CAPABILITY = {
    "id": "adv-analysis",
    "name": "Average Daily Trading Value Analysis",
    "description": "Analyse governed market-trade and investor-participation data, develop evidence-bounded findings, and produce a reviewable report.",
    "requiredInputs": ["market_trades", "investor_participation"],
    "requiredAgentCapabilities": ["mission-orchestration", "adv-analysis", "report-generation"],
    "inputSchema": "adv-analysis-input-v1",
    "outputSchema": "adv-analysis-v1",
    "approvalPolicy": "market-intelligence-review",
    "executor": "adv_analysis",
    "resultSchema": {
        "id": "adv-analysis-result-v1",
        "requiredSections": ["summaryMetrics", "tables", "charts", "findings", "evidence", "qualityChecks", "interpretationBoundaries", "downloadableOutputs"],
        "metricValueTypes": ["number", "text", "percentage", "currency"],
        "chartTypes": ["line", "bar"],
    },
}


class MissionCapabilityRegistry:
    """Stores discoverable contracts; only executor IDs installed by Python may run."""

    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS mission_capabilities (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    required_inputs_json TEXT NOT NULL,
                    required_agent_capabilities_json TEXT NOT NULL,
                    input_schema TEXT NOT NULL,
                    output_schema TEXT NOT NULL,
                    approval_policy TEXT NOT NULL,
                    executor TEXT NOT NULL,
                    built_in INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                    ,result_schema_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE INDEX IF NOT EXISTS mission_capabilities_updated
                    ON mission_capabilities(updated_at DESC);
                """
            )
            columns = {row["name"] for row in connection.execute("PRAGMA table_info(mission_capabilities)").fetchall()}
            if "result_schema_json" not in columns:
                connection.execute("ALTER TABLE mission_capabilities ADD COLUMN result_schema_json TEXT NOT NULL DEFAULT '{}'")
        self._seed_default()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    def _seed_default(self) -> None:
        now = utc_now()
        value = ADV_CAPABILITY
        with self._connect() as connection:
            connection.execute(
                """INSERT OR IGNORE INTO mission_capabilities
                   (id, name, description, version, status, required_inputs_json,
                    required_agent_capabilities_json, input_schema, output_schema,
                    approval_policy, executor, built_in, created_at, updated_at, result_schema_json)
                   VALUES (?, ?, ?, 1, 'ACTIVE', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)""",
                (value["id"], value["name"], value["description"], json.dumps(value["requiredInputs"]),
                 json.dumps(value["requiredAgentCapabilities"]), value["inputSchema"], value["outputSchema"],
                 value["approvalPolicy"], value["executor"], now, now, json.dumps(value["resultSchema"])),
            )
            connection.execute(
                "UPDATE mission_capabilities SET result_schema_json=? WHERE id=? AND result_schema_json='{}'",
                (json.dumps(value["resultSchema"]), value["id"]),
            )

    @staticmethod
    def _identifier(value: Any, label: str) -> str:
        text = str(value or "").strip().lower()
        if not text or len(text) > 100 or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789-_" for character in text):
            raise ValueError(f"{label} must contain only lowercase letters, numbers, hyphens, or underscores.")
        return text

    def validate(self, payload: dict[str, Any], current: dict[str, Any] | None = None) -> dict[str, Any]:
        value = dict(current or {})
        value.update(payload)
        value["id"] = self._identifier(value.get("id"), "id")
        for key, maximum in (("name", 140), ("description", 1000), ("inputSchema", 100), ("outputSchema", 100), ("approvalPolicy", 100)):
            text = str(value.get(key, "")).strip()
            if not text:
                raise ValueError(f"{key} is required.")
            if len(text) > maximum:
                raise ValueError(f"{key} must be {maximum} characters or fewer.")
            value[key] = text
        value["executor"] = self._identifier(value.get("executor"), "executor")
        result_schema = value.get("resultSchema")
        if not isinstance(result_schema, dict):
            raise ValueError("resultSchema must be an object.")
        required_sections = result_schema.get("requiredSections")
        supported_sections = {"summaryMetrics", "tables", "charts", "findings", "evidence", "qualityChecks", "interpretationBoundaries", "downloadableOutputs"}
        if not isinstance(required_sections, list) or set(required_sections) != supported_sections:
            raise ValueError("resultSchema must declare every supported result section exactly once.")
        value["resultSchema"] = result_schema
        value["status"] = str(value.get("status", "ACTIVE")).upper()
        if value["status"] not in {"ACTIVE", "DISABLED", "ARCHIVED"}:
            raise ValueError("Unsupported capability status.")
        for key in ("requiredInputs", "requiredAgentCapabilities"):
            items = value.get(key, [])
            if not isinstance(items, list) or len(items) > 30:
                raise ValueError(f"{key} must be an array with at most 30 entries.")
            value[key] = list(dict.fromkeys(self._identifier(item, key) for item in items))
        return value

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        value = self.validate(payload)
        now = utc_now()
        with self._connect() as connection:
            try:
                connection.execute(
                    """INSERT INTO mission_capabilities
                       (id, name, description, version, status, required_inputs_json,
                        required_agent_capabilities_json, input_schema, output_schema,
                        approval_policy, executor, built_in, created_at, updated_at, result_schema_json)
                       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)""",
                    (value["id"], value["name"], value["description"], value["status"], json.dumps(value["requiredInputs"]),
                     json.dumps(value["requiredAgentCapabilities"]), value["inputSchema"], value["outputSchema"],
                     value["approvalPolicy"], value["executor"], now, now, json.dumps(value["resultSchema"])),
                )
            except sqlite3.IntegrityError as exc:
                raise ValueError("A capability with this id already exists.") from exc
        return self.get(value["id"])

    def list(self, include_archived: bool = False) -> list[dict[str, Any]]:
        query = "SELECT * FROM mission_capabilities" + ("" if include_archived else " WHERE status != 'ARCHIVED'") + " ORDER BY built_in DESC, name"
        with self._connect() as connection:
            rows = connection.execute(query).fetchall()
        return [self._item(row) for row in rows]

    def get(self, capability_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM mission_capabilities WHERE id=?", (capability_id,)).fetchone()
        if row is None:
            raise KeyError(capability_id)
        return self._item(row)

    def update(self, capability_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get(capability_id)
        value = self.validate({**payload, "id": capability_id}, current)
        with self._connect() as connection:
            connection.execute(
                """UPDATE mission_capabilities SET name=?, description=?, version=?, status=?,
                   required_inputs_json=?, required_agent_capabilities_json=?, input_schema=?, output_schema=?,
                   approval_policy=?, executor=?, updated_at=?, result_schema_json=? WHERE id=?""",
                (value["name"], value["description"], current["version"] + 1, value["status"],
                 json.dumps(value["requiredInputs"]), json.dumps(value["requiredAgentCapabilities"]),
                 value["inputSchema"], value["outputSchema"], value["approvalPolicy"], value["executor"], utc_now(), json.dumps(value["resultSchema"]), capability_id),
            )
        return self.get(capability_id)

    def duplicate(self, capability_id: str) -> dict[str, Any]:
        source = self.get(capability_id)
        source.update({"id": f"{capability_id}-copy-{uuid.uuid4().hex[:4]}", "name": source["name"] + " (copy)", "status": "DISABLED"})
        return self.create(source)

    def execution_status(self, capability: dict[str, Any], installed_executors: set[str], available_inputs: set[str]) -> dict[str, Any]:
        missing_inputs = sorted(set(capability["requiredInputs"]) - available_inputs)
        executor_installed = capability["executor"] in installed_executors
        executable = capability["status"] == "ACTIVE" and executor_installed and not missing_inputs
        reason = "Ready to execute."
        if capability["status"] != "ACTIVE":
            reason = "The capability is not active."
        elif not executor_installed:
            reason = f"Python executor '{capability['executor']}' is not installed."
        elif missing_inputs:
            reason = "Required inputs are unavailable: " + ", ".join(missing_inputs) + "."
        return {**capability, "executable": executable, "executorInstalled": executor_installed, "missingInputs": missing_inputs, "availabilityReason": reason}

    def validate_for_execution(self, capability_id: str, installed_executors: set[str], available_inputs: set[str]) -> dict[str, Any]:
        capability = self.execution_status(self.get(capability_id), installed_executors, available_inputs)
        if not capability["executable"]:
            raise ValueError(capability["availabilityReason"])
        return capability

    @staticmethod
    def snapshot(capability: dict[str, Any]) -> dict[str, Any]:
        return {key: capability[key] for key in ("id", "name", "version", "requiredInputs", "requiredAgentCapabilities", "inputSchema", "outputSchema", "resultSchema", "approvalPolicy", "executor")}

    @staticmethod
    def validate_result(capability: dict[str, Any], result: dict[str, Any]) -> None:
        if not isinstance(result, dict):
            raise ValueError("The mission executor returned no result object.")
        schema = capability.get("resultSchema") or {}
        for section in schema.get("requiredSections", []):
            if section not in result or not isinstance(result[section], list):
                raise ValueError(f"Mission result is missing the required {section} section.")
        for metric in result.get("summaryMetrics", []):
            if not isinstance(metric, dict) or not str(metric.get("label", "")).strip() or "value" not in metric:
                raise ValueError("Every summary metric requires a label and value.")
        for chart in result.get("charts", []):
            if not isinstance(chart, dict) or chart.get("type") not in schema.get("chartTypes", []):
                raise ValueError("Mission result contains an unsupported chart type.")
            if not isinstance(chart.get("series"), list) or not isinstance(chart.get("categories"), list):
                raise ValueError("Every chart requires categories and series arrays.")

    @staticmethod
    def _item(row: sqlite3.Row) -> dict[str, Any]:
        return {"id": row["id"], "name": row["name"], "description": row["description"], "version": row["version"], "status": row["status"], "requiredInputs": json.loads(row["required_inputs_json"]), "requiredAgentCapabilities": json.loads(row["required_agent_capabilities_json"]), "inputSchema": row["input_schema"], "outputSchema": row["output_schema"], "resultSchema": json.loads(row["result_schema_json"] or "{}"), "approvalPolicy": row["approval_policy"], "executor": row["executor"], "builtIn": bool(row["built_in"]), "createdAt": row["created_at"], "updatedAt": row["updated_at"]}

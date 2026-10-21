"""Persistent configurable mission-team templates and capability validation."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .agents import AgentRegistry


STAGE_TYPES = {"mission-manager", "data", "analysis", "insight", "report"}
REQUIRED_ADV_STAGES = STAGE_TYPES
STAGE_CAPABILITIES = {
    "mission-manager": "mission-orchestration",
    "data": "adv-analysis",
    "analysis": "adv-analysis",
    "insight": "adv-analysis",
    "report": "report-generation",
}

DEFAULT_STAGES = [
    {"id": "stage-manager", "name": "Scope and plan", "stageType": "mission-manager", "agentId": "mission-manager", "responsibility": "Validate scope, dates, dependencies, and review requirements.", "dependencies": []},
    {"id": "stage-data", "name": "Gather and validate data", "stageType": "data", "agentId": "data-agent", "responsibility": "Load permitted inputs and complete data-quality checks.", "dependencies": ["stage-manager"]},
    {"id": "stage-analysis", "name": "Execute analysis", "stageType": "analysis", "agentId": "analysis-agent", "responsibility": "Run the registered deterministic analytical capability.", "dependencies": ["stage-data"]},
    {"id": "stage-insight", "name": "Develop findings", "stageType": "insight", "agentId": "insight-agent", "responsibility": "Translate verified metrics into evidence-bounded findings.", "dependencies": ["stage-analysis"]},
    {"id": "stage-report", "name": "Generate deliverable", "stageType": "report", "agentId": "report-agent", "responsibility": "Assemble the governed report and review package.", "dependencies": ["stage-insight"]},
]

LIQUIDITY_STAGES = [
    {"id": "stage-manager", "name": "Scope and plan", "stageType": "mission-manager", "agentId": "mission-manager", "responsibility": "Validate liquidity scope, dates, dependencies, and review requirements.", "dependencies": []},
    {"id": "stage-data", "name": "Validate security trading data", "stageType": "data", "agentId": "data-agent", "responsibility": "Validate the daily security trading schema and record quality.", "dependencies": ["stage-manager"]},
    {"id": "stage-analysis", "name": "Analyse liquidity and turnover", "stageType": "analysis", "agentId": "liquidity-analysis-agent", "responsibility": "Calculate deterministic liquidity, turnover, participation, and concentration measures.", "dependencies": ["stage-data"]},
    {"id": "stage-insight", "name": "Develop bounded findings", "stageType": "insight", "agentId": "insight-agent", "responsibility": "Explain verified liquidity patterns without unsupported causal claims.", "dependencies": ["stage-analysis"]},
    {"id": "stage-report", "name": "Generate deliverable", "stageType": "report", "agentId": "report-agent", "responsibility": "Assemble the governed liquidity report and review package.", "dependencies": ["stage-insight"]},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


class MissionTeamStore:
    def __init__(self, database_path: Path, agents: AgentRegistry) -> None:
        self.database_path = database_path
        self.agents = agents
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS mission_teams (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    capability TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    stages_json TEXT NOT NULL,
                    built_in INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS mission_teams_updated ON mission_teams(updated_at DESC);
                """
            )
        self._seed_default()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    def _seed_default(self) -> None:
        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """INSERT OR IGNORE INTO mission_teams
                   VALUES ('team-adv-governed', 'Governed Analysis Team',
                   'Default reusable team for the supported governed market-analysis capability.',
                   'BursaIQ', 'adv-analysis', 1, 'ACTIVE', ?, 1, ?, ?)""",
                (json.dumps(DEFAULT_STAGES), now, now),
            )
            connection.execute(
                """INSERT OR IGNORE INTO mission_teams
                   VALUES ('team-market-liquidity', 'Market Liquidity Analysis Team',
                   'Reusable governed team for security-level liquidity and turnover analysis.',
                   'BursaIQ', 'market-liquidity-analysis', 1, 'ACTIVE', ?, 1, ?, ?)""",
                (json.dumps(LIQUIDITY_STAGES), now, now),
            )

    def validate(self, payload: dict[str, Any], current: dict[str, Any] | None = None) -> dict[str, Any]:
        value = dict(current or {})
        value.update(payload)
        for key, maximum in (("name", 120), ("description", 600), ("owner", 120), ("capability", 100)):
            text = str(value.get(key, "")).strip()
            if not text:
                raise ValueError(f"{key} is required.")
            if len(text) > maximum:
                raise ValueError(f"{key} must be {maximum} characters or fewer.")
            value[key] = text
        value["status"] = str(value.get("status", "ACTIVE")).upper()
        if value["status"] not in {"ACTIVE", "DISABLED", "ARCHIVED"}:
            raise ValueError("Unsupported mission-team status.")
        stages = value.get("stages")
        if not isinstance(stages, list) or not stages or len(stages) > 20:
            raise ValueError("A mission team requires between 1 and 20 stages.")
        ids: list[str] = []
        normalized: list[dict[str, Any]] = []
        for stage in stages:
            if not isinstance(stage, dict):
                raise ValueError("Every mission-team stage must be an object.")
            stage_id = str(stage.get("id", "")).strip()
            stage_type = str(stage.get("stageType", "")).strip()
            agent_id = str(stage.get("agentId", "")).strip()
            if not stage_id or stage_id in ids:
                raise ValueError("Every mission-team stage requires a unique id.")
            if stage_type not in STAGE_TYPES:
                raise ValueError("A mission-team stage has an unsupported type.")
            try:
                agent = self.agents.get(agent_id)
            except KeyError as exc:
                raise ValueError(f"Assigned agent {agent_id or '(missing)'} does not exist.") from exc
            if agent["status"] != "ACTIVE":
                raise ValueError(f"Assigned agent {agent['name']} is not active.")
            if value["capability"] == "adv-analysis":
                required = STAGE_CAPABILITIES[stage_type]
                if required not in agent["capabilities"]:
                    raise ValueError(f"{agent['name']} does not declare the required {required} capability for {stage_type}.")
            dependencies = stage.get("dependencies", [])
            if not isinstance(dependencies, list):
                raise ValueError("Stage dependencies must be an array.")
            ids.append(stage_id)
            normalized.append({"id": stage_id, "name": str(stage.get("name") or stage_type.replace("-", " ").title())[:120], "stageType": stage_type, "agentId": agent_id, "responsibility": str(stage.get("responsibility", ""))[:1000], "dependencies": list(dict.fromkeys(str(item) for item in dependencies))})
        id_set = set(ids)
        for stage in normalized:
            if stage["id"] in stage["dependencies"] or any(item not in id_set for item in stage["dependencies"]):
                raise ValueError("Every dependency must reference another stage in the same team.")
        visiting: set[str] = set()
        visited: set[str] = set()
        dependency_map = {stage["id"]: stage["dependencies"] for stage in normalized}
        def visit(stage_id: str) -> None:
            if stage_id in visiting:
                raise ValueError("Mission-team dependencies must not contain a cycle.")
            if stage_id in visited:
                return
            visiting.add(stage_id)
            for dependency in dependency_map[stage_id]:
                visit(dependency)
            visiting.remove(stage_id)
            visited.add(stage_id)
        for stage_id in ids:
            visit(stage_id)
        if value["capability"] == "adv-analysis":
            present = {stage["stageType"] for stage in normalized}
            missing = REQUIRED_ADV_STAGES - present
            if missing:
                raise ValueError("The supported analysis mission requires stages: " + ", ".join(sorted(missing)) + ".")
            if len(normalized) != len(REQUIRED_ADV_STAGES) or any(sum(1 for stage in normalized if stage["stageType"] == stage_type) != 1 for stage_type in REQUIRED_ADV_STAGES):
                raise ValueError("The supported analysis mission requires exactly one stage of each required type.")
            by_type = {stage["stageType"]: stage for stage in normalized}
            def ancestors(stage_id: str) -> set[str]:
                result: set[str] = set()
                for dependency in dependency_map[stage_id]:
                    result.add(dependency)
                    result.update(ancestors(dependency))
                return result
            required_order = (("mission-manager", "data"), ("data", "analysis"), ("analysis", "insight"), ("insight", "report"))
            for prerequisite, successor in required_order:
                if by_type[prerequisite]["id"] not in ancestors(by_type[successor]["id"]):
                    raise ValueError(f"The {successor} stage must depend on the {prerequisite} stage.")
        value["stages"] = normalized
        return value

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        value = self.validate(payload)
        team_id, now = f"TEAM-{uuid.uuid4().hex[:8].upper()}", utc_now()
        with self._connect() as connection:
            connection.execute("INSERT INTO mission_teams VALUES (?, ?, ?, ?, ?, 1, ?, ?, 0, ?, ?)", (team_id, value["name"], value["description"], value["owner"], value["capability"], value["status"], json.dumps(value["stages"]), now, now))
        return self.get(team_id)

    def list(self, include_archived: bool = False) -> list[dict[str, Any]]:
        query = "SELECT * FROM mission_teams" + ("" if include_archived else " WHERE status != 'ARCHIVED'") + " ORDER BY built_in DESC, updated_at DESC"
        with self._connect() as connection:
            rows = connection.execute(query).fetchall()
        return [self._team(row) for row in rows]

    def get(self, team_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM mission_teams WHERE id=?", (team_id,)).fetchone()
        if row is None:
            raise KeyError(team_id)
        return self._team(row)

    def update(self, team_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get(team_id)
        value = self.validate(payload, current)
        with self._connect() as connection:
            connection.execute("UPDATE mission_teams SET name=?, description=?, owner=?, capability=?, version=?, status=?, stages_json=?, updated_at=? WHERE id=?", (value["name"], value["description"], value["owner"], value["capability"], current["version"] + 1, value["status"], json.dumps(value["stages"]), utc_now(), team_id))
        return self.get(team_id)

    def duplicate(self, team_id: str, owner: str) -> dict[str, Any]:
        source = self.get(team_id)
        source.update({"name": source["name"] + " (copy)", "owner": owner or source["owner"], "status": "DISABLED"})
        return self.create(source)

    def validate_for_execution(self, team_id: str, capability: str = "adv-analysis", required_agent_capabilities: list[str] | None = None) -> dict[str, Any]:
        team = self.get(team_id)
        if team["status"] != "ACTIVE":
            raise ValueError("The selected mission team is not active.")
        if team["capability"] != capability:
            raise ValueError(f"The selected team does not support {capability}.")
        validated = self.validate(team)
        if required_agent_capabilities:
            declared: set[str] = set()
            for stage in validated["stages"]:
                declared.update(self.agents.get(stage["agentId"])["capabilities"])
            missing = sorted(set(required_agent_capabilities) - declared)
            if missing:
                raise ValueError("The selected team does not cover required agent capabilities: " + ", ".join(missing) + ".")
        validated["valid"] = True
        validated["orderedStages"] = self.ordered_stages(validated["stages"])
        return validated

    @staticmethod
    def ordered_stages(stages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        remaining = {stage["id"]: stage for stage in stages}
        completed: set[str] = set()
        ordered: list[dict[str, Any]] = []
        while remaining:
            ready = [stage for stage in stages if stage["id"] in remaining and set(stage["dependencies"]).issubset(completed)]
            if not ready:
                raise ValueError("Mission-team dependencies cannot be resolved.")
            for stage in ready:
                ordered.append(stage)
                completed.add(stage["id"])
                remaining.pop(stage["id"])
        return ordered

    @staticmethod
    def _team(row: sqlite3.Row) -> dict[str, Any]:
        return {"id": row["id"], "name": row["name"], "description": row["description"], "owner": row["owner"], "capability": row["capability"], "version": row["version"], "status": row["status"], "stages": json.loads(row["stages_json"]), "builtIn": bool(row["built_in"]), "createdAt": row["created_at"], "updatedAt": row["updated_at"]}

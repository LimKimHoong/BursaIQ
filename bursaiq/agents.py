"""Persistent, role-aware AI agent registry and execution audit."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


STATUSES = {"ACTIVE", "DISABLED", "ARCHIVED"}
PROVIDERS = {"ollama", "copilot"}
APPROVAL_POLICIES = {"none", "human-review", "high-impact"}
DEMO_ROLES = {"employee", "gcmc", "hr", "securities", "finance"}

BUILT_IN_AGENTS = (
    ("mission-manager", "Mission Manager", "Plans mission scope, dependencies, and review gates.", "Orchestrate the mission and stop when required inputs or approvals are missing.", "copilot", "Company-managed agent", "Mission Operations", ["mission-orchestration"], ["planning", "handoff", "approval"], "high-impact"),
    ("data-agent", "Data Agent", "Validates permitted inputs, schemas, and data quality.", "Inspect only permitted sources and report quality exceptions before analysis.", "ollama", "qwen2.5:3b", "Data Governance", ["adv-analysis", "data-quality"], ["source-search", "schema-validation"], "human-review"),
    ("analysis-agent", "Analysis Agent", "Executes governed analytical capabilities.", "Use registered deterministic tools for calculations and retain the calculation trace.", "ollama", "qwen2.5:3b", "Market Intelligence", ["adv-analysis"], ["metric-engine", "source-search"], "human-review"),
    ("liquidity-analysis-agent", "Liquidity Analysis Agent", "Analyses security-level liquidity, turnover velocity and trading participation.", "Use only the registered deterministic liquidity executor, retain calculation evidence, and avoid unsupported causal or conduct claims.", "ollama", "qwen2.5:3b", "Market Intelligence", ["market-liquidity-analysis"], ["metric-engine", "schema-validation"], "human-review"),
    ("insight-agent", "Insight Agent", "Develops evidence-bounded findings from verified results.", "Explain verified results without unsupported causal claims and preserve evidence boundaries.", "ollama", "qwen2.5:3b", "Market Intelligence", ["adv-analysis", "evidence-synthesis"], ["knowledge-search", "summarisation"], "human-review"),
    ("report-agent", "Report Agent", "Assembles governed mission deliverables.", "Create versioned deliverables from verified result payloads and retain source references.", "copilot", "Company-managed agent", "Product Development", ["adv-analysis", "report-generation"], ["pdf-report", "citation-validation"], "human-review"),
    ("research-agent", "Research Agent", "Retrieves and synthesises approved internal knowledge.", "Produce evidence-led research with citations, counterpoints, and open questions.", "copilot", "Company-managed agent", "Research", ["research"], ["knowledge-search", "citation-validation"], "human-review"),
    ("workflow-agent", "Workflow Agent", "Coordinates persistent workflow execution.", "Execute configured workflow nodes and stop at unavailable integrations or approval gates.", "ollama", "qwen2.5:3b", "Automation", ["workflow-orchestration"], ["workflow-execution"], "high-impact"),
    ("verifier-agent", "Verifier Agent", "Checks evidence, quality, and compliance boundaries.", "Check that claims are supported and route accountable decisions to a human reviewer.", "copilot", "Company-managed agent", "Governance", ["verification"], ["citation-validation", "quality-check"], "high-impact"),
    ("knowledge-agent", "Knowledge Agent", "Supports document-grounded organisational learning.", "Answer only from role-permitted indexed documents and retain citations.", "ollama", "qwen2.5:3b", "Knowledge Management", ["ask-bursa"], ["knowledge-search", "rag"], "human-review"),
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


class AgentRegistry:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialise()
        self._seed_built_ins()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _initialise(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    instructions TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    department TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    generation_json TEXT NOT NULL,
                    knowledge_json TEXT NOT NULL,
                    connectors_json TEXT NOT NULL,
                    tools_json TEXT NOT NULL,
                    capabilities_json TEXT NOT NULL,
                    input_schema_json TEXT NOT NULL,
                    output_schema_json TEXT NOT NULL,
                    approval_policy TEXT NOT NULL,
                    roles_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    built_in INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS agent_executions (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    status TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    response TEXT NOT NULL,
                    error TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    actor_role TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(agent_id) REFERENCES agents(id)
                );
                CREATE INDEX IF NOT EXISTS agents_by_status ON agents(status, updated_at DESC);
                CREATE INDEX IF NOT EXISTS agent_executions_by_agent ON agent_executions(agent_id, created_at DESC);
                """
            )

    def _seed_built_ins(self) -> None:
        now = utc_now()
        with self._connect() as connection:
            for agent_id, name, description, instructions, provider, model, department, capabilities, tools, approval in BUILT_IN_AGENTS:
                connection.execute(
                    """INSERT OR IGNORE INTO agents
                       (id, name, description, instructions, owner, department, version, provider, model,
                        generation_json, knowledge_json, connectors_json, tools_json, capabilities_json,
                        input_schema_json, output_schema_json, approval_policy, roles_json, status, built_in,
                        created_at, updated_at)
                       VALUES (?, ?, ?, ?, 'BursaIQ', ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?)""",
                    (agent_id, name, description, instructions, department, provider, model,
                     json.dumps({"temperature": 0.2, "maxTokens": 1200}), json.dumps([]), json.dumps([]),
                     json.dumps(tools), json.dumps(capabilities), json.dumps({"type": "object"}),
                     json.dumps({"type": "object"}), approval, json.dumps(["employee"]), now, now),
                )

    @staticmethod
    def validate(payload: dict[str, Any], current: dict[str, Any] | None = None) -> dict[str, Any]:
        source = dict(current or {})
        source.update(payload)
        required = ("name", "description", "instructions", "owner", "department", "provider", "model")
        for key in required:
            value = str(source.get(key, "")).strip()
            if not value:
                raise ValueError(f"{key} is required.")
            source[key] = value
        limits = {"name": 120, "description": 500, "instructions": 5000, "owner": 120, "department": 120, "model": 120}
        for key, maximum in limits.items():
            if len(source[key]) > maximum:
                raise ValueError(f"{key} must be {maximum} characters or fewer.")
        source["provider"] = source["provider"].lower()
        if source["provider"] not in PROVIDERS:
            raise ValueError("provider must be ollama or copilot.")
        source["status"] = str(source.get("status", "ACTIVE")).upper()
        if source["status"] not in STATUSES:
            raise ValueError("Unsupported agent status.")
        source["approvalPolicy"] = str(source.get("approvalPolicy", "human-review"))
        if source["approvalPolicy"] not in APPROVAL_POLICIES:
            raise ValueError("Unsupported approval policy.")
        generation = source.get("generation") or {}
        if not isinstance(generation, dict):
            raise ValueError("generation must be an object.")
        temperature = float(generation.get("temperature", 0.2))
        max_tokens = int(generation.get("maxTokens", 1200))
        if not 0 <= temperature <= 2 or not 64 <= max_tokens <= 32768:
            raise ValueError("Generation parameters are outside the supported range.")
        source["generation"] = {"temperature": temperature, "maxTokens": max_tokens}
        for key in ("knowledgeCollections", "connectors", "tools", "capabilities", "roles"):
            values = source.get(key, [])
            if not isinstance(values, list) or len(values) > 50:
                raise ValueError(f"{key} must be an array with no more than 50 values.")
            source[key] = list(dict.fromkeys(str(value).strip() for value in values if str(value).strip()))
        if not source["roles"]:
            source["roles"] = ["employee"]
        if any(role not in DEMO_ROLES for role in source["roles"]):
            raise ValueError("roles contains an unsupported role.")
        for key in ("inputSchema", "outputSchema"):
            value = source.get(key) or {"type": "object"}
            if not isinstance(value, dict):
                raise ValueError(f"{key} must be a JSON object.")
            source[key] = value
        return source

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        data = self.validate(payload)
        agent_id = f"AG-{uuid.uuid4().hex[:8].upper()}"
        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO agents
                   (id, name, description, instructions, owner, department, version, provider, model,
                    generation_json, knowledge_json, connectors_json, tools_json, capabilities_json,
                    input_schema_json, output_schema_json, approval_policy, roles_json, status, built_in,
                    created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)""",
                self._values(agent_id, data, now, now),
            )
        return self.get(agent_id)

    def list(self, role: str = "employee", include_archived: bool = False) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM agents ORDER BY built_in DESC, name COLLATE NOCASE").fetchall()
        items = [self._agent(row) for row in rows]
        return [item for item in items if self.can_access(item, role) and (include_archived or item["status"] != "ARCHIVED")]

    def get(self, agent_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
        if row is None:
            raise KeyError(agent_id)
        return self._agent(row)

    def update(self, agent_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get(agent_id)
        data = self.validate(payload, current)
        with self._connect() as connection:
            connection.execute(
                """UPDATE agents SET name=?, description=?, instructions=?, owner=?, department=?, version=?,
                   provider=?, model=?, generation_json=?, knowledge_json=?, connectors_json=?, tools_json=?,
                   capabilities_json=?, input_schema_json=?, output_schema_json=?, approval_policy=?, roles_json=?,
                   status=?, updated_at=? WHERE id=?""",
                (data["name"], data["description"], data["instructions"], data["owner"], data["department"], current["version"] + 1,
                 data["provider"], data["model"], json.dumps(data["generation"]), json.dumps(data["knowledgeCollections"]),
                 json.dumps(data["connectors"]), json.dumps(data["tools"]), json.dumps(data["capabilities"]),
                 json.dumps(data["inputSchema"]), json.dumps(data["outputSchema"]), data["approvalPolicy"],
                 json.dumps(data["roles"]), data["status"], utc_now(), agent_id),
            )
        return self.get(agent_id)

    def duplicate(self, agent_id: str, owner: str) -> dict[str, Any]:
        source = self.get(agent_id)
        source.update({"name": f"{source['name']} (copy)", "owner": owner or source["owner"], "status": "DISABLED"})
        return self.create(source)

    def archive(self, agent_id: str) -> dict[str, Any]:
        return self.update(agent_id, {"status": "ARCHIVED"})

    def record_execution(self, agent_id: str, prompt: str, role: str, result: dict[str, Any] | None = None, error: str = "") -> dict[str, Any]:
        agent = self.get(agent_id)
        execution_id, now = f"AEX-{uuid.uuid4().hex[:10].upper()}", utc_now()
        status = "COMPLETED" if result else "FAILED"
        response = str((result or {}).get("response", ""))
        with self._connect() as connection:
            connection.execute("INSERT INTO agent_executions VALUES (?, ?, 'TEST', ?, ?, ?, ?, ?, ?, ?, ?)",
                               (execution_id, agent_id, status, prompt, response, error, agent["provider"], agent["model"], role, now))
        return self.executions(agent_id, 1)[0]

    def executions(self, agent_id: str, limit: int = 25) -> list[dict[str, Any]]:
        self.get(agent_id)
        with self._connect() as connection:
            rows = connection.execute("SELECT * FROM agent_executions WHERE agent_id=? ORDER BY created_at DESC, rowid DESC LIMIT ?", (agent_id, limit)).fetchall()
        return [{"id": row["id"], "agentId": row["agent_id"], "mode": row["mode"], "status": row["status"], "prompt": row["prompt"], "response": row["response"], "error": row["error"], "provider": row["provider"], "model": row["model"], "actorRole": row["actor_role"], "createdAt": row["created_at"]} for row in rows]

    @staticmethod
    def can_access(agent: dict[str, Any], role: str) -> bool:
        roles = set(agent.get("roles", []))
        return "employee" in roles or role in roles

    @staticmethod
    def _values(agent_id: str, data: dict[str, Any], created: str, updated: str) -> tuple[Any, ...]:
        return (agent_id, data["name"], data["description"], data["instructions"], data["owner"], data["department"], data["provider"], data["model"], json.dumps(data["generation"]), json.dumps(data["knowledgeCollections"]), json.dumps(data["connectors"]), json.dumps(data["tools"]), json.dumps(data["capabilities"]), json.dumps(data["inputSchema"]), json.dumps(data["outputSchema"]), data["approvalPolicy"], json.dumps(data["roles"]), data["status"], created, updated)

    @staticmethod
    def _agent(row: sqlite3.Row) -> dict[str, Any]:
        return {"id": row["id"], "name": row["name"], "description": row["description"], "instructions": row["instructions"], "owner": row["owner"], "department": row["department"], "version": row["version"], "provider": row["provider"], "model": row["model"], "generation": json.loads(row["generation_json"]), "knowledgeCollections": json.loads(row["knowledge_json"]), "connectors": json.loads(row["connectors_json"]), "tools": json.loads(row["tools_json"]), "capabilities": json.loads(row["capabilities_json"]), "inputSchema": json.loads(row["input_schema_json"]), "outputSchema": json.loads(row["output_schema_json"]), "approvalPolicy": row["approval_policy"], "roles": json.loads(row["roles_json"]), "status": row["status"], "builtIn": bool(row["built_in"]), "createdAt": row["created_at"], "updatedAt": row["updated_at"]}

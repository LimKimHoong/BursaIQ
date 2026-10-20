"""Persistent workflow definitions, validation, and honest local execution."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


NODE_TYPES = {
    "trigger": "Trigger",
    "gather-data": "Gather Data",
    "ai-agent": "AI Agent",
    "condition": "Condition",
    "human-approval": "Human Approval",
    "generate-report": "Generate Report",
    "publish-send": "Publish / Send",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class WorkflowStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialise()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialise(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS workflows (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    status TEXT NOT NULL,
                    nodes_json TEXT NOT NULL,
                    connections_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS workflow_runs (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    events_json TEXT NOT NULL,
                    validation_json TEXT NOT NULL,
                    FOREIGN KEY(workflow_id) REFERENCES workflows(id)
                );
                CREATE INDEX IF NOT EXISTS workflow_runs_by_workflow
                    ON workflow_runs(workflow_id, started_at DESC);
                """
            )

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        workflow_id = f"WF-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        now = utc_now()
        nodes = payload.get("nodes") or []
        connections = payload.get("connections") or []
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO workflows VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?)",
                (workflow_id, payload["name"], payload.get("description", ""), payload.get("owner", "Lim Kim Hoong"), json.dumps(nodes), json.dumps(connections), now, now),
            )
        return self.get(workflow_id)

    def list(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """SELECT w.*, COUNT(r.id) AS run_count, MAX(r.started_at) AS last_run
                   FROM workflows w LEFT JOIN workflow_runs r ON r.workflow_id = w.id
                   GROUP BY w.id ORDER BY w.updated_at DESC"""
            ).fetchall()
        return [self._workflow(row) for row in rows]

    def get(self, workflow_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute(
                """SELECT w.*, COUNT(r.id) AS run_count, MAX(r.started_at) AS last_run
                   FROM workflows w LEFT JOIN workflow_runs r ON r.workflow_id = w.id
                   WHERE w.id = ? GROUP BY w.id""", (workflow_id,),
            ).fetchone()
        if row is None:
            raise KeyError(workflow_id)
        return self._workflow(row)

    def update(self, workflow_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        current = self.get(workflow_id)
        values = {
            "name": payload.get("name", current["name"]),
            "description": payload.get("description", current["description"]),
            "owner": payload.get("owner", current["owner"]),
            "status": payload.get("status", current["status"]),
            "nodes": payload.get("nodes", current["nodes"]),
            "connections": payload.get("connections", current["connections"]),
        }
        with self._connect() as connection:
            cursor = connection.execute(
                """UPDATE workflows SET name = ?, description = ?, owner = ?, status = ?,
                   nodes_json = ?, connections_json = ?, updated_at = ? WHERE id = ?""",
                (values["name"], values["description"], values["owner"], values["status"], json.dumps(values["nodes"]), json.dumps(values["connections"]), utc_now(), workflow_id),
            )
        if cursor.rowcount == 0:
            raise KeyError(workflow_id)
        return self.get(workflow_id)

    def duplicate(self, workflow_id: str) -> dict[str, Any]:
        source = self.get(workflow_id)
        return self.create({"name": f"{source['name']} (copy)", "description": source["description"], "owner": source["owner"], "nodes": source["nodes"], "connections": source["connections"]})

    def delete(self, workflow_id: str) -> None:
        with self._connect() as connection:
            connection.execute("DELETE FROM workflow_runs WHERE workflow_id = ?", (workflow_id,))
            cursor = connection.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
        if cursor.rowcount == 0:
            raise KeyError(workflow_id)

    def validate(self, workflow: dict[str, Any]) -> dict[str, Any]:
        nodes = workflow.get("nodes") or []
        connections = workflow.get("connections") or []
        errors: list[str] = []
        node_ids = [str(node.get("id", "")) for node in nodes]
        if not nodes:
            errors.append("Add at least one workflow step.")
        if len(node_ids) != len(set(node_ids)) or any(not value for value in node_ids):
            errors.append("Every node must have a unique id.")
        unknown = [node.get("type") for node in nodes if node.get("type") not in NODE_TYPES]
        if unknown:
            errors.append(f"Unsupported node type: {unknown[0]}.")
        triggers = [node for node in nodes if node.get("type") == "trigger"]
        if len(triggers) != 1:
            errors.append("A workflow must contain exactly one Trigger.")
        incoming = {node_id: 0 for node_id in node_ids}
        adjacency = {node_id: [] for node_id in node_ids}
        seen_connections: set[tuple[str, str]] = set()
        for connection in connections:
            source, target = str(connection.get("source", "")), str(connection.get("target", ""))
            if source not in incoming or target not in incoming:
                errors.append("Every connection must reference an existing node.")
                continue
            if source == target:
                errors.append("A node cannot connect to itself.")
                continue
            if (source, target) in seen_connections:
                errors.append("Duplicate connections are not allowed.")
                continue
            seen_connections.add((source, target))
            adjacency[source].append(target)
            incoming[target] += 1
        if triggers and incoming.get(triggers[0].get("id"), 0):
            errors.append("The Trigger cannot depend on another node.")
        disconnected = [node.get("name") or NODE_TYPES.get(node.get("type"), "Step") for node in nodes if node.get("type") != "trigger" and incoming.get(node.get("id"), 0) == 0]
        if disconnected:
            errors.append("Connect every step to the workflow: " + ", ".join(disconnected) + ".")
        visiting: set[str] = set()
        visited: set[str] = set()
        def visit(node_id: str) -> bool:
            if node_id in visiting:
                return True
            if node_id in visited:
                return False
            visiting.add(node_id)
            if any(visit(target) for target in adjacency.get(node_id, [])):
                return True
            visiting.remove(node_id)
            visited.add(node_id)
            return False
        if any(visit(node_id) for node_id in node_ids if node_id not in visited):
            errors.append("Workflow connections must not contain a cycle.")
        return {"valid": not errors, "errors": errors, "nodeCount": len(nodes), "connectionCount": len(connections)}

    def test(self, workflow_id: str) -> dict[str, Any]:
        workflow = self.get(workflow_id)
        validation = self.validate(workflow)
        status = "VALIDATED" if validation["valid"] else "INVALID"
        events = [{"status": status, "message": "Workflow structure passed validation." if validation["valid"] else "Workflow structure has validation errors.", "occurredAt": utc_now()}]
        return self._record_run(workflow_id, "TEST", status, events, validation)

    def run(self, workflow_id: str) -> dict[str, Any]:
        workflow = self.get(workflow_id)
        validation = self.validate(workflow)
        if not validation["valid"]:
            return self._record_run(workflow_id, "RUN", "INVALID", [], validation)
        events: list[dict[str, Any]] = []
        status = "COMPLETED"
        for node in self._ordered_nodes(workflow):
            node_type = node["type"]
            if node_type == "trigger":
                node_status, message = "COMPLETED", "Internal workflow trigger accepted."
            elif node_type == "condition" and str(node.get("config", {}).get("expression", "")).strip().lower() in {"true", "always"}:
                node_status, message = "COMPLETED", "Local condition evaluated true."
            elif node_type == "human-approval":
                node_status, message, status = "WAITING", "Waiting for the configured human approver.", "WAITING_APPROVAL"
            else:
                node_status, status = "BLOCKED", "BLOCKED"
                message = f"{NODE_TYPES[node_type]} has no configured live integration; no external action was performed."
            events.append({"nodeId": node["id"], "nodeName": node.get("name") or NODE_TYPES[node_type], "status": node_status, "message": message, "occurredAt": utc_now()})
            if status in {"WAITING_APPROVAL", "BLOCKED"}:
                break
        run = self._record_run(workflow_id, "RUN", status, events, validation)
        self.update(workflow_id, {"status": "ACTIVE" if status in {"COMPLETED", "WAITING_APPROVAL"} else "DRAFT"})
        return run

    def list_runs(self, workflow_id: str | None = None) -> list[dict[str, Any]]:
        with self._connect() as connection:
            if workflow_id:
                rows = connection.execute("SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC, rowid DESC", (workflow_id,)).fetchall()
            else:
                rows = connection.execute("SELECT * FROM workflow_runs ORDER BY started_at DESC, rowid DESC LIMIT 100").fetchall()
        return [self._run(row) for row in rows]

    def _record_run(self, workflow_id: str, mode: str, status: str, events: list[dict[str, Any]], validation: dict[str, Any]) -> dict[str, Any]:
        run_id = f"RUN-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        now = utc_now()
        with self._connect() as connection:
            connection.execute("INSERT INTO workflow_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (run_id, workflow_id, mode, status, now, now, json.dumps(events), json.dumps(validation)))
            row = connection.execute("SELECT * FROM workflow_runs WHERE id = ?", (run_id,)).fetchone()
        return self._run(row)

    @staticmethod
    def _ordered_nodes(workflow: dict[str, Any]) -> list[dict[str, Any]]:
        nodes = {node["id"]: node for node in workflow["nodes"]}
        incoming = {node_id: 0 for node_id in nodes}
        outgoing = {node_id: [] for node_id in nodes}
        for connection in workflow["connections"]:
            outgoing[connection["source"]].append(connection["target"])
            incoming[connection["target"]] += 1
        queue = [node_id for node_id in nodes if incoming[node_id] == 0]
        result = []
        while queue:
            current = queue.pop(0)
            result.append(nodes[current])
            for target in outgoing[current]:
                incoming[target] -= 1
                if incoming[target] == 0:
                    queue.append(target)
        return result

    @staticmethod
    def _workflow(row: sqlite3.Row) -> dict[str, Any]:
        keys = set(row.keys())
        return {"id": row["id"], "name": row["name"], "description": row["description"], "owner": row["owner"], "status": row["status"], "nodes": json.loads(row["nodes_json"]), "connections": json.loads(row["connections_json"]), "createdAt": row["created_at"], "updatedAt": row["updated_at"], "runCount": row["run_count"] if "run_count" in keys else 0, "lastRun": row["last_run"] if "last_run" in keys else None}

    @staticmethod
    def _run(row: sqlite3.Row) -> dict[str, Any]:
        return {"id": row["id"], "workflowId": row["workflow_id"], "mode": row["mode"], "status": row["status"], "startedAt": row["started_at"], "completedAt": row["completed_at"], "events": json.loads(row["events_json"]), "validation": json.loads(row["validation_json"])}

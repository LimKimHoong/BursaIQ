"""Persistent workflow definitions, validation, and honest local execution."""

from __future__ import annotations

import json
import inspect
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


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
            columns = {row["name"] for row in connection.execute("PRAGMA table_info(workflow_runs)").fetchall()}
            if "state_json" not in columns:
                connection.execute("ALTER TABLE workflow_runs ADD COLUMN state_json TEXT NOT NULL DEFAULT '{}'")
            if "workflow_snapshot_json" not in columns:
                connection.execute("ALTER TABLE workflow_runs ADD COLUMN workflow_snapshot_json TEXT NOT NULL DEFAULT '{}'")
            if "verification_case_id" not in columns:
                connection.execute("ALTER TABLE workflow_runs ADD COLUMN verification_case_id TEXT")

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

    def test(self, workflow_id: str, resource_validator: Callable[[dict[str, Any]], list[str]] | None = None) -> dict[str, Any]:
        workflow = self.get(workflow_id)
        validation = self.validate(workflow)
        if validation["valid"] and resource_validator:
            resource_errors = resource_validator(workflow)
            validation["errors"].extend(resource_errors)
            validation["valid"] = not validation["errors"]
        status = "VALIDATED" if validation["valid"] else "INVALID"
        events = [{"status": status, "message": "Workflow structure passed validation." if validation["valid"] else "Workflow structure has validation errors.", "occurredAt": utc_now()}]
        return self._record_run(workflow_id, "TEST", status, events, validation)

    @staticmethod
    def _event(node: dict[str, Any], status: str, message: str, *, inputs: dict[str, Any] | None = None, outputs: dict[str, Any] | None = None, error: str = "", retries: int = 0, transition: dict[str, Any] | None = None) -> dict[str, Any]:
        return {"nodeId": node["id"], "nodeName": node.get("name") or NODE_TYPES[node["type"]], "nodeType": node["type"], "status": status, "message": message, "inputs": inputs or {}, "outputs": outputs or {}, "error": error, "retries": retries, "approvalTransition": transition, "occurredAt": utc_now()}

    @staticmethod
    def _resolve(value: str, outputs: dict[str, Any]) -> Any:
        current: Any = outputs
        for part in value.strip().removeprefix("outputs.").split("."):
            if not part:
                continue
            if not isinstance(current, dict) or part not in current:
                return None
            current = current[part]
        return current

    def _condition(self, config: dict[str, Any], outputs: dict[str, Any]) -> tuple[bool, dict[str, Any]]:
        expression = str(config.get("expression", "")).strip()
        if expression.lower() in {"true", "always"}:
            return True, {"expression": expression, "resolved": True}
        if expression.lower() == "false":
            return False, {"expression": expression, "resolved": False}
        match = re.fullmatch(r"\s*([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)\s*(==|!=|>=|<=|>|<|contains)\s*(.+?)\s*", expression)
        if not match:
            raise ValueError("Condition must use a persisted output path and one of ==, !=, >, >=, <, <=, or contains.")
        left = self._resolve(match.group(1), outputs)
        raw_right = match.group(3)
        try:
            right = json.loads(raw_right)
        except json.JSONDecodeError:
            right = raw_right.strip("'\"")
        operator = match.group(2)
        try:
            if operator == "==": passed = left == right
            elif operator == "!=": passed = left != right
            elif operator == ">": passed = left > right
            elif operator == ">=": passed = left >= right
            elif operator == "<": passed = left < right
            elif operator == "<=": passed = left <= right
            else: passed = right in left
        except (TypeError, KeyError) as exc:
            raise ValueError("Condition operands are incompatible or unavailable.") from exc
        return bool(passed), {"expression": expression, "left": left, "operator": operator, "right": right, "resolved": bool(passed)}

    def run(self, workflow_id: str, executor: Callable[..., dict[str, Any]] | None = None) -> dict[str, Any]:
        workflow = self.get(workflow_id)
        validation = self.validate(workflow)
        if not validation["valid"]:
            return self._record_run(workflow_id, "RUN", "INVALID", [], validation, {}, workflow)
        status, events, state = self._execute(workflow, executor, [], {"outputs": {}, "nextIndex": 0})
        run = self._record_run(workflow_id, "RUN", status, events, validation, state, workflow)
        self.update(workflow_id, {"status": "ACTIVE" if status in {"COMPLETED", "WAITING_APPROVAL"} else "DRAFT"})
        return run

    def _execute(self, workflow: dict[str, Any], executor: Callable[..., dict[str, Any]] | None, events: list[dict[str, Any]], state: dict[str, Any]) -> tuple[str, list[dict[str, Any]], dict[str, Any]]:
        ordered = self._ordered_nodes(workflow)
        outputs = state.setdefault("outputs", {})
        status = "COMPLETED"
        for index in range(int(state.get("nextIndex", 0)), len(ordered)):
            node = ordered[index]
            node_type = node["type"]
            config = node.get("config") if isinstance(node.get("config"), dict) else {}
            upstream = {connection["source"]: outputs.get(connection["source"], {}) for connection in workflow["connections"] if connection["target"] == node["id"]}
            node_inputs = {"configured": config.get("inputs", ""), "upstream": upstream}
            if node_type == "trigger":
                result = {"accepted": True, "payload": config.get("inputs", "")}
                outputs[node["id"]] = result
                events.append(self._event(node, "COMPLETED", "Internal workflow trigger accepted.", inputs=node_inputs, outputs=result))
            elif node_type == "condition":
                try:
                    passed, result = self._condition(config, outputs)
                    outputs[node["id"]] = result
                    events.append(self._event(node, "COMPLETED" if passed else "NOT_MET", "Condition evaluated true." if passed else "Condition evaluated false; downstream execution stopped.", inputs=node_inputs, outputs=result))
                    if not passed:
                        state["nextIndex"] = len(ordered)
                        break
                except ValueError as error:
                    events.append(self._event(node, "FAILED", str(error), inputs=node_inputs, error=str(error)))
                    status = "BLOCKED"
                    state["nextIndex"] = index
                    break
            elif node_type == "human-approval":
                events.append(self._event(node, "WAITING", "Waiting for the configured human approver.", inputs=node_inputs, outputs={"approver": config.get("approver") or workflow.get("owner")}, transition={"from": "RUNNING", "to": "WAITING_APPROVAL"}))
                status = "WAITING_APPROVAL"
                state.update({"nextIndex": index + 1, "approvalNodeId": node["id"]})
                break
            else:
                if not executor:
                    message = f"{NODE_TYPES[node_type]} has no configured live integration; no external action was performed."
                    events.append(self._event(node, "BLOCKED", message, inputs=node_inputs, error=message))
                    status, state["nextIndex"] = "BLOCKED", index
                    break
                attempts = max(0, min(int(config.get("maxRetries", 0) or 0), 3)) + 1
                last_error = ""
                retry_errors: list[str] = []
                for attempt in range(attempts):
                    try:
                        accepts_context = len(inspect.signature(executor).parameters) >= 2
                        result = executor(node, {"workflow": workflow, "outputs": outputs, "inputs": node_inputs}) if accepts_context else executor(node)
                        if not isinstance(result, dict):
                            raise ValueError("The node executor returned an invalid result.")
                        node_output = result.get("outputs") if isinstance(result.get("outputs"), dict) else result
                        outputs[node["id"]] = node_output
                        events.append(self._event(node, "COMPLETED", str(result.get("message") or f"{NODE_TYPES[node_type]} completed through a configured backend service."), inputs=node_inputs, outputs=node_output, error=" | ".join(retry_errors), retries=attempt))
                        break
                    except Exception as error:
                        last_error = str(error)
                        retry_errors.append(last_error)
                        if attempt == attempts - 1:
                            events.append(self._event(node, "FAILED", last_error, inputs=node_inputs, error=last_error, retries=attempt))
                            status, state["nextIndex"] = "BLOCKED", index
                if status == "BLOCKED":
                    break
            state["nextIndex"] = index + 1
        state["outputs"] = outputs
        return status, events, state

    def decide_approval(self, run_id: str, decision: str, actor: str, comment: str, executor: Callable[..., dict[str, Any]] | None = None) -> dict[str, Any]:
        run = self.get_run(run_id)
        if run["status"] != "WAITING_APPROVAL":
            raise ValueError("Only a run waiting for approval can be decided.")
        normalized = decision.upper()
        if normalized not in {"APPROVE", "REJECT", "CHANGES"}:
            raise ValueError("decision must be APPROVE, REJECT, or CHANGES.")
        workflow = run["workflowSnapshot"] or self.get(run["workflowId"])
        approval_node = next((node for node in workflow["nodes"] if node["id"] == run["state"].get("approvalNodeId")), {"id": "approval", "name": "Human Approval", "type": "human-approval"})
        events = list(run["events"])
        final_status = "APPROVED" if normalized == "APPROVE" else "REJECTED" if normalized == "REJECT" else "CHANGES_REQUESTED"
        transition = {"from": "WAITING_APPROVAL", "to": final_status, "actor": actor, "comment": comment}
        message = f"Approval {'approved' if normalized == 'APPROVE' else 'rejected' if normalized == 'REJECT' else 'returned for changes'} by {actor}."
        events.append(self._event(approval_node, final_status, message, outputs={"decision": normalized, "actor": actor, "comment": comment}, transition=transition))
        if normalized in {"REJECT", "CHANGES"}:
            self.update(run["workflowId"], {"status": "DRAFT"})
            return self._update_run(run_id, final_status, events, run["state"], completed=True)
        status, events, state = self._execute(workflow, executor, events, run["state"])
        self.update(run["workflowId"], {"status": "ACTIVE" if status in {"COMPLETED", "WAITING_APPROVAL"} else "DRAFT"})
        return self._update_run(run_id, status, events, state, completed=status != "WAITING_APPROVAL")

    def attach_verification(self, run_id: str, case_id: str) -> dict[str, Any]:
        run = self.get_run(run_id)
        if run["status"] != "WAITING_APPROVAL":
            raise ValueError("Only a run waiting for approval can be linked to verification.")
        with self._connect() as connection:
            connection.execute("UPDATE workflow_runs SET verification_case_id=? WHERE id=?", (case_id, run_id))
        return self.get_run(run_id)

    def by_verification_case(self, case_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM workflow_runs WHERE verification_case_id=?", (case_id,)).fetchone()
        return self._run(row) if row else None

    def list_runs(self, workflow_id: str | None = None) -> list[dict[str, Any]]:
        with self._connect() as connection:
            if workflow_id:
                rows = connection.execute("SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC, rowid DESC", (workflow_id,)).fetchall()
            else:
                rows = connection.execute("SELECT * FROM workflow_runs ORDER BY started_at DESC, rowid DESC LIMIT 100").fetchall()
        return [self._run(row) for row in rows]

    def _record_run(self, workflow_id: str, mode: str, status: str, events: list[dict[str, Any]], validation: dict[str, Any], state: dict[str, Any] | None = None, workflow_snapshot: dict[str, Any] | None = None) -> dict[str, Any]:
        run_id = f"RUN-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
        now = utc_now()
        with self._connect() as connection:
            connection.execute("""INSERT INTO workflow_runs
                (id, workflow_id, mode, status, started_at, completed_at, events_json, validation_json, state_json, workflow_snapshot_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", (run_id, workflow_id, mode, status, now, None if status == "WAITING_APPROVAL" else now, json.dumps(events), json.dumps(validation), json.dumps(state or {}), json.dumps(workflow_snapshot or {})))
            row = connection.execute("SELECT * FROM workflow_runs WHERE id = ?", (run_id,)).fetchone()
        return self._run(row)

    def get_run(self, run_id: str) -> dict[str, Any]:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM workflow_runs WHERE id=?", (run_id,)).fetchone()
        if row is None:
            raise KeyError(run_id)
        return self._run(row)

    def _update_run(self, run_id: str, status: str, events: list[dict[str, Any]], state: dict[str, Any], *, completed: bool) -> dict[str, Any]:
        with self._connect() as connection:
            connection.execute("UPDATE workflow_runs SET status=?, completed_at=?, events_json=?, state_json=? WHERE id=?", (status, utc_now() if completed else None, json.dumps(events), json.dumps(state), run_id))
        return self.get_run(run_id)

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
        keys = set(row.keys())
        return {"id": row["id"], "workflowId": row["workflow_id"], "mode": row["mode"], "status": row["status"], "startedAt": row["started_at"], "completedAt": row["completed_at"], "events": json.loads(row["events_json"]), "validation": json.loads(row["validation_json"]), "state": json.loads(row["state_json"]) if "state_json" in keys else {}, "workflowSnapshot": json.loads(row["workflow_snapshot_json"]) if "workflow_snapshot_json" in keys else {}, "verificationCaseId": row["verification_case_id"] if "verification_case_id" in keys else None}

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from bursaiq.workflows import WorkflowStore


class WorkflowBuilderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / "workflows.sqlite3"
        self.store = WorkflowStore(self.database)

    def tearDown(self) -> None:
        self.temp.cleanup()

    @staticmethod
    def definition() -> dict:
        return {
            "name": "Weekly governed report",
            "description": "Prepare a checked report.",
            "owner": "Demo User",
            "nodes": [
                {"id": "trigger", "type": "trigger", "name": "Weekly trigger", "config": {}},
                {"id": "condition", "type": "condition", "name": "Proceed", "config": {"expression": "always"}},
                {"id": "approval", "type": "human-approval", "name": "Owner approval", "config": {}},
            ],
            "connections": [
                {"source": "trigger", "target": "condition"},
                {"source": "condition", "target": "approval"},
            ],
        }

    def test_creation_editing_and_reopening_are_persistent(self) -> None:
        created = self.store.create(self.definition())
        created["nodes"][1]["config"]["expression"] = "true"
        updated = self.store.update(created["id"], {"name": "Renamed workflow", "nodes": created["nodes"]})

        reopened = WorkflowStore(self.database).get(created["id"])
        self.assertEqual(updated["name"], "Renamed workflow")
        self.assertEqual(reopened["nodes"][1]["config"]["expression"], "true")
        self.assertEqual(reopened["connections"], self.definition()["connections"])

    def test_validation_detects_disconnected_and_cyclic_nodes(self) -> None:
        valid = self.store.create(self.definition())
        self.assertTrue(self.store.validate(valid)["valid"])
        broken = self.store.update(valid["id"], {"connections": [{"source": "condition", "target": "trigger"}, {"source": "trigger", "target": "condition"}]})
        validation = self.store.validate(broken)
        self.assertFalse(validation["valid"])
        self.assertTrue(any("cycle" in error.lower() for error in validation["errors"]))

    def test_test_and_run_history_are_real_and_persistent(self) -> None:
        workflow = self.store.create(self.definition())
        test_run = self.store.test(workflow["id"])
        live_run = self.store.run(workflow["id"])

        self.assertEqual(test_run["status"], "VALIDATED")
        self.assertEqual(live_run["status"], "WAITING_APPROVAL")
        self.assertEqual(live_run["events"][-1]["status"], "WAITING")
        self.assertEqual(len(WorkflowStore(self.database).list_runs(workflow["id"])), 2)

    def test_unimplemented_integrations_are_blocked_not_simulated(self) -> None:
        definition = self.definition()
        definition["nodes"][1] = {"id": "gather", "type": "gather-data", "name": "External source", "config": {}}
        definition["connections"][0]["target"] = "gather"
        definition["connections"][1]["source"] = "gather"
        workflow = self.store.create(definition)
        run = self.store.run(workflow["id"])
        self.assertEqual(run["status"], "BLOCKED")
        self.assertIn("no configured live integration", run["events"][-1]["message"])

    def test_configured_agent_executor_records_verified_backend_result(self) -> None:
        definition = self.definition()
        definition["nodes"][1] = {"id": "agent", "type": "ai-agent", "name": "Local analyst", "config": {"agent": "ollama", "inputs": "Summarise evidence"}}
        definition["connections"][0]["target"] = "agent"
        definition["connections"][1]["source"] = "agent"
        workflow = self.store.create(definition)
        run = self.store.run(workflow["id"], lambda node: {"message": f"{node['name']} returned a live result."})
        self.assertEqual(run["status"], "WAITING_APPROVAL")
        self.assertEqual(run["events"][1]["status"], "COMPLETED")
        self.assertIn("live result", run["events"][1]["message"])

    def test_duplicate_and_delete_manage_independent_drafts(self) -> None:
        workflow = self.store.create(self.definition())
        copy = self.store.duplicate(workflow["id"])
        self.assertNotEqual(copy["id"], workflow["id"])
        self.assertEqual(copy["nodes"], workflow["nodes"])
        self.store.delete(copy["id"])
        with self.assertRaises(KeyError):
            self.store.get(copy["id"])

    def test_flask_crud_validation_reopening_and_execution(self) -> None:
        from server import app

        with patch("server.workflows", self.store):
            with app.test_client() as client:
                created_response = client.post("/api/workflows", json=self.definition())
                self.assertEqual(created_response.status_code, 201)
                workflow = created_response.get_json()
                edited = client.patch(f"/api/workflows/{workflow['id']}", json={"name": "API edited"})
                self.assertEqual(edited.get_json()["name"], "API edited")
                reopened = client.get(f"/api/workflows/{workflow['id']}").get_json()
                self.assertEqual(reopened["workflow"]["name"], "API edited")
                self.assertEqual(client.post(f"/api/workflows/{workflow['id']}/test").get_json()["status"], "VALIDATED")
                self.assertEqual(client.post(f"/api/workflows/{workflow['id']}/run").get_json()["status"], "WAITING_APPROVAL")
                listed = client.get("/api/workflows").get_json()
                self.assertEqual(listed["workflows"][0]["runCount"], 2)
                self.assertEqual(len(listed["runs"]), 2)

    def test_pending_action_count_uses_only_persisted_attention_statuses(self) -> None:
        from server import app

        verification_store = Mock()
        verification_store.list_cases.return_value = [
            {"id": "pending", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Pending review"},
            {"id": "approved", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Approved"},
            {"id": "cancelled", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Cancelled"},
            {"id": "unassigned", "reviewer": "Another reviewer", "requestedBy": "Other", "status": "Pending review"},
        ]
        workflow_store = Mock()
        workflow_store.list_runs.return_value = [
            {"id": "waiting-1", "status": "WAITING_APPROVAL"},
            {"id": "waiting-2", "status": "WAITING_APPROVAL"},
            {"id": "complete", "status": "COMPLETED"},
            {"id": "rejected", "status": "REJECTED"},
        ]

        with patch("server.verification", verification_store), patch("server.workflows", workflow_store):
            with app.test_client() as client:
                payload = client.get("/api/actions/pending-count?role=securities").get_json()

        self.assertEqual(payload["count"], 3)
        self.assertEqual(payload["pendingReviews"], 1)
        self.assertEqual(payload["pendingWorkflowApprovals"], 2)


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from bursaiq.workflows import WorkflowStore
from bursaiq.store import VerificationStore


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

    def test_approval_resumes_same_run_and_persists_node_io(self) -> None:
        definition = self.definition()
        definition["nodes"].append({"id": "report", "type": "generate-report", "name": "Report", "config": {"inputs": "Prepare report"}})
        definition["connections"].append({"source": "approval", "target": "report"})
        workflow = self.store.create(definition)
        waiting = self.store.run(workflow["id"], lambda node, context: {"message": "done", "outputs": {"filename": "report.pdf"}})
        self.assertEqual(waiting["status"], "WAITING_APPROVAL")
        resumed = self.store.decide_approval(waiting["id"], "APPROVE", "Demo Approver", "Evidence checked.", lambda node, context: {"message": "Report generated.", "outputs": {"filename": "report.pdf"}})
        self.assertEqual(resumed["id"], waiting["id"])
        self.assertEqual(resumed["status"], "COMPLETED")
        self.assertEqual(resumed["events"][-2]["approvalTransition"]["to"], "APPROVED")
        self.assertEqual(resumed["events"][-1]["outputs"]["filename"], "report.pdf")
        with self.assertRaisesRegex(ValueError, "waiting for approval"):
            self.store.decide_approval(waiting["id"], "APPROVE", "Demo Approver", "Duplicate")

        changes_run = self.store.run(workflow["id"], lambda node, context: {"message": "done", "outputs": {}})
        returned = self.store.decide_approval(changes_run["id"], "CHANGES", "Demo Approver", "Update the report scope.")
        self.assertEqual(returned["status"], "CHANGES_REQUESTED")
        self.assertEqual(self.store.get(workflow["id"])["status"], "DRAFT")
        self.assertEqual(returned["events"][-1]["approvalTransition"]["to"], "CHANGES_REQUESTED")

    def test_conditions_use_persisted_outputs_and_retries_are_recorded(self) -> None:
        definition = self.definition()
        definition["nodes"] = [
            {"id": "trigger", "type": "trigger", "name": "Trigger", "config": {"inputs": "go"}},
            {"id": "agent", "type": "ai-agent", "name": "Agent", "config": {"inputs": "work", "maxRetries": 2}},
            {"id": "condition", "type": "condition", "name": "Check", "config": {"expression": "agent.score >= 2"}},
        ]
        definition["connections"] = [{"source": "trigger", "target": "agent"}, {"source": "agent", "target": "condition"}]
        attempts = {"count": 0}
        def execute(_node, _context):
            attempts["count"] += 1
            if attempts["count"] < 2:
                raise ValueError("temporary failure")
            return {"message": "scored", "outputs": {"score": 3}}
        run = self.store.run(self.store.create(definition)["id"], execute)
        self.assertEqual(run["status"], "COMPLETED")
        self.assertEqual(run["events"][1]["retries"], 1)
        self.assertEqual(run["events"][1]["error"], "temporary failure")
        self.assertTrue(run["events"][2]["outputs"]["resolved"])
        self.assertIn("upstream", run["events"][2]["inputs"])

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

        verification_store = VerificationStore(Path(self.temp.name) / "verification.sqlite3")
        with patch("server.workflows", self.store), patch("server.verification", verification_store):
            with app.test_client() as client:
                created_response = client.post("/api/workflows", json=self.definition())
                self.assertEqual(created_response.status_code, 201)
                workflow = created_response.get_json()
                edited = client.patch(f"/api/workflows/{workflow['id']}", json={"name": "API edited"})
                self.assertEqual(edited.get_json()["name"], "API edited")
                reopened = client.get(f"/api/workflows/{workflow['id']}").get_json()
                self.assertEqual(reopened["workflow"]["name"], "API edited")
                self.assertEqual(client.post(f"/api/workflows/{workflow['id']}/test").get_json()["status"], "VALIDATED")
                waiting = client.post(f"/api/workflows/{workflow['id']}/run").get_json()
                self.assertEqual(waiting["status"], "WAITING_APPROVAL")
                self.assertIsNotNone(waiting["verificationCaseId"])
                case_id = waiting["verificationCaseId"]
                decided = client.patch(f"/api/verification/{waiting['verificationCaseId']}", json={"status": "Approved", "role": "securities", "comment": "Proceed."})
                self.assertEqual(decided.status_code, 200)
                self.assertEqual(decided.get_json()["workflowRun"]["status"], "COMPLETED")
                approved_case = verification_store.get_case(case_id)
                self.assertEqual(approved_case["status"], "Approved")
                self.assertEqual(verification_store.history(case_id)[-1]["action"], "approved")

                changes_run = client.post(f"/api/workflows/{workflow['id']}/run").get_json()
                changes = client.patch(f"/api/verification/{changes_run['verificationCaseId']}", json={"status": "Changes requested", "role": "securities", "comment": "Revise the scope."})
                self.assertEqual(changes.status_code, 200)
                self.assertEqual(changes.get_json()["workflowRun"]["status"], "CHANGES_REQUESTED")

                rejected_run = client.post(f"/api/workflows/{workflow['id']}/run").get_json()
                rejected = client.patch(f"/api/verification/{rejected_run['verificationCaseId']}", json={"status": "Rejected", "role": "securities", "comment": "The workflow must not continue."})
                self.assertEqual(rejected.status_code, 200)
                self.assertEqual(rejected.get_json()["workflowRun"]["status"], "REJECTED")
                listed = client.get("/api/workflows").get_json()
                self.assertEqual(listed["workflows"][0]["runCount"], 4)
                self.assertEqual(len(listed["runs"]), 4)

    def test_pending_action_count_uses_only_persisted_attention_statuses(self) -> None:
        from server import app

        verification_store = Mock()
        verification_store.list_cases.return_value = [
            {"id": "pending", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Pending review"},
            {"id": "workflow-pending", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Pending review", "details": {"kind": "workflow-approval"}},
            {"id": "approved", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Approved"},
            {"id": "cancelled", "reviewer": "Market Intelligence Lead", "requestedBy": "Other", "status": "Cancelled"},
            {"id": "unassigned", "reviewer": "Another reviewer", "requestedBy": "Other", "status": "Pending review"},
        ]
        workflow_store = Mock()
        workflow_store.list.return_value = [{"id": "WF-1", "name": "Weekly report"}]
        workflow_store.list_runs.return_value = [
            {"id": "waiting-1", "workflowId": "WF-1", "status": "WAITING_APPROVAL", "verificationCaseId": "workflow-pending"},
            {"id": "waiting-2", "workflowId": "WF-1", "status": "WAITING_APPROVAL", "verificationCaseId": "workflow-finished"},
            {"id": "complete", "status": "COMPLETED"},
            {"id": "rejected", "status": "REJECTED"},
        ]
        platform_store = Mock()
        platform_store.list.return_value = [
            {"id": "room-pending", "title": "Confirm scope", "status": "PENDING", "data": {"kind": "decision", "roomId": "ROOM-1", "description": "Confirm the shared scope."}},
            {"id": "room-complete", "title": "Approved scope", "status": "COMPLETED", "data": {"kind": "decision", "roomId": "ROOM-1"}},
            {"id": "room-task", "title": "Prepare data", "status": "PENDING", "data": {"kind": "task", "roomId": "ROOM-1"}},
        ]

        with patch("server.verification", verification_store), patch("server.workflows", workflow_store), patch("server.platform", platform_store):
            with app.test_client() as client:
                payload = client.get("/api/actions/pending-count?role=securities").get_json()

        self.assertEqual(payload["count"], 3)
        self.assertEqual(payload["pendingReviews"], 1)
        self.assertEqual(payload["pendingWorkflowApprovals"], 1)
        self.assertEqual(payload["pendingRoomDecisions"], 1)
        self.assertEqual(len(payload["actions"]), 3)
        self.assertEqual(payload["actions"][0]["page"], "verification")
        self.assertEqual(payload["actions"][1]["type"], "workflow-approval")
        self.assertEqual(payload["actions"][2]["page"], "rooms")

    def test_server_report_executor_is_live_and_agent_names_are_not_provider_aliases(self) -> None:
        import server
        report = {"filename": "workflow-report.pdf", "fingerprint": "abc", "validation": {"valid": True}}
        with patch.object(server.reports, "generate", return_value=report) as generate:
            result = server.execute_workflow_node({"id": "report", "type": "generate-report", "name": "Risk report", "config": {"inputs": "Prepare the report"}}, {"workflow": {"owner": "Demo User"}, "outputs": {"agent": {"response": "Checked"}}})
        self.assertEqual(result["outputs"]["downloadUrl"], "/api/reports/workflow-report.pdf")
        self.assertTrue(generate.called)
        with self.assertRaisesRegex(ValueError, "registered agent"):
            server.execute_workflow_node({"id": "agent", "type": "ai-agent", "name": "Agent", "config": {"agentId": "ollama", "inputs": "Work"}})


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pypdf import PdfReader

from bursaiq.data_loader import LocalDataRepository
from bursaiq.metrics import MetricEngine
from bursaiq.copilot_studio import CopilotReply, CopilotStudioService
from bursaiq.reporting import BriefingGenerator
from bursaiq.routing import choose_workspace
from bursaiq.store import VerificationStore


ROOT = Path(__file__).resolve().parents[1]


class IngestionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = LocalDataRepository(ROOT / "Input")
        cls.loaded = cls.repository.load(force=True)

    def test_source_pack_loads_without_errors(self) -> None:
        self.assertEqual(self.loaded["meta"]["ingestionErrors"], [])
        self.assertEqual(len(self.loaded["documents"]), 5)
        self.assertEqual(self.loaded["market"]["headline"]["fbmKLCI"], 1638.2)

    def test_search_obeys_workspace_access(self) -> None:
        adv_results = self.repository.search("Explain ADV in plain language", "learn", "gcmc")
        self.assertIn("Average Daily Value", adv_results[0].excerpt)
        self.assertEqual(self.repository.search("candidate status", "hr", "gcmc"), [])
        self.assertEqual(self.repository.search("candidate status", "hr", "hr"), [])
        self.assertEqual(self.repository.search("continuous disclosure", "reg", "gcmc"), [])
        self.assertTrue(self.repository.search("continuous disclosure", "reg", "securities"))

    def test_product_discovery_retrieves_the_learning_catalogue(self) -> None:
        results = self.repository.search("What are the product options available in Bursa?", "learn", "gcmc")
        self.assertEqual(results[0].document_id, "product-overview")
        self.assertIn("structured products", results[0].excerpt.lower())
        self.assertEqual([item.document_id for item in results], ["product-overview"])

    def test_adv_is_calculated_deterministically(self) -> None:
        result = MetricEngine(self.loaded["market"]).query("How did ADV change?")
        self.assertEqual(result["intent"], "average_daily_value")
        self.assertAlmostEqual(result["facts"]["changePct"], 11.04, places=2)


class WorkflowTests(unittest.TestCase):
    def test_routing_guardrail_blocks_people_questions(self) -> None:
        self.assertEqual(choose_workspace("What are the product options available in Bursa?", "market"), ("learn", "policy-router"))
        self.assertEqual(choose_workspace("What is a candidate's application status?", "learn"), ("blocked", "policy-router"))

    def test_copilot_status_reports_missing_configuration_without_secrets(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            service = CopilotStudioService(Path(directory) / "token.json")
            with patch.dict("os.environ", {}, clear=True):
                status = service.status()
        self.assertFalse(status["configured"])
        self.assertFalse(status["available"])
        self.assertEqual(status["provider"], "microsoft-copilot-studio")
        self.assertEqual(len(status["missingSettings"]), 4)

    def test_verification_records_audit_history(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = VerificationStore(Path(directory) / "test.sqlite3")
            case = store.create_case(
                "Test briefing",
                "Market Intelligence",
                "Demo User",
                details={"question": "How did ADV change?", "formula": "latest / prior - 1"},
            )
            updated = store.update_status(case["id"], "Approved", "Demo Reviewer")
            self.assertEqual(case["details"]["question"], "How did ADV change?")
            self.assertEqual(updated["status"], "Approved")
            self.assertEqual([event["action"] for event in store.history(case["id"])], ["submitted", "approved"])

    def test_report_is_rendered_and_verified(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = BriefingGenerator(Path(directory)).generate({
                "title": "Verified test briefing",
                "question": "How did the market perform?",
                "requestedBy": "Demo User",
                "workspace": "Market Intelligence",
                "verification": "Draft — not verified",
                "answer": {
                    "html": "<p>The synthetic market advanced.</p>",
                    "agentNarrative": "Copilot Studio answer selected from governed facts.",
                    "sources": [{"title": "GCMC Market Pulse", "filename": "demo.xlsx", "owner": "GCMC", "detail": "Headline worksheet"}],
                    "method": [["1", "Retrieve", "Read source"], ["2", "Calculate", "Run formula"]],
                    "formula": "latest / prior - 1",
                    "context": {"Data class": "Synthetic demo"},
                },
            })
            self.assertTrue(result["path"].exists())
            self.assertTrue(result["validation"]["passed"])
            self.assertGreaterEqual(result["validation"]["pageCount"], 2)
            rendered_text = "\n".join(page.extract_text() or "" for page in PdfReader(result["path"]).pages)
            self.assertIn("Copilot Studio answer selected from governed facts.", rendered_text)

    def test_product_question_routes_to_learn_before_copilot(self) -> None:
        from server import app

        with patch("server.copilot.ask", return_value=CopilotReply("The agent product answer", "conv-1", ["Tell me more"])):
            with app.test_client() as client:
                response = client.post("/api/chat", json={
                    "question": "What are the products option available in Bursa?",
                    "workspace": "assistant",
                    "role": "gcmc",
                })
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["workspace"], "learn")
        self.assertEqual(payload["narrativeMode"], "copilot-studio")
        self.assertEqual(payload["conversationId"], "conv-1")
        self.assertEqual(payload["answer"], "The agent product answer")
        self.assertEqual(payload["suggestedActions"], ["Tell me more"])

    def test_chat_continues_existing_copilot_conversation(self) -> None:
        from server import app

        with patch("server.copilot.ask", return_value=CopilotReply("Agent response", "conv-1", [])) as ask:
            with app.test_client() as client:
                response = client.post("/api/chat", json={
                    "question": "How did ADV change?",
                    "workspace": "market",
                    "role": "gcmc",
                    "conversationId": "conv-1",
                })
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["narrativeMode"], "copilot-studio")
        ask.assert_called_once_with("How did ADV change?", "conv-1")

    def test_ask_reg_is_restricted_to_approved_role(self) -> None:
        from server import app

        with patch("server.copilot.ask", return_value=CopilotReply("Regulatory agent answer", "conv-reg", [])):
            with app.test_client() as client:
                approved = client.post("/api/chat", json={
                    "question": "What is continuous disclosure?",
                    "workspace": "reg",
                    "role": "securities",
                })
                blocked = client.post("/api/chat", json={
                    "question": "What is continuous disclosure?",
                    "workspace": "reg",
                    "role": "gcmc",
                })
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.get_json()["workspace"], "reg")
        self.assertEqual(approved.get_json()["answer"], "Regulatory agent answer")
        self.assertEqual(blocked.status_code, 403)

    def test_people_questions_are_outside_the_prototype(self) -> None:
        from server import app

        with app.test_client() as client:
            blocked = client.post("/api/chat", json={
                "question": "What is a candidate's application status?",
                "workspace": "assistant",
                "role": "hr",
            })
            removed_workspace = client.post("/api/chat", json={
                "question": "Hello",
                "workspace": "hr",
                "role": "hr",
            })
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(blocked.get_json()["workspace"], "blocked")
        self.assertEqual(removed_workspace.status_code, 400)

    def test_market_intelligence_is_available_to_every_demo_role(self) -> None:
        from server import app

        with app.test_client() as client:
            for role in ("gcmc", "hr", "securities", "finance"):
                with self.subTest(role=role):
                    response = client.post("/api/metrics/query", json={"question": "How did ADV change?", "role": role})
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.get_json()["calculationMode"], "deterministic")

    def test_verification_queue_is_scoped_to_assigned_reviewers(self) -> None:
        from server import app

        with app.test_client() as client:
            analyst_bootstrap = client.get("/api/bootstrap?role=gcmc").get_json()
            self.assertFalse(analyst_bootstrap["reviewerAccess"])
            self.assertEqual(analyst_bootstrap["verification"], [])
            self.assertEqual(client.get("/api/verification?role=gcmc").status_code, 403)

            reviewer_response = client.get("/api/verification?role=securities")
            self.assertEqual(reviewer_response.status_code, 200)
            cases = reviewer_response.get_json()["cases"]
            self.assertTrue(cases)
            self.assertTrue(all(case["reviewer"] == "Market Intelligence Lead" for case in cases))

            blocked_update = client.patch(f"/api/verification/{cases[0]['id']}", json={"status": "Approved", "role": "gcmc"})
            self.assertEqual(blocked_update.status_code, 403)


if __name__ == "__main__":
    unittest.main()

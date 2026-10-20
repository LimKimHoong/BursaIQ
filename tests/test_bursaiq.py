from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pypdf import PdfReader

from bursaiq.data_loader import LocalDataRepository
from bursaiq.metrics import MetricEngine
from bursaiq.copilot_studio import CopilotReply, CopilotRequestError, CopilotStudioService
from bursaiq.model_providers import ModelReply, OllamaService
from bursaiq.mission_engine import MissionStore
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
        self.assertTrue(all("qualityPct" in item and "updatedBy" in item for item in self.loaded["documents"]))
        self.assertEqual(next(item for item in self.loaded["documents"] if item["id"] == "gcmc-pulse")["health"], "Healthy")

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
    def test_mission_verification_revision_and_resubmission_lifecycle(self) -> None:
        from server import app

        with tempfile.TemporaryDirectory() as directory:
            database = Path(directory) / "workflow.sqlite3"
            mission_store = MissionStore(database)
            verification_store = VerificationStore(database)
            result = {"findings": ["Verified finding"], "formula": "total / days", "scope": {}, "sources": []}
            original = mission_store.create({"title": "ADV report", "objective": "Analyse ADV", "requestedBy": "Demo User", "dateStart": "2026-01-01", "dateEnd": "2026-09-30", "boards": []})
            mission_store.update(original["id"], status="DRAFT READY", result=result, report_filename="adv.pdf", progress=100)

            class NoopRunner:
                def start(inner_self, mission_id: str) -> dict:
                    return mission_store.get(mission_id)

            with patch("server.missions", mission_store), patch("server.verification", verification_store), patch("server.mission_runner", NoopRunner()):
                with app.test_client() as client:
                    first_submission = client.post(f"/api/missions/{original['id']}/submit-review", json={}).get_json()
                    first_case_id = first_submission["verification"]["id"]
                    changes = client.patch(f"/api/verification/{first_case_id}", json={"status": "Changes requested", "role": "securities", "comment": "Explain the monthly shift."})
                    self.assertEqual(changes.status_code, 200)
                    duplicate = client.patch(f"/api/verification/{first_case_id}", json={"status": "Approved", "role": "securities"})
                    self.assertEqual(duplicate.status_code, 409)

                    revision_payload = client.post(f"/api/missions/{original['id']}/revise", json={"requestedBy": "Demo User"}).get_json()
                    revision = revision_payload["mission"]
                    self.assertEqual(revision["version"], 2)
                    mission_store.update(revision["id"], status="DRAFT READY", result=result, report_filename="adv-v2.pdf", progress=100)
                    second_submission = client.post(f"/api/missions/{revision['id']}/submit-review", json={}).get_json()
                    second_case_id = second_submission["verification"]["id"]
                    self.assertNotEqual(second_case_id, first_case_id)
                    approval = client.patch(f"/api/verification/{second_case_id}", json={"status": "Approved", "role": "securities", "comment": "Revision confirmed."})
                    self.assertEqual(approval.status_code, 200)

            self.assertEqual(mission_store.get(original["id"])["status"], "REVISION REQUESTED")
            self.assertEqual(mission_store.get(revision["id"])["status"], "APPROVED")
            self.assertEqual(verification_store.get_case(first_case_id)["reviewerComment"], "Explain the monthly shift.")
            self.assertEqual([item["version"] for item in mission_store.version_history(revision["id"])], [1, 2])

    def test_live_model_routes_semantic_work_request_to_adv_mission(self) -> None:
        from server import app

        model_result = json.dumps({
            "route": "mission",
            "missionType": "adv-analysis",
            "title": "Liquidity movement review",
            "objective": "Validate the approved data, analyse average daily trading value shifts, and prepare the report.",
            "reason": "The request asks for the complete governed analysis deliverable.",
        })
        with patch("server.copilot.ask", return_value=CopilotReply(model_result, "route-conversation", [])) as ask:
            with app.test_client() as client:
                response = client.post("/api/intent-route", json={
                    "command": "Please investigate how trading liquidity evolved and give management a checked briefing.",
                    "provider": "copilot",
                })
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["route"], "mission")
        self.assertEqual(payload["missionType"], "adv-analysis")
        self.assertEqual(payload["provider"], "copilot")
        self.assertEqual(payload["routedBy"], "copilot-studio-language-model")
        self.assertIn("User command", ask.call_args.args[0])

    def test_live_router_does_not_use_a_keyword_fallback(self) -> None:
        from server import app

        with patch("server.copilot.ask", side_effect=CopilotRequestError("model offline")):
            with app.test_client() as client:
                response = client.post("/api/intent-route", json={"command": "Create an ADV report", "provider": "copilot"})
        self.assertEqual(response.status_code, 502)
        self.assertIn("model offline", response.get_json()["error"])

    def test_local_ollama_can_be_selected_for_semantic_routing(self) -> None:
        from server import app

        model_result = json.dumps({"route": "assistant", "reason": "This is an explanatory question."})
        with patch("server.ollama.ask", return_value=ModelReply(model_result, "ollama-request")) as ask:
            with app.test_client() as client:
                response = client.post("/api/intent-route", json={
                    "command": "Could you help me understand trading liquidity?",
                    "provider": "ollama",
                })
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["route"], "assistant")
        self.assertEqual(payload["provider"], "ollama")
        self.assertEqual(payload["routedBy"], "ollama-local-language-model")
        ask.assert_called_once()

    def test_ollama_uses_structured_non_streaming_chat(self) -> None:
        service = OllamaService()
        with patch.object(service, "_request_json", return_value={"message": {"content": '{"route":"assistant"}'}}) as request_json:
            reply = service.ask("route this request")
        self.assertEqual(reply.text, '{"route":"assistant"}')
        payload = request_json.call_args.kwargs["payload"]
        self.assertEqual(request_json.call_args.args[0], "/api/chat")
        self.assertEqual(payload["format"], "json")
        self.assertFalse(payload["stream"])
        self.assertEqual(payload["options"]["temperature"], 0)

    def test_routing_guardrail_blocks_people_questions(self) -> None:
        self.assertEqual(choose_workspace("What are the product options available in Bursa?", "market"), ("learn", "policy-router"))
        self.assertEqual(choose_workspace("What is a candidate's application status?", "learn"), ("blocked", "policy-router"))

    def test_copilot_status_reports_missing_configuration_without_secrets(self) -> None:
        service = CopilotStudioService()
        with patch.dict("os.environ", {}, clear=True):
            status = service.status()
        self.assertFalse(status["configured"])
        self.assertFalse(status["available"])
        self.assertEqual(status["provider"], "microsoft-copilot-studio-direct-line")
        self.assertEqual(status["authentication"], "none")
        self.assertEqual(status["missingSettings"], ["COPILOTSTUDIOAGENT__TOKENENDPOINT"])

    def test_direct_line_conversation_needs_no_user_sign_in(self) -> None:
        service = CopilotStudioService()
        responses = [
            {"token": "short-lived-token", "expires_in": 1800},
            {"conversationId": "conversation-1", "token": "conversation-token"},
            {"id": "user-activity-1"},
            {
                "watermark": "1",
                "activities": [{
                    "id": "agent-activity-1",
                    "type": "message",
                    "from": {"id": "copilot-agent"},
                    "text": "Anonymous Copilot response",
                    "suggestedActions": {"actions": [{"title": "Show evidence"}]},
                }],
            },
        ]
        with patch.dict("os.environ", {"COPILOTSTUDIOAGENT__TOKENENDPOINT": "https://example.test/token"}, clear=True):
            with patch.object(service, "_request_json", side_effect=responses) as request_json:
                reply = service.ask("How did the market perform?")

        self.assertEqual(reply.text, "Anonymous Copilot response")
        self.assertEqual(reply.conversation_id, "conversation-1")
        self.assertEqual(reply.suggestions, ["Show evidence"])
        self.assertEqual(request_json.call_count, 4)

    def test_verification_records_audit_history(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = VerificationStore(Path(directory) / "test.sqlite3")
            case = store.create_case(
                "Test briefing",
                "Market Intelligence",
                "Demo User",
                details={"question": "How did ADV change?", "formula": "latest / prior - 1"},
            )
            updated = store.update_status(case["id"], "Approved", "Demo Reviewer", "Figures and evidence confirmed.")
            self.assertEqual(case["details"]["question"], "How did ADV change?")
            self.assertEqual(updated["status"], "Approved")
            self.assertEqual(updated["reviewerComment"], "Figures and evidence confirmed.")
            self.assertEqual([event["action"] for event in store.history(case["id"])], ["submitted", "approved"])
            with self.assertRaisesRegex(ValueError, "already has a final decision"):
                store.update_status(case["id"], "Approved", "Demo Reviewer")

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

    def test_chat_can_use_live_local_model_without_json_mode(self) -> None:
        from server import app

        with patch("server.ollama.ask", return_value=ModelReply("Live local answer", "ollama-chat-1")) as ask:
            with app.test_client() as client:
                response = client.post("/api/chat", json={
                    "question": "Explain the approved market process",
                    "workspace": "learn",
                    "role": "gcmc",
                    "provider": "ollama",
                })
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["answer"], "Live local answer")
        self.assertEqual(payload["provider"], "ollama")
        self.assertEqual(payload["narrativeMode"], "ollama-live")
        self.assertEqual(payload["conversationId"], "ollama-chat-1")
        self.assertFalse(ask.call_args.kwargs["json_format"])

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

    def test_research_returns_a_sourced_fallback_without_agent_credentials(self) -> None:
        from server import app

        with patch("server.copilot.status", return_value={"available": False, "configured": False}):
            with app.test_client() as client:
                response = client.post("/api/research", json={
                    "query": "Assess July market liquidity and participation",
                    "role": "gcmc",
                    "depth": "deep",
                    "scope": "governed",
                })
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["mode"], "prepared-research-fallback")
        self.assertTrue(payload["sources"])
        self.assertTrue(payload["findings"])
        self.assertEqual(payload["classification"], "SYNTHETIC_DEMO_ONLY")

    def test_local_analysis_upload_query_and_clear_stays_in_memory(self) -> None:
        from server import app

        with app.test_client() as client:
            uploaded = client.post(
                "/api/local-analysis/upload",
                data={"files": (io.BytesIO(b"Owner,Decision,Amount\nMarket Intelligence,Monitor ADV,3420000000\n"), "analysis.csv")},
                content_type="multipart/form-data",
            )
            self.assertEqual(uploaded.status_code, 201)
            workspace = uploaded.get_json()
            self.assertEqual(workspace["storage"], "memory-only")
            self.assertEqual(workspace["documents"][0]["name"], "analysis.csv")

            analysed = client.post("/api/local-analysis/query", json={
                "sessionId": workspace["sessionId"],
                "question": "Who owns the ADV decision?",
                "useCopilot": False,
            })
            result = analysed.get_json()
            self.assertEqual(analysed.status_code, 200)
            self.assertEqual(result["mode"], "local-extractive")
            self.assertIn("Market Intelligence", result["answer"])
            self.assertEqual(result["citations"][0]["name"], "analysis.csv")

            cleared = client.delete(f"/api/local-analysis/{workspace['sessionId']}")
            self.assertEqual(cleared.status_code, 200)
            self.assertTrue(cleared.get_json()["cleared"])

    def test_verification_workspace_separates_assigned_and_submitted_cases(self) -> None:
        from server import app

        with app.test_client() as client:
            analyst_bootstrap = client.get("/api/bootstrap?role=gcmc").get_json()
            self.assertFalse(analyst_bootstrap["reviewerAccess"])
            self.assertEqual(analyst_bootstrap["verificationAssigned"], [])
            self.assertTrue(analyst_bootstrap["verificationRequested"])
            self.assertTrue(all(case["requestedBy"] == "Nadia Karim" for case in analyst_bootstrap["verificationRequested"]))

            analyst_response = client.get("/api/verification?role=gcmc")
            self.assertEqual(analyst_response.status_code, 200)
            analyst_payload = analyst_response.get_json()
            self.assertEqual(analyst_payload["assigned"], [])
            self.assertEqual(analyst_payload["cases"], analyst_payload["requested"])

            hr_payload = client.get("/api/verification?role=hr").get_json()
            self.assertEqual(hr_payload["assigned"], [])
            self.assertEqual(hr_payload["requested"], [])

            reviewer_response = client.get("/api/verification?role=securities")
            self.assertEqual(reviewer_response.status_code, 200)
            reviewer_payload = reviewer_response.get_json()
            cases = reviewer_payload["assigned"]
            self.assertTrue(cases)
            self.assertTrue(all(case["reviewer"] == "Market Intelligence Lead" for case in cases))

            blocked_update = client.patch(f"/api/verification/{cases[0]['id']}", json={"status": "Approved", "role": "gcmc"})
            self.assertEqual(blocked_update.status_code, 403)


if __name__ == "__main__":
    unittest.main()

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bursaiq.agents import AgentRegistry
from bursaiq.model_providers import ModelReply


class AgentRegistryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.registry = AgentRegistry(Path(self.temp.name) / "agents.sqlite3")

    def tearDown(self):
        self.temp.cleanup()

    @staticmethod
    def payload(**updates):
        payload = {
            "name": "Incident Analyst",
            "description": "Analyses operational incident evidence.",
            "instructions": "Use only permitted incident evidence and retain source references.",
            "owner": "Product Development",
            "department": "Operations",
            "provider": "ollama",
            "model": "qwen2.5:3b",
            "generation": {"temperature": 0.1, "maxTokens": 900},
            "knowledgeCollections": ["market_operations"],
            "connectors": [],
            "tools": ["incident-search"],
            "capabilities": ["incident-analysis"],
            "inputSchema": {"type": "object", "required": ["incident_id"]},
            "outputSchema": {"type": "object", "required": ["summary"]},
            "approvalPolicy": "human-review",
            "roles": ["hr"],
            "status": "ACTIVE",
        }
        payload.update(updates)
        return payload

    def test_crud_versioning_permissions_duplicate_archive_and_history(self):
        self.assertGreaterEqual(len(self.registry.list("gcmc")), 9)
        created = self.registry.create(self.payload())
        self.assertNotIn(created["id"], {item["id"] for item in self.registry.list("gcmc")})
        self.assertIn(created["id"], {item["id"] for item in self.registry.list("hr")})

        updated = self.registry.update(created["id"], {"description": "Updated governed analyst."})
        self.assertEqual(updated["version"], 2)
        self.assertEqual(updated["description"], "Updated governed analyst.")

        duplicate = self.registry.duplicate(created["id"], "Demo Owner")
        self.assertEqual(duplicate["status"], "DISABLED")
        self.assertEqual(duplicate["version"], 1)
        archived = self.registry.archive(created["id"])
        self.assertEqual(archived["status"], "ARCHIVED")
        self.assertNotIn(created["id"], {item["id"] for item in self.registry.list("hr")})
        self.assertIn(created["id"], {item["id"] for item in self.registry.list("hr", True)})

        execution = self.registry.record_execution(duplicate["id"], "Summarise this", "hr", result={"response": "Bounded result"})
        self.assertEqual(execution["status"], "COMPLETED")
        self.assertEqual(self.registry.executions(duplicate["id"])[0]["response"], "Bounded result")

    def test_api_create_edit_test_and_workflow_assignment_use_registry_id(self):
        import server

        with patch.object(server, "agent_registry", self.registry):
            client = server.app.test_client()
            created_response = client.post("/api/agents", json=self.payload(roles=["employee"]))
            self.assertEqual(created_response.status_code, 201)
            agent = created_response.get_json()
            self.assertEqual(client.get(f"/api/agents/{agent['id']}?role=gcmc").status_code, 200)

            with patch.object(server.ollama, "ask", return_value=ModelReply("Live agent result", "req-agent")) as ask:
                tested = client.post(f"/api/agents/{agent['id']}/test", json={"prompt": "Analyse incidents", "role": "gcmc"})
            self.assertEqual(tested.status_code, 200)
            self.assertEqual(tested.get_json()["execution"]["status"], "COMPLETED")
            self.assertEqual(ask.call_args.kwargs["model"], "qwen2.5:3b")

            node = {"type": "ai-agent", "name": "Incident step", "config": {"agentId": agent["id"], "inputs": "Analyse incidents"}}
            with patch.object(server.ollama, "ask", return_value=ModelReply("Workflow result", "req-workflow")):
                result = server.execute_workflow_node(node)
            self.assertIn("Incident Analyst", result["message"])

            changed = client.patch(f"/api/agents/{agent['id']}", json={"status": "DISABLED"})
            self.assertEqual(changed.get_json()["version"], 2)
            with patch.object(server.ollama, "ask", return_value=ModelReply("unused", "unused")):
                blocked = client.post(f"/api/agents/{agent['id']}/test", json={"prompt": "Run", "role": "gcmc"})
            self.assertEqual(blocked.status_code, 409)
            history = client.get(f"/api/agents/{agent['id']}?role=gcmc").get_json()["executions"]
            self.assertEqual([item["status"] for item in history[:2]], ["FAILED", "COMPLETED"])

            restricted = client.post("/api/agents", json=self.payload(name="HR Agent", roles=["hr"])).get_json()
            self.assertEqual(client.get(f"/api/agents/{restricted['id']}?role=gcmc").status_code, 403)
            self.assertEqual(client.patch(f"/api/agents/{restricted['id']}?role=gcmc", json={"status": "DISABLED"}).status_code, 403)


if __name__ == "__main__":
    unittest.main()

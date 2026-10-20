import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bursaiq.agents import AgentRegistry
from bursaiq.mission_engine import MissionStore
from bursaiq.mission_teams import MissionTeamStore


class MissionTeamTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / "teams.sqlite3"
        self.agents = AgentRegistry(self.database)
        self.teams = MissionTeamStore(self.database, self.agents)

    def tearDown(self):
        self.temp.cleanup()

    def test_reusable_team_crud_dependencies_and_capability_validation(self):
        default = self.teams.get("team-adv-governed")
        self.assertEqual(len(default["stages"]), 5)
        self.assertTrue(self.teams.validate_for_execution(default["id"])["valid"])

        analyst = self.agents.create({
            "name": "Alternative Analyst", "description": "Alternative governed analysis.",
            "instructions": "Use registered deterministic calculations.", "owner": "Demo Owner",
            "department": "Market Intelligence", "provider": "ollama", "model": "qwen2.5:3b",
            "capabilities": ["adv-analysis"], "tools": ["metric-engine"], "roles": ["employee"],
        })
        stages = [dict(stage) for stage in default["stages"]]
        analysis = next(stage for stage in stages if stage["stageType"] == "analysis")
        analysis["agentId"] = analyst["id"]
        analysis["responsibility"] = "Run the approved calculations and retain the trace."
        stages.reverse()  # Saved display order may differ; dependencies determine execution order.
        created = self.teams.create({"name": "Alternative market team", "description": "Reusable custom team.", "owner": "Demo Owner", "capability": "adv-analysis", "status": "ACTIVE", "stages": stages})
        validated = self.teams.validate_for_execution(created["id"])
        self.assertEqual([stage["stageType"] for stage in validated["orderedStages"]], ["mission-manager", "data", "analysis", "insight", "report"])
        self.assertEqual(next(stage for stage in validated["stages"] if stage["stageType"] == "analysis")["agentId"], analyst["id"])

        edited = self.teams.update(created["id"], {"description": "Updated team."})
        self.assertEqual(edited["version"], 2)
        copy = self.teams.duplicate(created["id"], "Copy Owner")
        self.assertEqual(copy["status"], "DISABLED")
        with self.assertRaisesRegex(ValueError, "not active"):
            self.teams.validate_for_execution(copy["id"])

        broken = [dict(stage) for stage in default["stages"] if stage["stageType"] != "report"]
        with self.assertRaisesRegex(ValueError, "requires stages"):
            self.teams.create({"name": "Broken", "description": "Missing report.", "owner": "Owner", "capability": "adv-analysis", "stages": broken})
        wrong_order = [dict(stage) for stage in default["stages"]]
        next(stage for stage in wrong_order if stage["stageType"] == "analysis")["dependencies"] = [next(stage for stage in wrong_order if stage["stageType"] == "mission-manager")["id"]]
        with self.assertRaisesRegex(ValueError, "analysis stage must depend on the data stage"):
            self.teams.create({"name": "Wrong order", "description": "Acyclic but operationally invalid.", "owner": "Owner", "capability": "adv-analysis", "stages": wrong_order})

    def test_mission_api_freezes_team_and_agent_versions(self):
        import server

        mission_store = MissionStore(Path(self.temp.name) / "missions.sqlite3")
        with patch.object(server, "agent_registry", self.agents), patch.object(server, "mission_teams", self.teams), patch.object(server, "missions", mission_store):
            client = server.app.test_client()
            created = client.post("/api/missions", json={"title": "Configured team mission", "objective": "Analyse ADV.", "requestedBy": "Demo User", "dateStart": "2026-01-01", "dateEnd": "2026-09-30", "boards": [], "teamId": "team-adv-governed"})
            self.assertEqual(created.status_code, 201)
            mission = created.get_json()
            self.assertEqual(mission["teamId"], "team-adv-governed")
            self.assertEqual(mission["team"]["version"], 1)
            self.assertEqual(len(mission["team"]["stages"]), 5)
            self.assertTrue(all(stage.get("agentVersion") for stage in mission["team"]["stages"]))
            self.assertTrue(all("model" in stage and "tools" in stage for stage in mission["team"]["stages"]))
            self.assertEqual(mission["capabilityId"], "adv-analysis")
            self.assertEqual(mission["capability"]["executor"], "adv_analysis")
            self.assertEqual(mission["capability"]["outputSchema"], "adv-analysis-v1")

            self.assertEqual(client.post("/api/missions", json={"title": "Bad", "objective": "Analyse ADV", "teamId": "missing-team"}).status_code, 404)


if __name__ == "__main__":
    unittest.main()

import json
import unittest
from unittest.mock import patch

import server


class InteractiveAnalyticsTests(unittest.TestCase):
    def test_model_route_contract_accepts_registered_analytics(self):
        route = server.parse_interactive_analytics_route(json.dumps({
            "route": "analytics",
            "capabilityId": "adv-analysis",
            "dateStart": "2026-06-01",
            "dateEnd": "2026-09-30",
            "boards": [],
            "chartId": "monthly-trend",
        }), {"adv-analysis"})
        self.assertEqual(route["capabilityId"], "adv-analysis")
        self.assertEqual(route["chartId"], "monthly-trend")

    def test_unregistered_model_selection_falls_back_to_chat(self):
        route = server.parse_interactive_analytics_route(json.dumps({
            "route": "analytics",
            "capabilityId": "invented-analysis",
            "dateStart": "2026-06-01",
            "dateEnd": "2026-09-30",
            "boards": [],
            "chartId": "invented-chart",
        }), {"adv-analysis"})
        self.assertEqual(route, {"route": "chat"})

    def test_assistant_executes_analysis_without_creating_mission(self):
        route = {"route": "analytics", "capabilityId": "adv-analysis", "dateStart": "2026-06-01", "dateEnd": "2026-09-30", "boards": [], "chartId": "sector-contribution"}
        before = len(server.missions.list(limit=100))
        narrative = ("Governed answer from calculated data.", "analytics-response-1", [], {"available": True}, "ollama-governed-analytics")
        with patch("server.interactive_analytics_route", return_value=(route, "router-1")), patch("server.interactive_analytics_narrative", return_value=narrative):
            with server.app.test_client() as client:
                response = client.post("/api/chat", json={"question": "Analyse sector trading contribution over the past four months and plot it.", "workspace": "assistant", "role": "gcmc", "provider": "ollama"})
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["analytics"]["capabilityId"], "adv-analysis")
        self.assertEqual(payload["analytics"]["selectedChartId"], "sector-contribution")
        self.assertEqual(payload["routedBy"], "live-model-governed-analytics")
        self.assertIn("sector-contribution", {item["id"] for item in payload["analytics"]["result"]["charts"]})
        self.assertEqual(len(server.missions.list(limit=100)), before)


if __name__ == "__main__":
    unittest.main()

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bursaiq.capabilities import MissionCapabilityRegistry


class MissionCapabilityRegistryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.registry = MissionCapabilityRegistry(Path(self.temp.name) / "test.sqlite3")

    def tearDown(self):
        self.temp.cleanup()

    def test_seeded_capability_requires_installed_executor_and_inputs(self):
        capability = self.registry.get("adv-analysis")
        unavailable = self.registry.execution_status(capability, set(), {"market_trades", "investor_participation"})
        self.assertFalse(unavailable["executable"])
        self.assertIn("not installed", unavailable["availabilityReason"])
        ready = self.registry.validate_for_execution("adv-analysis", {"adv_analysis"}, {"market_trades", "investor_participation"})
        self.assertTrue(ready["executable"])

    def test_custom_metadata_does_not_install_python_executor(self):
        created = self.registry.create({
            "id": "incident-trend-analysis",
            "name": "Operational Incident Trend Analysis",
            "description": "Analyse incident records and prepare an operational-risk report.",
            "requiredInputs": ["incident_records"],
            "requiredAgentCapabilities": ["incident-analysis", "report-generation"],
            "inputSchema": "incident-input-v1",
            "outputSchema": "incident-analysis-v1",
            "approvalPolicy": "operational-risk-review",
            "executor": "incident_analysis",
            "resultSchema": {"id": "incident-result-v1", "requiredSections": ["summaryMetrics", "tables", "charts", "findings", "evidence", "qualityChecks", "interpretationBoundaries", "downloadableOutputs"], "metricValueTypes": ["number", "text", "percentage", "currency"], "chartTypes": ["line", "bar"]},
            "status": "ACTIVE",
        })
        status = self.registry.execution_status(created, {"adv_analysis"}, {"incident_records"})
        self.assertFalse(status["executable"])
        with self.assertRaisesRegex(ValueError, "not installed"):
            self.registry.validate_for_execution(created["id"], {"adv_analysis"}, {"incident_records"})

    def test_versions_and_snapshots_are_immutable_contracts(self):
        before = self.registry.get("adv-analysis")
        snapshot = self.registry.snapshot(before)
        after = self.registry.update("adv-analysis", {"description": "Updated registry description."})
        self.assertEqual(after["version"], before["version"] + 1)
        self.assertEqual(snapshot["version"], before["version"])
        self.assertNotIn("description", snapshot)

    def test_result_contract_rejects_missing_sections_and_bad_charts(self):
        capability = self.registry.get("adv-analysis")
        empty = {section: [] for section in capability["resultSchema"]["requiredSections"]}
        self.registry.validate_result(capability, empty)
        missing = dict(empty)
        missing.pop("evidence")
        with self.assertRaisesRegex(ValueError, "evidence"):
            self.registry.validate_result(capability, missing)
        invalid_chart = {**empty, "charts": [{"type": "pie", "categories": [], "series": []}]}
        with self.assertRaisesRegex(ValueError, "unsupported chart"):
            self.registry.validate_result(capability, invalid_chart)

    def test_api_exposes_availability_and_rejects_uninstalled_capability(self):
        import server
        with patch.object(server, "capability_registry", self.registry):
            client = server.app.test_client()
            created = client.post("/api/mission-capabilities", json={
                "id": "incident-trend-analysis", "name": "Incident Trend Analysis",
                "description": "Analyse governed incident records.", "requiredInputs": ["incident_records"],
                "requiredAgentCapabilities": ["incident-analysis"], "inputSchema": "incident-input-v1",
                "outputSchema": "incident-output-v1", "approvalPolicy": "risk-review",
                "executor": "incident_analysis", "status": "ACTIVE",
                "resultSchema": {"id": "incident-result-v1", "requiredSections": ["summaryMetrics", "tables", "charts", "findings", "evidence", "qualityChecks", "interpretationBoundaries", "downloadableOutputs"], "metricValueTypes": ["number", "text", "percentage", "currency"], "chartTypes": ["line", "bar"]},
            })
            self.assertEqual(created.status_code, 201)
            self.assertFalse(created.get_json()["executable"])
            rejected = client.post("/api/missions", json={"title": "Incident review", "objective": "Analyse incidents.", "capabilityId": "incident-trend-analysis"})
            self.assertEqual(rejected.status_code, 409)
            self.assertIn("not installed", rejected.get_json()["error"])


if __name__ == "__main__":
    unittest.main()

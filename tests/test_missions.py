from __future__ import annotations

import tempfile
import time
import unittest
from pathlib import Path

from pypdf import PdfReader

from bursaiq.mission_engine import AdvMissionAnalyser, MissionRunner, MissionStore
from bursaiq.reporting import BriefingGenerator
from scripts.seed_demo_data import validate_mission_csvs


ROOT = Path(__file__).resolve().parents[1]


class AdvMissionTests(unittest.TestCase):
    def test_seed_preflight_validates_both_required_mission_csvs(self) -> None:
        validated = validate_mission_csvs(ROOT / "input")
        self.assertEqual(
            {path.name for path in validated},
            {"market_trades_demo.csv", "investor_participation_demo.csv"},
        )

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.store = MissionStore(self.base / "mission.sqlite3")
        self.reports = BriefingGenerator(self.base / "pdf")
        self.analyser = AdvMissionAnalyser(
            ROOT / "input" / "market_trades_demo.csv",
            ROOT / "input" / "investor_participation_demo.csv",
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def request(self, date_start: str = "2026-01-01") -> dict:
        return {
            "title": "Malaysia Equity Market ADV Intelligence Report",
            "objective": "Analyse ADV and prepare a report.",
            "requestedBy": "Demo User",
            "dateStart": date_start,
            "dateEnd": "2026-09-30",
            "boards": [],
        }

    def run_mission(self, date_start: str = "2026-01-01") -> dict:
        mission = self.store.create(self.request(date_start))
        runner = MissionRunner(self.store, self.analyser, self.reports.generate_mission)
        runner.start(mission["id"])
        for _ in range(100):
            mission = self.store.get(mission["id"])
            if mission["status"] in {"DRAFT READY", "FAILED"}:
                return mission
            time.sleep(0.1)
        self.fail("Mission did not reach a terminal state")

    def test_full_window_computes_verified_adv_and_pdf(self) -> None:
        mission = self.run_mission()
        self.assertEqual(mission["status"], "DRAFT READY")
        self.assertEqual(mission["result"]["metrics"]["tradingDays"], 181)
        self.assertAlmostEqual(mission["result"]["metrics"]["periodAdvBn"], 12.561, places=3)
        self.assertEqual(mission["result"]["quality"]["marketRowsRead"], 475174)
        self.assertTrue(mission["result"]["quality"]["passed"])
        report = self.base / "pdf" / mission["reportFilename"]
        self.assertTrue(report.exists())
        text = "\n".join(page.extract_text() or "" for page in PdfReader(report).pages)
        self.assertIn("RM12.561bn", text)
        self.assertIn("Evidence register", text)
        self.assertIn("SYNTHETIC", text)

    def test_changed_window_recomputes_instead_of_reusing_results(self) -> None:
        full = self.run_mission()
        april = self.run_mission("2026-04-01")
        self.assertNotEqual(full["result"]["metrics"]["periodAdvMyr"], april["result"]["metrics"]["periodAdvMyr"])
        self.assertLess(april["result"]["metrics"]["tradingDays"], full["result"]["metrics"]["tradingDays"])
        self.assertEqual(april["result"]["monthly"][0]["month"], "2026-04")

    def test_worker_execution_is_persisted_and_inspectable(self) -> None:
        mission = self.run_mission()
        completed = {event["workerId"] for event in mission["events"] if event["status"] == "COMPLETED"}
        self.assertEqual(completed, {"mission-manager", "data-agent", "analysis-agent", "insight-agent", "report-agent"})
        self.assertTrue(any(event["payload"] for event in mission["events"] if event["workerId"] == "analysis-agent"))

    def test_approved_mission_becomes_a_versioned_reusable_asset(self) -> None:
        mission = self.run_mission()
        self.store.update(mission["id"], status="APPROVED", verification_case_id="VER-APPROVED-1")
        approval = {"case": {"id": "VER-APPROVED-1", "status": "Approved", "reviewer": "Market Intelligence Lead"}, "events": [{"action": "approved", "actor": "Market Intelligence Lead"}]}
        asset = self.store.publish_asset(mission["id"], "Demo User", approval)

        self.assertEqual(asset["type"], "Reusable Mission")
        self.assertEqual(asset["version"], "v1.0")
        self.assertEqual(asset["owner"], "Demo User")
        self.assertEqual(asset["sourceMissionId"], mission["id"])
        self.assertEqual(asset["parameters"]["dateStart"], "2026-01-01")
        self.assertEqual(len(asset["evidence"]), 2)
        self.assertEqual(asset["approvalRecord"]["case"]["status"], "Approved")
        self.assertEqual(self.store.publish_asset(mission["id"], "Demo User", approval)["id"], asset["id"])
        self.assertEqual(len(self.store.list_assets()), 1)

        reused = self.store.create({**self.request(), "objective": asset["parameters"]["objective"]})
        self.store.event(reused["id"], "mission-manager", "REUSED", "Mission created from an approved Exchange asset.", {"assetId": asset["id"]})
        updated_asset = self.store.record_reuse(asset["id"])
        self.assertEqual(updated_asset["reuseCount"], 1)
        self.assertTrue(any(event["status"] == "REUSED" for event in self.store.get(reused["id"])["events"]))

    def test_revision_creates_linked_version_without_overwriting_original(self) -> None:
        original = self.store.create(self.request())
        self.store.update(original["id"], status="REVISION REQUESTED", result={"snapshot": "original"}, verification_case_id="VER-1")
        revised = self.store.create_revision(original["id"], "Demo User")

        retained = self.store.get(original["id"])
        self.assertEqual(retained["status"], "REVISION REQUESTED")
        self.assertEqual(retained["result"], {"snapshot": "original"})
        self.assertEqual(retained["verificationCaseId"], "VER-1")
        self.assertEqual(revised["version"], 2)
        self.assertEqual(revised["rootMissionId"], original["id"])
        self.assertEqual(revised["supersedesMissionId"], original["id"])
        self.assertEqual([item["version"] for item in self.store.version_history(revised["id"])], [1, 2])
        self.assertTrue(any(event["status"] == "SUPERSEDED" for event in retained["events"]))



if __name__ == "__main__":
    unittest.main()

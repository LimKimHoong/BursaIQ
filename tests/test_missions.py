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


if __name__ == "__main__":
    unittest.main()

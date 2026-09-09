from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from bursaiq.data_loader import LocalDataRepository
from bursaiq.metrics import MetricEngine
from bursaiq.reporting import BriefingGenerator
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
        self.assertTrue(self.repository.search("Average Daily Value", "learn", "gcmc"))
        self.assertEqual(self.repository.search("Alya", "hr", "gcmc"), [])
        self.assertTrue(self.repository.search("Alya", "hr", "hr"))

    def test_adv_is_calculated_deterministically(self) -> None:
        result = MetricEngine(self.loaded["market"]).query("How did ADV change?")
        self.assertEqual(result["intent"], "average_daily_value")
        self.assertAlmostEqual(result["facts"]["changePct"], 11.04, places=2)


class WorkflowTests(unittest.TestCase):
    def test_verification_records_audit_history(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = VerificationStore(Path(directory) / "test.sqlite3")
            case = store.create_case("Test briefing", "Market Intelligence", "Demo User")
            updated = store.update_status(case["id"], "Approved", "Demo Reviewer")
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
                    "sources": [{"title": "GCMC Market Pulse", "filename": "demo.xlsx", "owner": "GCMC", "detail": "Headline worksheet"}],
                    "method": [["1", "Retrieve", "Read source"], ["2", "Calculate", "Run formula"]],
                    "formula": "latest / prior - 1",
                    "context": {"Data class": "Synthetic demo"},
                },
            })
            self.assertTrue(result["path"].exists())
            self.assertTrue(result["validation"]["passed"])
            self.assertGreaterEqual(result["validation"]["pageCount"], 2)


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from bursaiq.agents import AgentRegistry
from bursaiq.capabilities import MissionCapabilityRegistry, TRADING_CAPABILITY
from bursaiq.liquidity_analysis import MarketLiquidityAnalyser
from bursaiq.mission_teams import MissionTeamStore


class MarketLiquidityMissionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.database = root / "registry.sqlite3"
        self.source = root / "daily_security_trading_demo.csv"
        with self.source.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["trade_date", "security_code", "security_name", "board", "sector", "volume_traded", "value_traded_myr", "number_of_trades", "shares_outstanding"])
            writer.writeheader()
            writer.writerows([
                {"trade_date": "2026-01-02", "security_code": "AAA", "security_name": "Alpha", "board": "MAIN", "sector": "Technology", "volume_traded": 1000, "value_traded_myr": 2500, "number_of_trades": 10, "shares_outstanding": 100000},
                {"trade_date": "2026-01-03", "security_code": "AAA", "security_name": "Alpha", "board": "MAIN", "sector": "Technology", "volume_traded": 1500, "value_traded_myr": 3750, "number_of_trades": 15, "shares_outstanding": 100000},
                {"trade_date": "2026-01-02", "security_code": "BBB", "security_name": "Beta", "board": "ACE", "sector": "Industrial", "volume_traded": 500, "value_traded_myr": 750, "number_of_trades": 5, "shares_outstanding": 50000},
            ])

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_registry_agents_and_reusable_team_are_seeded(self) -> None:
        registry = MissionCapabilityRegistry(self.database)
        capability = registry.get("market-liquidity-analysis")
        self.assertEqual(capability["executor"], "market_liquidity_analysis")
        self.assertEqual(capability["outputSchema"], "market-liquidity-v1")
        ready = registry.validate_for_execution(capability["id"], {"market_liquidity_analysis"}, {"daily_security_trading"})
        self.assertTrue(ready["executable"])

        agents = AgentRegistry(self.database)
        teams = MissionTeamStore(self.database, agents)
        team = teams.validate_for_execution("team-market-liquidity", capability["id"], capability["requiredAgentCapabilities"])
        self.assertEqual([stage["stageType"] for stage in team["orderedStages"]], ["mission-manager", "data", "analysis", "insight", "report"])
        self.assertEqual(next(stage for stage in team["stages"] if stage["stageType"] == "analysis")["agentId"], "liquidity-analysis-agent")

    def test_deterministic_executor_returns_the_registered_result_contract(self) -> None:
        events = []
        result = MarketLiquidityAnalyser(self.source).analyse("2026-01-01", "2026-01-31", [], lambda *args: events.append(args))
        MissionCapabilityRegistry.validate_result(TRADING_CAPABILITY, result)
        self.assertEqual(result["metrics"]["activeSecurities"], 2)
        self.assertEqual(result["metrics"]["tradingDays"], 2)
        self.assertEqual(result["metrics"]["totalTradedValueMyr"], 7000)
        self.assertEqual(result["securities"][0]["securityCode"], "AAA")
        self.assertEqual([event[0] for event in events], ["data", "analysis", "insight"])

    def test_executor_rejects_missing_columns(self) -> None:
        self.source.write_text("trade_date,security_code\n2026-01-01,AAA\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "missing columns"):
            MarketLiquidityAnalyser(self.source).analyse("2026-01-01", "2026-01-31", [], lambda *_: None)


if __name__ == "__main__":
    unittest.main()

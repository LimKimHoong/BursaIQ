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
            writer = csv.DictWriter(handle, fieldnames=["trade_date", "security_code", "security_name", "board", "sector", "opening_price", "highest_price", "lowest_price", "closing_price", "market_cap_myr", "traded_value_myr", "traded_volume", "number_of_trades"])
            writer.writeheader()
            writer.writerows([
                {"trade_date": "2026-01-02", "security_code": "AAA", "security_name": "Alpha", "board": "MAIN", "sector": "Technology", "opening_price": 2.40, "highest_price": 2.60, "lowest_price": 2.30, "closing_price": 2.50, "market_cap_myr": 100000, "traded_value_myr": 2500, "traded_volume": 1000, "number_of_trades": 10},
                {"trade_date": "2026-01-03", "security_code": "AAA", "security_name": "Alpha", "board": "MAIN", "sector": "Technology", "opening_price": 2.50, "highest_price": 2.65, "lowest_price": 2.45, "closing_price": 2.55, "market_cap_myr": 120000, "traded_value_myr": 3750, "traded_volume": 1500, "number_of_trades": 15},
                {"trade_date": "2026-01-02", "security_code": "BBB", "security_name": "Beta", "board": "ACE", "sector": "Industrial", "opening_price": 1.45, "highest_price": 1.55, "lowest_price": 1.40, "closing_price": 1.50, "market_cap_myr": 50000, "traded_value_myr": 750, "traded_volume": 500, "number_of_trades": 5},
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
        self.assertEqual(result["metrics"]["medianTurnoverPct"], 2.5)
        self.assertGreater(result["metrics"]["medianDailyRangePct"], 0)
        self.assertEqual(result["securities"][0]["securityCode"], "AAA")
        self.assertEqual([event[0] for event in events], ["data", "analysis", "insight"])

    def test_executor_rejects_missing_columns(self) -> None:
        self.source.write_text("trade_date,security_code\n2026-01-01,AAA\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "missing columns"):
            MarketLiquidityAnalyser(self.source).analyse("2026-01-01", "2026-01-31", [], lambda *_: None)


if __name__ == "__main__":
    unittest.main()

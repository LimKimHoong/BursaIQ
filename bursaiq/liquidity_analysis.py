"""Deterministic market-liquidity mission analysis over daily security trading data."""

from __future__ import annotations

import csv
import hashlib
import statistics
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable


class MarketLiquidityAnalyser:
    REQUIRED_COLUMNS = {
        "trade_date", "security_code", "security_name", "board", "sector",
        "opening_price", "highest_price", "lowest_price", "closing_price",
        "market_cap_myr", "traded_value_myr", "traded_volume", "number_of_trades",
    }

    def __init__(self, source_path: Path) -> None:
        self.source_path = source_path
        self.source_paths = [source_path]

    @staticmethod
    def _date(value: str) -> date:
        return datetime.strptime(value.strip(), "%Y-%m-%d").date()

    @staticmethod
    def _fingerprint(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()

    def analyse(self, date_start: str, date_end: str, boards: list[str], progress: Callable[[str, str, dict[str, Any]], None]) -> dict[str, Any]:
        if not self.source_path.is_file():
            raise ValueError(f"Required input is unavailable: {self.source_path.name}.")
        start, end = self._date(date_start), self._date(date_end)
        if start > end:
            raise ValueError("Mission start date must not be after the end date.")
        selected_boards = {item.strip() for item in boards if item.strip()}
        rows_read = invalid_rows = eligible_rows = duplicate_rows = 0
        seen: set[tuple[str, str]] = set()
        available_boards: set[str] = set()
        trading_days: set[str] = set()
        monthly: dict[str, dict[str, float]] = defaultdict(lambda: {"value": 0.0, "volume": 0.0, "trades": 0.0})
        securities: dict[str, dict[str, Any]] = {}
        sector_totals: dict[str, dict[str, float]] = defaultdict(lambda: {"value": 0.0, "volume": 0.0, "trades": 0.0, "turnoverSum": 0.0, "observations": 0.0})
        with self.source_path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            missing = self.REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                raise ValueError(f"{self.source_path.name} is missing columns: {', '.join(sorted(missing))}")
            for row in reader:
                rows_read += 1
                try:
                    row_date = self._date(row["trade_date"])
                    opening_price = float(row["opening_price"])
                    highest_price = float(row["highest_price"])
                    lowest_price = float(row["lowest_price"])
                    closing_price = float(row["closing_price"])
                    market_cap = float(row["market_cap_myr"])
                    volume = float(row["traded_volume"])
                    traded_value = float(row["traded_value_myr"])
                    trades = float(row["number_of_trades"])
                    if min(volume, traded_value, trades) < 0 or min(opening_price, highest_price, lowest_price, closing_price, market_cap) <= 0:
                        raise ValueError
                    if highest_price < lowest_price or not lowest_price <= opening_price <= highest_price or not lowest_price <= closing_price <= highest_price:
                        raise ValueError
                except (TypeError, ValueError):
                    invalid_rows += 1
                    continue
                board = row["board"].strip()
                available_boards.add(board)
                if not (start <= row_date <= end) or selected_boards and board not in selected_boards:
                    continue
                key = (row_date.isoformat(), row["security_code"].strip())
                if key in seen:
                    duplicate_rows += 1
                    continue
                seen.add(key)
                eligible_rows += 1
                day, month = row_date.isoformat(), row_date.isoformat()[:7]
                trading_days.add(day)
                turnover = traded_value / market_cap * 100
                daily_range = (highest_price - lowest_price) / opening_price * 100
                security = securities.setdefault(row["security_code"].strip(), {"securityCode": row["security_code"].strip(), "securityName": row["security_name"].strip(), "board": board, "sector": row["sector"].strip(), "value": 0.0, "volume": 0.0, "trades": 0.0, "turnovers": [], "dailyRanges": [], "closingPrices": [], "marketCaps": [], "days": set()})
                security["value"] += traded_value; security["volume"] += volume; security["trades"] += trades; security["turnovers"].append(turnover); security["dailyRanges"].append(daily_range); security["closingPrices"].append(closing_price); security["marketCaps"].append(market_cap); security["days"].add(day)
                monthly[month]["value"] += traded_value; monthly[month]["volume"] += volume; monthly[month]["trades"] += trades
                sector = sector_totals[row["sector"].strip()]
                sector["value"] += traded_value; sector["volume"] += volume; sector["trades"] += trades; sector["turnoverSum"] += turnover; sector["observations"] += 1
        if not eligible_rows:
            raise ValueError("No eligible security-trading records were found for the selected period and board scope.")
        progress("data", "Daily security trading source validated and filtered.", {"rowsRead": rows_read, "eligibleRows": eligible_rows, "invalidRows": invalid_rows, "duplicateSecurityDatesExcluded": duplicate_rows})
        security_rows = []
        for item in securities.values():
            days = len(item["days"])
            security_rows.append({"securityCode": item["securityCode"], "securityName": item["securityName"], "board": item["board"], "sector": item["sector"], "totalValueMyr": round(item["value"], 2), "averageDailyValueMyr": round(item["value"] / days, 2), "averageTurnoverPct": round(statistics.mean(item["turnovers"]), 4), "averageTradeSizeMyr": round(item["value"] / item["trades"], 2) if item["trades"] else 0.0, "averageDailyRangePct": round(statistics.mean(item["dailyRanges"]), 4), "latestClosingPrice": round(item["closingPrices"][-1], 4), "averageMarketCapMyr": round(statistics.mean(item["marketCaps"]), 2), "tradingDays": days})
        security_rows.sort(key=lambda item: item["averageDailyValueMyr"], reverse=True)
        total_value = sum(item["value"] for item in securities.values())
        turnover_values = [value for item in securities.values() for value in item["turnovers"]]
        daily_range_values = [value for item in securities.values() for value in item["dailyRanges"]]
        avg_trade_sizes = [item["value"] / item["trades"] for item in securities.values() if item["trades"]]
        low_liquidity_threshold = statistics.median(item["averageDailyValueMyr"] for item in security_rows)
        low_liquidity = [item for item in security_rows if item["averageDailyValueMyr"] < low_liquidity_threshold]
        monthly_rows = [{"month": month, "label": datetime.strptime(month, "%Y-%m").strftime("%b %Y"), "tradedValueMyr": round(values["value"], 2), "volumeTraded": round(values["volume"], 2), "numberOfTrades": round(values["trades"])} for month, values in sorted(monthly.items())]
        sector_rows = [{"sector": name, "tradedValueMyr": round(values["value"], 2), "sharePct": round(values["value"] / total_value * 100, 2), "averageTurnoverPct": round(values["turnoverSum"] / values["observations"], 4), "averageTradeSizeMyr": round(values["value"] / values["trades"], 2) if values["trades"] else 0.0} for name, values in sorted(sector_totals.items(), key=lambda pair: pair[1]["value"], reverse=True)]
        progress("analysis", "Liquidity, market-cap turnover, price range, average trade size and participation metrics computed.", {"securities": len(security_rows), "tradingDays": len(trading_days), "totalValueMyr": round(total_value, 2)})
        leader = security_rows[0]
        findings = [
            f"{len(security_rows):,} securities generated RM{total_value / 1_000_000_000:.2f}bn across {len(trading_days)} trading days.",
            f"{leader['securityName']} ({leader['securityCode']}) recorded the highest average daily trading value at RM{leader['averageDailyValueMyr'] / 1_000_000:.2f}m.",
            f"{len(low_liquidity):,} securities were below the portfolio median average daily trading value of RM{low_liquidity_threshold / 1_000_000:.2f}m.",
        ]
        interpretation = "Liquidity rankings are descriptive measures from synthetic daily trading records. They do not indicate fair value, market quality breaches, investor intent, or misconduct. Corporate actions and free-float changes require separate evidence."
        progress("insight", "Evidence-bounded liquidity findings prepared.", {"findingCount": len(findings), "unsupportedCausalClaims": 0})
        source = {"filename": self.source_path.name, "sha256": self._fingerprint(self.source_path), "rowsRead": rows_read, "eligibleRows": eligible_rows, "coveredDates": f"{min(trading_days)} to {max(trading_days)}", "role": "Security liquidity, turnover, participation and concentration"}
        return {
            "classification": "SYNTHETIC DEMONSTRATION DATA — NOT FOR MARKET DECISIONS",
            "scope": {"dateStart": start.isoformat(), "dateEnd": end.isoformat(), "boards": sorted(selected_boards) if selected_boards else sorted(available_boards), "unit": "MYR", "tradingDayRule": "Distinct eligible trade dates", "duplicateRule": "Duplicate security-code and trade-date rows are excluded."},
            "metrics": {"totalTradedValueMyr": round(total_value, 2), "tradingDays": len(trading_days), "activeSecurities": len(security_rows), "medianTurnoverPct": round(statistics.median(turnover_values), 4), "medianDailyRangePct": round(statistics.median(daily_range_values), 4), "medianAverageTradeSizeMyr": round(statistics.median(avg_trade_sizes), 2) if avg_trade_sizes else 0.0, "lowLiquiditySecurities": len(low_liquidity)},
            "monthly": monthly_rows, "securities": security_rows, "sectors": sector_rows, "findings": findings,
            "formula": "Market-cap turnover = traded value / market capitalisation; average trade size = traded value / number of trades; intraday price range = (highest price - lowest price) / opening price.",
            "sources": [source], "interpretationBoundary": interpretation,
            "summaryMetrics": [
                {"id": "total-value", "label": "Total trading value", "value": round(total_value / 1_000_000_000, 3), "valueType": "currency", "unit": "RM bn", "decimals": 3},
                {"id": "median-turnover", "label": "Median market-cap turnover", "value": round(statistics.median(turnover_values), 4), "valueType": "percentage", "unit": "%", "decimals": 4},
                {"id": "median-range", "label": "Median intraday price range", "value": round(statistics.median(daily_range_values), 4), "valueType": "percentage", "unit": "%", "decimals": 4},
                {"id": "average-trade", "label": "Median average trade size", "value": round(statistics.median(avg_trade_sizes), 2) if avg_trade_sizes else 0.0, "valueType": "currency", "unit": "MYR", "decimals": 2},
                {"id": "active-securities", "label": "Active securities", "value": len(security_rows), "valueType": "number", "unit": "securities", "decimals": 0},
                {"id": "low-liquidity", "label": "Below-median liquidity", "value": len(low_liquidity), "valueType": "number", "unit": "securities", "decimals": 0},
            ],
            "tables": [
                {"id": "security-liquidity", "title": "Security liquidity ranking", "columns": [{"key": "securityCode", "label": "Code"}, {"key": "securityName", "label": "Security"}, {"key": "averageDailyValueMyr", "label": "Average daily value", "valueType": "currency", "unit": "MYR"}, {"key": "averageTurnoverPct", "label": "Market-cap turnover", "valueType": "percentage", "unit": "%"}, {"key": "averageTradeSizeMyr", "label": "Average trade size", "valueType": "currency", "unit": "MYR"}, {"key": "averageDailyRangePct", "label": "Intraday range", "valueType": "percentage", "unit": "%"}], "rows": security_rows[:20]},
                {"id": "sector-liquidity", "title": "Liquidity by sector", "columns": [{"key": "sector", "label": "Sector"}, {"key": "sharePct", "label": "Trading-value share", "valueType": "percentage", "unit": "%"}, {"key": "averageTurnoverPct", "label": "Market-cap turnover", "valueType": "percentage", "unit": "%"}], "rows": sector_rows},
            ],
            "charts": [
                {"id": "monthly-value", "title": "Monthly trading value", "type": "line", "categories": [item["label"] for item in monthly_rows], "series": [{"name": "Trading value", "values": [round(item["tradedValueMyr"] / 1_000_000_000, 3) for item in monthly_rows], "unit": "RM bn"}]},
                {"id": "sector-turnover", "title": "Average market-cap turnover by sector", "type": "bar", "categories": [item["sector"] for item in sector_rows], "series": [{"name": "Market-cap turnover", "values": [item["averageTurnoverPct"] for item in sector_rows], "unit": "%"}]},
            ],
            "evidence": [{"title": source["filename"], "reference": source["sha256"], "detail": source["role"], "metadata": {"rowsRead": rows_read, "eligibleRows": eligible_rows, "coveredDates": source["coveredDates"]}}],
            "qualityChecks": [
                {"id": "schema", "label": "Required-column validation", "status": "PASSED", "detail": "All required daily security trading columns were present."},
                {"id": "records", "label": "Record validation", "status": "PASSED" if invalid_rows == 0 else "EXCEPTION", "detail": f"{eligible_rows:,} eligible rows; {invalid_rows:,} invalid rows; {duplicate_rows:,} duplicate security dates excluded."},
            ],
            "interpretationBoundaries": [interpretation], "downloadableOutputs": [],
        }

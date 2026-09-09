"""Deterministic GCMC metric tools kept outside any language model."""

from __future__ import annotations

from typing import Any


def _pct(value: float) -> str:
    return f"{value:+.1f}%"


def _number(value: float, digits: int = 1) -> str:
    return f"{value:,.{digits}f}"


class MetricEngine:
    def __init__(self, market: dict[str, Any]) -> None:
        self.market = market

    def query(self, question: str) -> dict[str, Any]:
        lowered = question.lower()
        if any(term in lowered for term in ("adv", "daily value", "trading activity")):
            return self.adv()
        if any(term in lowered for term in ("sector", "driver", "stock", "counter", "attribution")):
            return self.drivers()
        if any(term in lowered for term in ("regional", "international", "peer", "singapore", "thailand", "indonesia", "s&p")):
            return self.regional()
        if any(term in lowered for term in ("velocity", "market cap", "market value", "capitalisation")):
            return self.market_size()
        if any(term in lowered for term in ("investor", "flow", "participation", "foreign")):
            return self.participation()
        return self.performance()

    def performance(self) -> dict[str, Any]:
        h = self.market["headline"]
        breadth = int(h["gainers"]) + int(h["losers"]) + int(h["unchanged"])
        return {
            "intent": "market_performance",
            "title": "The market advanced in July, with broad but selective support",
            "facts": {
                "fbmKLCI": h["fbmKLCI"],
                "mtdPct": h["klciMtdPct"],
                "ytdPct": h["klciYtdPct"],
                "marketCapBn": h["marketCapBn"],
                "breadthTotal": breadth,
            },
            "summary": f"The synthetic FBM KLCI closed at {_number(h['fbmKLCI'])}, {_pct(h['klciMtdPct'])} MTD and {_pct(h['klciYtdPct'])} YTD.",
            "formula": "MTD return = (latest index / prior month index - 1) x 100",
            "sourceRefs": ["gcmc-pulse:Headline", "gcmc-pulse:Sectors"],
        }

    def adv(self) -> dict[str, Any]:
        h = self.market["headline"]
        change = (float(h["adv30dBn"]) / float(h["advPrior30dBn"]) - 1) * 100
        return {
            "intent": "average_daily_value",
            "title": "Trading activity strengthened over the latest 30-day window",
            "facts": {"latestAdvBn": h["adv30dBn"], "priorAdvBn": h["advPrior30dBn"], "changePct": round(change, 2)},
            "summary": f"Synthetic 30-day ADV was RM{h['adv30dBn']:.2f}bn, {_pct(change)} versus the preceding window.",
            "formula": f"(RM{h['adv30dBn']:.2f}bn / RM{h['advPrior30dBn']:.2f}bn - 1) x 100 = {change:.2f}%",
            "sourceRefs": ["gcmc-pulse:Headline", "gcmc-pulse:Participation"],
        }

    def drivers(self) -> dict[str, Any]:
        sectors = sorted(self.market["sectors"], key=lambda row: float(row["contributionPoints"]), reverse=True)
        top_two = sum(float(row["contributionPoints"]) for row in sectors[:2])
        return {
            "intent": "index_drivers",
            "title": "Technology and Financial Services were the principal index drivers",
            "facts": {"topSectors": sectors[:3], "topTwoContributionPoints": round(top_two, 1)},
            "summary": f"The two leading synthetic sectors added {top_two:.1f} index points together.",
            "formula": "Sector contribution = sum(constituent weight x constituent price return)",
            "sourceRefs": ["gcmc-pulse:Sectors", "gcmc-pulse:Counters"],
        }

    def regional(self) -> dict[str, Any]:
        ranking = sorted(self.market["regional"], key=lambda row: float(row["mtdPct"]), reverse=True)
        rank = next(index for index, row in enumerate(ranking, start=1) if str(row["market"]).startswith("Malaysia"))
        return {
            "intent": "regional_comparison",
            "title": f"Malaysia ranked {rank} in the prepared comparison set",
            "facts": {"rank": rank, "markets": ranking},
            "summary": "Returns are local-currency price returns and are not adjusted for dividends, volatility or foreign exchange.",
            "formula": "Rank markets by descending month-to-date local-currency price return",
            "sourceRefs": ["gcmc-pulse:Regional"],
        }

    def market_size(self) -> dict[str, Any]:
        h = self.market["headline"]
        delta = float(h["velocityPct"]) - float(h["velocityPriorPct"])
        return {
            "intent": "market_size_velocity",
            "title": "Market value and trading velocity both improved",
            "facts": {"marketCapBn": h["marketCapBn"], "velocityPct": h["velocityPct"], "velocityDeltaPoints": round(delta, 1)},
            "summary": f"Synthetic market capitalisation reached RM{h['marketCapBn']:,.1f}bn and annualised velocity was {h['velocityPct']:.1f}%.",
            "formula": "Velocity = 30-day ADV x 252 trading days / market capitalisation x 100",
            "sourceRefs": ["gcmc-pulse:Headline"],
        }

    def participation(self) -> dict[str, Any]:
        rows = self.market["participation"]
        reconciliation = sum(float(row["netFlowMn"]) for row in rows)
        return {
            "intent": "investor_participation",
            "title": "Institutional participation supported the July advance",
            "facts": {"groups": rows, "netFlowReconciliationMn": reconciliation},
            "summary": "Local institutions and foreign investors were net buyers in the controlled synthetic dataset.",
            "formula": "Net flow = gross purchase value - gross sale value",
            "sourceRefs": ["gcmc-pulse:Participation"],
        }

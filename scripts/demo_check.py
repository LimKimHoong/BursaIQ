"""One-command pre-show check for sources, APIs, permissions and PDF output."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from server import app, repository


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> None:
    loaded = repository.load(force=True)
    require(not loaded["meta"]["ingestionErrors"], f"Ingestion errors: {loaded['meta']['ingestionErrors']}")
    require(len(loaded["documents"]) >= 5, "Expected at least five controlled sources.")
    client = app.test_client()
    require(client.get("/api/health").status_code == 200, "Health API failed.")
    require(client.post("/api/metrics/query", json={"question": "How did ADV change?", "role": "gcmc"}).status_code == 200, "Metric API failed.")
    require(client.post("/api/search", json={"query": "ADV", "workspace": "learn", "role": "gcmc"}).json["results"], "Learn Bursa retrieval found no result.")
    require(client.post("/api/search", json={"query": "Alya", "workspace": "hr", "role": "gcmc"}).status_code == 403, "HR access boundary failed.")
    report = client.post("/api/report", json={
        "title": "BursaIQ pre-show check",
        "question": "How did ADV change?",
        "requestedBy": "Demo Operator",
        "workspace": "Market Intelligence",
        "verification": "Draft — not verified",
        "answer": {
            "html": "<p>Synthetic 30-day ADV was <strong>RM3.42bn</strong>, up 11.0% versus the preceding window.</p>",
            "sources": [{"title": "GCMC Market Pulse — July 2026", "filename": "GCMC_Market_Pulse.xlsx", "owner": "GCMC", "detail": "Headline and Participation worksheets"}],
            "method": [["1", "Retrieve", "Read the controlled workbook"], ["2", "Calculate", "Apply the governed ADV formula"]],
            "formula": "(RM3.42bn / RM3.08bn - 1) x 100 = 11.04%",
            "context": {"Period": "Latest 30 trading days", "Data class": "Synthetic demo"},
        },
    })
    require(report.status_code == 201 and report.json["validation"]["passed"], "PDF generation or validation failed.")
    print(f"PASS · {len(loaded['documents'])} sources · governed metrics · access boundary · PDF {report.json['filename']}")


if __name__ == "__main__":
    main()

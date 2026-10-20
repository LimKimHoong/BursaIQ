#!/usr/bin/env python3
"""Index controlled Ask Bursa documents into the local SQLite knowledge store."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bursaiq.knowledge_rag import KnowledgeIndex  # noqa: E402
from bursaiq.model_providers import OllamaService  # noqa: E402


def main() -> int:
    service = OllamaService()
    index = KnowledgeIndex(ROOT / "runtime" / "bursaiq_demo.sqlite3", ROOT / "knowledge", service.embed)
    result = index.ingest()
    print(json.dumps(result, indent=2))
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())

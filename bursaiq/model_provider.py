"""Optional, lazy language-model adapter.

The Stage 02 journey does not depend on model inference. Set
BURSAIQ_MODEL_PROVIDER=ollama and BURSAIQ_OLLAMA_MODEL to add a local narrative
layer without changing evidence retrieval or metric calculations.
"""

from __future__ import annotations

import json
import os
from urllib.request import Request, urlopen


class OptionalModelProvider:
    def __init__(self) -> None:
        self.provider = os.getenv("BURSAIQ_MODEL_PROVIDER", "disabled").lower()
        self.model = os.getenv("BURSAIQ_OLLAMA_MODEL", "qwen2.5:1.5b")
        self.endpoint = os.getenv("BURSAIQ_OLLAMA_URL", "http://127.0.0.1:11434/api/generate")

    @property
    def enabled(self) -> bool:
        return self.provider == "ollama"

    def status(self) -> dict[str, str | bool]:
        return {"enabled": self.enabled, "provider": self.provider, "model": self.model if self.enabled else "deterministic-demo-engine"}

    def generate(self, prompt: str, context: str) -> str | None:
        if not self.enabled:
            return None
        system = (
            "You are BursaIQ. Use only the supplied synthetic context. Keep all figures, dates and qualifiers unchanged. "
            "If the context is insufficient, say so. Never describe the output as official Bursa Malaysia information."
        )
        body = json.dumps({"model": self.model, "prompt": f"{system}\n\nCONTEXT\n{context}\n\nQUESTION\n{prompt}", "stream": False, "options": {"temperature": 0}}).encode("utf-8")
        request = Request(self.endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
            return str(payload.get("response", "")).strip() or None
        except Exception:
            return None

"""Optional, lazy language-model adapter.

The Stage 02 journey does not depend on model inference. Set
BURSAIQ_MODEL_PROVIDER=ollama and BURSAIQ_OLLAMA_MODEL to add a local narrative
layer without changing evidence retrieval or metric calculations.
"""

from __future__ import annotations

import json
import os
import re
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
        return {
            "enabled": self.enabled,
            "provider": self.provider,
            "model": self.model if self.enabled else "deterministic-demo-engine",
            "role": "narrative-and-routing" if self.enabled else "deterministic-fallback",
        }

    def _request(self, prompt: str, num_predict: int) -> str | None:
        if not self.enabled:
            return None
        body = json.dumps({
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0, "num_predict": num_predict},
        }).encode("utf-8")
        request = Request(self.endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
            return str(payload.get("response", "")).strip() or None
        except Exception:
            return None

    def route(self, question: str) -> str | None:
        """Ask Ollama for a constrained workspace label; the server still enforces access."""
        response = self._request(
            "You route BursaIQ questions. Return exactly one lowercase label and nothing else: market, learn, or hr.\n"
            "market = market performance, ADV, value, velocity, sectors, investors, regional markets.\n"
            "learn = Bursa concepts, definitions, products, investment instruments, product options, onboarding, conduct, general learning.\n"
            "hr = only explicit employment matters such as hiring procedures, applicants, interviews, recruitment or job-application status.\n\n"
            "Never classify a question as hr merely because it contains the word option, product, available or application in a non-employment sense. "
            "Questions asking what products, instruments or options Bursa offers are learn. "
            "Priority: explicit hiring/applicant questions are hr. Explicit explain/define/what-is questions are learn, even when they mention a market term. "
            "Questions asking for a market measure, change, comparison or performance are market.\n\n"
            f"QUESTION\n{question}\n\nLABEL",
            num_predict=8,
        )
        if not response:
            return None
        match = re.search(r"\b(market|learn|hr)\b", response.lower())
        return match.group(1) if match else None

    def generate(self, prompt: str, context: str, workspace: str, response_style: str = "balanced") -> str | None:
        if not self.enabled:
            return None
        styles = {
            "concise": ("Use one or two short sentences. Prioritise the direct answer.", 120),
            "balanced": ("Use two or three concise sentences, with compact bullets only when they improve clarity.", 220),
            "detailed": ("Use four to six sentences and explain the relevant context without adding unsupported facts.", 360),
        }
        style_instruction, num_predict = styles.get(response_style, styles["balanced"])
        instructions = {
            "market": (
                "The context contains results calculated by deterministic BursaIQ metric tools. Do not recalculate or alter any figure. "
                "Copy metric names exactly from the context. ADV always means Average Daily Value; never expand it differently. "
                "Explain the result in two or three concise management-ready sentences without repeating the same figure."
            ),
            "learn": (
                "Answer as a patient onboarding guide using only the retrieved learning excerpts. Define unfamiliar terms plainly. "
                "Start with a direct answer, use compact bullets when listing categories, and do not repeat the same list. "
                "Keep the answer concise and end with one useful follow-up question."
            ),
            "hr": (
                "Use only the retrieved permitted HR excerpt. Reword it clearly, but never infer a status, person, date or next step that is not present. "
                "Keep the answer concise and professional."
            ),
        }
        system = (
            "You are BursaIQ, an offline competition prototype. Use only the supplied synthetic context. "
            "Keep every figure, name, date and qualifier unchanged. If the context is insufficient, say so. "
            "Never call the output official Bursa Malaysia information. Do not use Markdown headings. "
            + instructions.get(workspace, instructions["learn"])
            + " " + style_instruction
        )
        return self._request(
            f"{system}\n\nAPPROVED CONTEXT\n{context}\n\nQUESTION\n{prompt}\n\nANSWER",
            num_predict=num_predict,
        )

"""Interchangeable language-model providers used for semantic routing."""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


class ModelConfigurationError(RuntimeError):
    """Raised when a selected model provider is not configured safely."""


class ModelRequestError(RuntimeError):
    """Raised when a selected model provider cannot return a usable response."""


@dataclass(slots=True)
class ModelReply:
    text: str
    request_id: str


class OllamaService:
    """Calls an Ollama server configured by the backend, never by browser input."""

    def __init__(self) -> None:
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b").strip()

    def _validated_base_url(self) -> str:
        parsed = urlparse(self.base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.path not in {"", "/"}:
            raise ModelConfigurationError("OLLAMA_BASE_URL must be an HTTP(S) server origin without a path.")
        if not self.model:
            raise ModelConfigurationError("OLLAMA_MODEL must name an installed Ollama model.")
        return self.base_url

    def _request_json(self, path: str, *, payload: dict[str, Any] | None = None, timeout: float = 30) -> dict[str, Any]:
        url = f"{self._validated_base_url()}{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {"Accept": "application/json"}
        if data is not None:
            headers["Content-Type"] = "application/json"
        request = Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
        try:
            with urlopen(request, timeout=timeout) as response:
                body = response.read().decode("utf-8")
        except HTTPError as exc:
            raise ModelRequestError(f"Ollama returned HTTP {exc.code}.") from exc
        except (URLError, TimeoutError) as exc:
            raise ModelRequestError("BursaIQ could not reach the configured Ollama server.") from exc
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError as exc:
            raise ModelRequestError("Ollama returned invalid JSON.") from exc
        if not isinstance(parsed, dict):
            raise ModelRequestError("Ollama returned an unexpected response.")
        return parsed

    def status(self, check_connection: bool = False) -> dict[str, Any]:
        status: dict[str, Any] = {
            "id": "ollama",
            "label": "Local open-source model",
            "provider": "ollama",
            "model": self.model,
            "configured": True,
            "available": None,
            "dataBoundary": "Configured Ollama server",
            "error": None,
        }
        try:
            self._validated_base_url()
        except ModelConfigurationError as exc:
            status.update({"configured": False, "available": False, "error": str(exc)})
            return status
        if check_connection:
            try:
                response = self._request_json("/api/tags", timeout=2)
                installed = {
                    str(item.get("name") or "").split(":latest")[0]
                    for item in response.get("models", [])
                    if isinstance(item, dict)
                }
                status["available"] = self.model in installed or self.model.split(":latest")[0] in installed
                if not status["available"]:
                    status["error"] = f"Model {self.model} is not installed in Ollama."
            except ModelRequestError as exc:
                status.update({"available": False, "error": str(exc)})
        return status

    def ask(self, prompt: str) -> ModelReply:
        response = self._request_json("/api/chat", payload={
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0},
        })
        content = str((response.get("message") or {}).get("content") or "").strip()
        if not content:
            raise ModelRequestError("Ollama returned an empty model response.")
        return ModelReply(text=content, request_id=f"ollama-{uuid.uuid4().hex[:12]}")

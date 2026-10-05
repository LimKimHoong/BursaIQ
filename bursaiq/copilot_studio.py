"""Anonymous Copilot Studio access through the Bot Framework Direct Line API."""

from __future__ import annotations

import json
import os
import threading
import time
import uuid
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


DIRECT_LINE_BASE_URL = "https://directline.botframework.com/v3/directline"


class CopilotConfigurationError(RuntimeError):
    """Raised when the Copilot Studio channel is not configured."""


class CopilotRequestError(RuntimeError):
    """Raised when Direct Line cannot complete a request."""


@dataclass(slots=True)
class CopilotReply:
    text: str
    conversation_id: str
    suggestions: list[str]


@dataclass(slots=True)
class _Conversation:
    token: str
    user_id: str
    expires_at: float
    watermark: str | None = None


class CopilotStudioService:
    """Keeps short-lived Direct Line tokens in memory for prototype conversations."""

    token_endpoint_setting = "COPILOTSTUDIOAGENT__TOKENENDPOINT"

    def __init__(self) -> None:
        self._conversations: dict[str, _Conversation] = {}
        self._lock = threading.RLock()

    @property
    def token_endpoint(self) -> str:
        return os.getenv(self.token_endpoint_setting, "").strip()

    def status(self) -> dict[str, Any]:
        endpoint = self.token_endpoint
        configured = bool(endpoint)
        error = None
        if configured and not endpoint.lower().startswith("https://"):
            configured = False
            error = "The Copilot Studio token endpoint must use HTTPS."

        return {
            "provider": "microsoft-copilot-studio-direct-line",
            "configured": configured,
            "available": configured,
            "authentication": "none",
            "missingSettings": [] if endpoint else [self.token_endpoint_setting],
            "error": error,
        }

    @staticmethod
    def _request_json(
        url: str,
        *,
        method: str = "GET",
        token: str | None = None,
        payload: dict[str, Any] | None = None,
        timeout: float = 30,
    ) -> dict[str, Any]:
        headers = {"Accept": "application/json"}
        data = None
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if payload is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(payload).encode("utf-8")

        request = Request(url, data=data, headers=headers, method=method)
        try:
            with urlopen(request, timeout=timeout) as response:
                body = response.read().decode("utf-8")
        except HTTPError as exc:
            raise CopilotRequestError(
                f"Copilot Studio returned HTTP {exc.code}. Check that the agent is published and its Mobile app channel is enabled."
            ) from exc
        except URLError as exc:
            raise CopilotRequestError(
                "BursaIQ could not reach Copilot Studio. Check the network and token endpoint."
            ) from exc

        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError as exc:
            raise CopilotRequestError("Copilot Studio returned an invalid response.") from exc
        if not isinstance(parsed, dict):
            raise CopilotRequestError("Copilot Studio returned an unexpected response.")
        return parsed

    def _start_conversation(self) -> tuple[str, _Conversation]:
        endpoint = self.token_endpoint
        if not endpoint:
            raise CopilotConfigurationError(
                f"Add {self.token_endpoint_setting} to .env using the Token Endpoint from Copilot Studio > Channels > Mobile app."
            )
        if not endpoint.lower().startswith("https://"):
            raise CopilotConfigurationError("The Copilot Studio token endpoint must use HTTPS.")

        token_response = self._request_json(endpoint)
        token = str(token_response.get("token") or "")
        if not token:
            raise CopilotRequestError("The Copilot Studio token endpoint did not return a Direct Line token.")

        response = self._request_json(
            f"{DIRECT_LINE_BASE_URL}/conversations",
            method="POST",
            token=token,
            payload={},
        )
        conversation_id = str(response.get("conversationId") or "")
        conversation_token = str(response.get("token") or token)
        if not conversation_id:
            raise CopilotRequestError("Direct Line did not create a conversation.")

        expires_in = int(token_response.get("expires_in") or token_response.get("expiresIn") or 1800)
        conversation = _Conversation(
            token=conversation_token,
            user_id=f"bursaiq-{uuid.uuid4().hex}",
            expires_at=time.time() + max(60, expires_in - 60),
        )
        self._conversations[conversation_id] = conversation
        return conversation_id, conversation

    def _get_conversation(self, conversation_id: str | None) -> tuple[str, _Conversation]:
        now = time.time()
        expired = [key for key, value in self._conversations.items() if value.expires_at <= now]
        for key in expired:
            self._conversations.pop(key, None)

        if conversation_id:
            conversation = self._conversations.get(conversation_id)
            if conversation:
                return conversation_id, conversation
        return self._start_conversation()

    def ask(self, message: str, conversation_id: str | None = None) -> CopilotReply:
        clean_message = message.strip()
        if not clean_message:
            raise CopilotRequestError("Enter a question for BursaIQ.")

        with self._lock:
            active_id, conversation = self._get_conversation(conversation_id)
            encoded_id = quote(active_id, safe="")
            activity = {
                "type": "message",
                "from": {"id": conversation.user_id, "name": "BursaIQ user"},
                "text": clean_message,
                "locale": "en-US",
            }
            sent = self._request_json(
                f"{DIRECT_LINE_BASE_URL}/conversations/{encoded_id}/activities",
                method="POST",
                token=conversation.token,
                payload=activity,
            )
            sent_activity_id = str(sent.get("id") or "")

            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                url = f"{DIRECT_LINE_BASE_URL}/conversations/{encoded_id}/activities"
                if conversation.watermark:
                    url += f"?watermark={quote(conversation.watermark, safe='')}"
                response = self._request_json(url, token=conversation.token)
                if response.get("watermark") is not None:
                    conversation.watermark = str(response["watermark"])

                bot_activities = []
                for item in response.get("activities") or []:
                    if not isinstance(item, dict) or item.get("type") != "message":
                        continue
                    sender_id = str((item.get("from") or {}).get("id") or "")
                    if sender_id == conversation.user_id or item.get("id") == sent_activity_id:
                        continue
                    if item.get("text"):
                        bot_activities.append(item)

                if bot_activities:
                    text = "\n\n".join(str(item["text"]) for item in bot_activities)
                    suggestions: list[str] = []
                    for item in bot_activities:
                        actions = ((item.get("suggestedActions") or {}).get("actions") or [])
                        for action in actions:
                            if isinstance(action, dict):
                                label = str(action.get("title") or action.get("value") or "").strip()
                                if label and label not in suggestions:
                                    suggestions.append(label)
                    return CopilotReply(text=text, conversation_id=active_id, suggestions=suggestions)

                time.sleep(0.6)

        raise CopilotRequestError("Copilot Studio did not answer within 30 seconds. Please try again.")

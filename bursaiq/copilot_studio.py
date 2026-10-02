"""Microsoft Copilot Studio gateway for the BursaIQ web application.

Authentication follows Microsoft's ``copilotstudio-client`` sample: a public
Entra application obtains a delegated user token for the Power Platform API.
The browser receives only connection state and conversation identifiers; access
tokens remain in the server process and its local MSAL cache.
"""

from __future__ import annotations

import asyncio
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any


POWER_PLATFORM_SCOPES = ["https://api.powerplatform.com/.default"]


class CopilotConfigurationError(RuntimeError):
    """Raised when the Copilot Studio integration is not ready to use."""


class CopilotAuthenticationError(RuntimeError):
    """Raised when Entra authentication does not return a usable token."""


class CopilotRequestError(RuntimeError):
    """Raised when the hosted agent cannot complete a conversation turn."""


@dataclass(frozen=True)
class CopilotReply:
    answer: str
    conversation_id: str
    suggested_actions: list[str]


class CopilotStudioService:
    """Small synchronous facade around the asynchronous Copilot Studio SDK."""

    required_settings = {
        "environment_id": "COPILOTSTUDIOAGENT__ENVIRONMENTID",
        "agent_identifier": "COPILOTSTUDIOAGENT__SCHEMANAME",
        "tenant_id": "COPILOTSTUDIOAGENT__TENANTID",
        "app_client_id": "COPILOTSTUDIOAGENT__AGENTAPPID",
    }

    def __init__(self, cache_path: Path) -> None:
        self.cache_path = cache_path
        self._lock = threading.RLock()

    def _settings(self) -> dict[str, str]:
        return {name: os.getenv(variable, "").strip() for name, variable in self.required_settings.items()}

    def _missing_settings(self) -> list[str]:
        settings = self._settings()
        return [variable for name, variable in self.required_settings.items() if not settings[name]]

    @staticmethod
    def _dependencies() -> tuple[Any, Any, Any, Any]:
        try:
            from msal import PublicClientApplication, SerializableTokenCache
            from microsoft_agents.activity import ActivityTypes
            from microsoft_agents.copilotstudio.client import ConnectionSettings, CopilotClient
        except ModuleNotFoundError as error:
            raise CopilotConfigurationError(
                "Copilot Studio dependencies are not installed. Run pip install -r requirements.txt."
            ) from error
        return PublicClientApplication, SerializableTokenCache, ActivityTypes, (ConnectionSettings, CopilotClient)

    def _load_cache(self, cache_class: Any) -> Any:
        cache = cache_class()
        if self.cache_path.exists():
            cache.deserialize(self.cache_path.read_text(encoding="utf-8"))
        return cache

    def _save_cache(self, cache: Any) -> None:
        if not cache.has_state_changed:
            return
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache_path.write_text(cache.serialize(), encoding="utf-8")
        try:
            self.cache_path.chmod(0o600)
        except OSError:
            pass

    def _application(self, cache: Any, public_client_class: Any) -> Any:
        settings = self._settings()
        return public_client_class(
            client_id=settings["app_client_id"],
            authority=f"https://login.microsoftonline.com/{settings['tenant_id']}",
            token_cache=cache,
        )

    @staticmethod
    def _token_error(response: dict[str, Any] | None) -> str:
        if not response:
            return "Microsoft Entra ID returned no authentication response."
        return str(response.get("error_description") or response.get("error") or "Microsoft Entra ID did not return an access token.")

    def _acquire_token(self, interactive: bool) -> str:
        missing = self._missing_settings()
        if missing:
            raise CopilotConfigurationError("Missing Copilot Studio settings: " + ", ".join(missing))
        PublicClientApplication, SerializableTokenCache, _activity_types, _clients = self._dependencies()
        with self._lock:
            cache = self._load_cache(SerializableTokenCache)
            application = self._application(cache, PublicClientApplication)
            accounts = application.get_accounts()
            response = application.acquire_token_silent(POWER_PLATFORM_SCOPES, account=accounts[0]) if accounts else None
            if not response and interactive:
                response = application.acquire_token_interactive(scopes=POWER_PLATFORM_SCOPES)
            self._save_cache(cache)
        token = (response or {}).get("access_token")
        if not token:
            if interactive:
                raise CopilotAuthenticationError(self._token_error(response))
            raise CopilotAuthenticationError("Sign in to Microsoft Copilot Studio before asking a question.")
        return str(token)

    def status(self) -> dict[str, Any]:
        missing = self._missing_settings()
        configured = not missing
        authenticated = False
        dependency_error = ""
        if configured:
            try:
                _public_client, SerializableTokenCache, _activity_types, _clients = self._dependencies()
                with self._lock:
                    cache = self._load_cache(SerializableTokenCache)
                    authenticated = next(cache.search("Account"), None) is not None
            except (CopilotConfigurationError, ValueError, OSError) as error:
                dependency_error = str(error)
        return {
            "provider": "microsoft-copilot-studio",
            "configured": configured,
            "authenticated": authenticated,
            "available": configured and authenticated and not dependency_error,
            "missingSettings": missing,
            "error": dependency_error,
        }

    def connect(self) -> dict[str, Any]:
        self._acquire_token(interactive=True)
        return self.status()

    def ask(self, question: str, conversation_id: str | None = None) -> CopilotReply:
        token = self._acquire_token(interactive=False)
        settings = self._settings()
        _public_client, _cache, ActivityTypes, clients = self._dependencies()
        ConnectionSettings, CopilotClient = clients
        connection = ConnectionSettings(
            environment_id=settings["environment_id"],
            agent_identifier=settings["agent_identifier"],
            cloud=None,
            copilot_agent_type=None,
            custom_power_platform_cloud=None,
        )
        client = CopilotClient(connection, token)
        try:
            return asyncio.run(self._ask_async(client, ActivityTypes, question, conversation_id))
        except (CopilotConfigurationError, CopilotAuthenticationError, CopilotRequestError):
            raise
        except Exception as error:
            raise CopilotRequestError(f"The Copilot Studio agent could not complete the request: {error}") from error

    @staticmethod
    async def _ask_async(client: Any, activity_types: Any, question: str, conversation_id: str | None) -> CopilotReply:
        welcome_messages: list[str] = []
        if not conversation_id:
            async for activity in client.start_conversation(True):
                activity_conversation = getattr(getattr(activity, "conversation", None), "id", None)
                if activity_conversation:
                    conversation_id = str(activity_conversation)
                if getattr(activity, "type", None) == activity_types.message and getattr(activity, "text", None):
                    welcome_messages.append(str(activity.text).strip())
        if not conversation_id:
            raise CopilotRequestError("Copilot Studio did not return a conversation identifier.")

        messages: list[str] = []
        suggested_actions: list[str] = []
        async for reply in client.ask_question(question, conversation_id):
            if getattr(reply, "type", None) == activity_types.message:
                text = str(getattr(reply, "text", "") or "").strip()
                if text:
                    messages.append(text)
                suggestions = getattr(reply, "suggested_actions", None)
                for action in getattr(suggestions, "actions", []) or []:
                    title = str(getattr(action, "title", "") or "").strip()
                    if title and title not in suggested_actions:
                        suggested_actions.append(title)
            elif getattr(reply, "type", None) == activity_types.end_of_conversation:
                break

        answer = "\n\n".join(messages or welcome_messages).strip()
        if not answer:
            raise CopilotRequestError("The Copilot Studio agent returned no text response.")
        return CopilotReply(answer=answer, conversation_id=conversation_id, suggested_actions=suggested_actions)

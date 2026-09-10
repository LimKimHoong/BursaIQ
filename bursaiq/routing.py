"""Deterministic routing guardrails for the conversational assistant."""

from __future__ import annotations

import re


HR_INTENT = re.compile(
    r"\b(?:hire|hiring|recruit(?:ment|er|ing)?|applicant|candidate|interview|"
    r"job application|application status|talent acquisition|vacanc(?:y|ies)|"
    r"offer approval|pre-employment|people services|payroll|leave policy|headcount|workforce)\b",
    re.IGNORECASE,
)
PRODUCT_TOPIC = re.compile(
    r"\b(?:product|products|instrument|instruments|asset class|asset classes|option|options)\b",
    re.IGNORECASE,
)
PRODUCT_DISCOVERY = re.compile(
    r"\b(?:what|which|list|available|offer|offered|provide|provided|choose|choice|choices|trade)\b",
    re.IGNORECASE,
)


def is_explicit_hr_question(question: str) -> bool:
    """Return true only when the wording contains an unmistakable people-services intent."""
    return bool(HR_INTENT.search(question))


def is_product_learning_question(question: str) -> bool:
    """Identify product-discovery questions that belong in the learning workspace."""
    return bool(PRODUCT_TOPIC.search(question) and PRODUCT_DISCOVERY.search(question))


def route_question_locally(question: str) -> str:
    """Reliable fallback when Ollama routing is disabled or unavailable."""
    value = question.lower()
    if is_explicit_hr_question(value):
        return "hr"
    if is_product_learning_question(value):
        return "learn"
    if any(term in value for term in ("explain", "define", "meaning", "what is", "what does", "new joiner", "learn", "glossary")):
        return "learn"
    if any(term in value for term in ("market", "fbm", "klci", "adv", "daily value", "sector", "regional", "international", "investor", "fund flow", "market cap", "market value", "velocity")):
        return "market"
    return "learn"


def policy_workspace(question: str) -> str | None:
    """Resolve routes whose security or information architecture must not be probabilistic."""
    if is_explicit_hr_question(question):
        return "hr"
    if is_product_learning_question(question):
        return "learn"
    return None


def choose_workspace(question: str, model_route: str | None) -> tuple[str, str]:
    """Apply deterministic policy guardrails around an optional model route."""
    governed_route = policy_workspace(question)
    if governed_route:
        return governed_route, "policy-router"
    if model_route == "hr":
        return route_question_locally(question), "deterministic-guardrail"
    if model_route in {"market", "learn"}:
        return model_route, "ollama"
    return route_question_locally(question), "deterministic-router"

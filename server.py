"""BursaIQ web backend with Microsoft Copilot Studio conversations.

Run with: ./myenv/bin/python server.py
Open:     http://127.0.0.1:5000
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:  # Keeps non-agent tests runnable before new dependencies are installed.
    def load_dotenv(*_args, **_kwargs):
        return False

from bursaiq.copilot_studio import (
    CopilotAuthenticationError,
    CopilotConfigurationError,
    CopilotRequestError,
    CopilotStudioService,
)
from bursaiq.data_loader import IngestionError, LocalDataRepository, ROLE_WORKSPACES
from bursaiq.metrics import MetricEngine
from bursaiq.reporting import BriefingGenerator
from bursaiq.routing import choose_workspace
from bursaiq.store import VerificationStore


BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "Input"
OUTPUT_DIR = BASE_DIR / "output" / "pdf"
RUNTIME_DIR = BASE_DIR / "runtime"
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__, static_folder=str(BASE_DIR / "static"), static_url_path="/static")
app.config.update(JSON_SORT_KEYS=False, MAX_CONTENT_LENGTH=2 * 1024 * 1024)

repository = LocalDataRepository(INPUT_DIR)
reports = BriefingGenerator(OUTPUT_DIR)
verification = VerificationStore(RUNTIME_DIR / "bursaiq_demo.sqlite3")
copilot = CopilotStudioService(RUNTIME_DIR / ".copilot_token_cache.json")

DEMO_IDENTITIES = {
    "gcmc": "Nadia Karim",
    "hr": "Farah Lee",
    "securities": "Arif Rahman",
    "finance": "Mei Tan",
}
REVIEWER_ASSIGNMENTS = {
    "securities": {"Market Intelligence Lead"},
}


def reviewer_assignments(role: str) -> set[str]:
    """Return the review queues assigned to a simulated identity role."""
    return REVIEWER_ASSIGNMENTS.get(role, set())


def reviewer_can_access(case: dict[str, Any], role: str) -> bool:
    return case.get("reviewer") in reviewer_assignments(role)


def body_json() -> dict[str, Any]:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ValueError("A JSON object is required.")
    return payload


def bounded_text(payload: dict[str, Any], key: str, maximum: int, required: bool = True) -> str:
    value = str(payload.get(key, "")).strip()
    if required and not value:
        raise ValueError(f"{key} is required.")
    if len(value) > maximum:
        raise ValueError(f"{key} must be {maximum} characters or fewer.")
    return value


def review_details(payload: dict[str, Any]) -> dict[str, Any]:
    """Keep a small, inspectable snapshot with each local verification case."""
    provided = payload.get("details")
    answer = payload.get("answer") if isinstance(payload.get("answer"), dict) else {}
    source_value = provided.get("sources", []) if isinstance(provided, dict) else answer.get("sources", [])
    context_value = provided.get("context", {}) if isinstance(provided, dict) else answer.get("context", {})

    def clipped(value: Any, maximum: int) -> str:
        return str(value or "").strip()[:maximum]

    sources = []
    if isinstance(source_value, list):
        for source in source_value[:8]:
            if not isinstance(source, dict):
                continue
            sources.append({
                "title": clipped(source.get("title") or source.get("filename"), 180),
                "filename": clipped(source.get("filename"), 180),
                "owner": clipped(source.get("owner"), 180),
                "detail": clipped(source.get("detail") or source.get("excerpt"), 500),
            })

    context = {}
    if isinstance(context_value, dict):
        context = {clipped(key, 80): clipped(value, 240) for key, value in list(context_value.items())[:12]}

    if isinstance(provided, dict):
        question = provided.get("question")
        answer_title = provided.get("answerTitle")
        answer_text = provided.get("answerText")
        formula = provided.get("formula")
    else:
        question = payload.get("question")
        answer_title = answer.get("title") or payload.get("title")
        answer_text = answer.get("agentNarrative") or answer.get("html")
        formula = answer.get("formula")

    return {
        "question": clipped(question, 1000),
        "answerTitle": clipped(answer_title, 180),
        "answerText": clipped(answer_text, 4000),
        "formula": clipped(formula, 1000),
        "context": context,
        "sources": sources,
    }


@app.after_request
def add_demo_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-BursaIQ-Classification"] = "SYNTHETIC_DEMO_ONLY"
    return response


@app.errorhandler(ValueError)
def bad_request(error):
    return jsonify({"error": str(error)}), 400


@app.errorhandler(IngestionError)
def ingestion_error(error):
    app.logger.exception("Input ingestion failed")
    return jsonify({"error": str(error), "type": "ingestion_error"}), 500


@app.errorhandler(CopilotConfigurationError)
def copilot_configuration_error(error):
    return jsonify({"error": str(error), "type": "copilot_configuration", "agent": copilot.status()}), 503


@app.errorhandler(CopilotAuthenticationError)
def copilot_authentication_error(error):
    return jsonify({"error": str(error), "type": "copilot_authentication", "requiresAuthentication": True, "agent": copilot.status()}), 401


@app.errorhandler(CopilotRequestError)
def copilot_request_error(error):
    app.logger.error("Copilot Studio request failed: %s", error)
    return jsonify({"error": str(error), "type": "copilot_request", "agent": copilot.status()}), 502


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/health")
def health():
    loaded = repository.load()
    return jsonify({
        "status": "ok",
        "version": "3.0.0-copilot-studio",
        "mode": "copilot-studio",
        "classification": "SYNTHETIC_DEMO_ONLY",
        "sources": len(loaded["documents"]),
        "ingestionErrors": loaded["meta"]["ingestionErrors"],
        "agent": copilot.status(),
        "pdf": "reportlab",
        "verification": "sqlite",
    })


@app.get("/api/bootstrap")
def bootstrap():
    role = str(request.args.get("role", "")).lower()
    payload = repository.public_bootstrap()
    payload["verification"] = verification.list_cases(reviewer_assignments(role))
    payload["reviewerAccess"] = bool(reviewer_assignments(role))
    payload["agent"] = copilot.status()
    return jsonify(payload)


@app.get("/api/copilot/status")
def copilot_status():
    return jsonify(copilot.status())


@app.post("/api/copilot/connect")
def copilot_connect():
    """Start Microsoft's interactive delegated sign-in on the local machine."""
    if not request.is_json:
        raise ValueError("A JSON request is required.")
    return jsonify(copilot.connect())


@app.post("/api/refresh")
def refresh_sources():
    refreshed = repository.load(force=True)
    return jsonify({"status": "refreshed", "sourceCount": len(refreshed["documents"]), "errors": refreshed["meta"]["ingestionErrors"]})


@app.post("/api/search")
def search_documents():
    payload = body_json()
    query = bounded_text(payload, "query", 500)
    workspace = bounded_text(payload, "workspace", 30).lower()
    role = bounded_text(payload, "role", 30).lower()
    if workspace not in ROLE_WORKSPACES.get(role, set()):
        return jsonify({"error": "The active demo identity cannot retrieve this workspace.", "results": []}), 403
    results = repository.search(query, workspace, role, int(payload.get("limit", 5)))
    return jsonify({"query": query, "workspace": workspace, "results": [item.as_dict() for item in results]})


@app.get("/api/sources/<document_id>")
def open_source(document_id: str):
    role = str(request.args.get("role", "")).lower()
    try:
        path = repository.source_path(document_id, role)
    except PermissionError:
        return jsonify({"error": "The active demo identity cannot open this source."}), 403
    except KeyError:
        return jsonify({"error": "Source not found."}), 404
    return send_from_directory(path.parent, path.name, as_attachment=path.suffix.lower() != ".pdf")


@app.post("/api/metrics/query")
def metric_query():
    payload = body_json()
    question = bounded_text(payload, "question", 1000)
    role = bounded_text(payload, "role", 30).lower()
    if "market" not in ROLE_WORKSPACES.get(role, set()):
        return jsonify({"error": "The active demo identity cannot access GCMC market metrics."}), 403
    result = MetricEngine(repository.load()["market"]).query(question)
    result["classification"] = "SYNTHETIC_DEMO_ONLY"
    result["calculationMode"] = "deterministic"
    return jsonify(result)


@app.post("/api/chat")
def chat():
    """Enforce BursaIQ workspace policy, then proxy a turn to Copilot Studio."""
    payload = body_json()
    question = bounded_text(payload, "question", 1000)
    requested_workspace = bounded_text(payload, "workspace", 30).lower()
    role = bounded_text(payload, "role", 30).lower()
    conversation_id = bounded_text(payload, "conversationId", 200, required=False) or None
    routed_by = "selected-workspace"

    if requested_workspace == "assistant":
        workspace, routed_by = choose_workspace(question)
    else:
        workspace = requested_workspace

    if workspace == "blocked":
        return jsonify({
            "error": "People-related questions are outside the BursaIQ prototype. Use the approved HR channel.",
            "workspace": "blocked",
            "routedBy": routed_by,
            "agent": copilot.status(),
        }), 403
    if workspace not in {"market", "learn", "reg"}:
        raise ValueError("workspace must be assistant, market, learn or reg.")
    if workspace not in ROLE_WORKSPACES.get(role, set()):
        return jsonify({
            "error": "The active demo identity cannot retrieve this workspace.",
            "workspace": workspace,
            "routedBy": routed_by,
            "agent": copilot.status(),
        }), 403

    reply = copilot.ask(question, conversation_id)
    return jsonify({
        "answer": reply.answer,
        "conversationId": reply.conversation_id,
        "suggestedActions": reply.suggested_actions,
        "workspace": workspace,
        "routedBy": routed_by,
        "narrativeMode": "copilot-studio",
        "agent": copilot.status(),
        "classification": "SYNTHETIC_DEMO_ONLY",
    })


@app.post("/api/report")
def generate_report():
    payload = body_json()
    payload["title"] = bounded_text(payload, "title", 140)
    payload["question"] = bounded_text(payload, "question", 1000, required=False)
    payload["requestedBy"] = bounded_text(payload, "requestedBy", 100)
    payload["workspace"] = bounded_text(payload, "workspace", 80)
    if not isinstance(payload.get("answer"), dict):
        raise ValueError("answer must be an object.")
    result = reports.generate(payload)
    case = None
    if str(payload.get("verification", "")).lower().startswith("pending"):
        case = verification.create_case(payload["title"], payload["workspace"], payload["requestedBy"], result["filename"], review_details(payload))
    return jsonify({
        "filename": result["filename"],
        "downloadUrl": f"/api/reports/{result['filename']}",
        "fingerprint": result["fingerprint"],
        "validation": result["validation"],
        "verification": case,
    }), 201


@app.get("/api/reports/<path:filename>")
def download_report(filename: str):
    safe_name = Path(filename).name
    if safe_name != filename or not safe_name.endswith(".pdf"):
        return jsonify({"error": "Invalid report filename."}), 400
    return send_from_directory(OUTPUT_DIR, safe_name, as_attachment=True, download_name=safe_name, mimetype="application/pdf")


@app.get("/api/verification")
def list_verification():
    role = str(request.args.get("role", "")).lower()
    assignments = reviewer_assignments(role)
    if not assignments:
        return jsonify({"error": "This demo identity is not assigned to a review queue.", "cases": []}), 403
    return jsonify({"cases": verification.list_cases(assignments)})


@app.post("/api/verification")
def create_verification():
    payload = body_json()
    case = verification.create_case(
        bounded_text(payload, "title", 140),
        bounded_text(payload, "workspace", 80),
        bounded_text(payload, "requestedBy", 100),
        bounded_text(payload, "reportFilename", 180, required=False) or None,
        review_details(payload),
    )
    return jsonify(case), 201


@app.patch("/api/verification/<case_id>")
def review_verification(case_id: str):
    payload = body_json()
    try:
        role = bounded_text(payload, "role", 30).lower()
        existing = verification.get_case(case_id)
        if not reviewer_can_access(existing, role):
            return jsonify({"error": "This verification case is not assigned to the active reviewer."}), 403
        case = verification.update_status(case_id, bounded_text(payload, "status", 30), DEMO_IDENTITIES.get(role, "Demo reviewer"))
    except KeyError:
        return jsonify({"error": "Verification case not found."}), 404
    return jsonify(case)


@app.get("/api/verification/<case_id>/history")
def verification_history(case_id: str):
    role = str(request.args.get("role", "")).lower()
    try:
        case = verification.get_case(case_id)
    except KeyError:
        return jsonify({"error": "Verification case not found."}), 404
    if not reviewer_can_access(case, role):
        return jsonify({"error": "This verification case is not assigned to the active reviewer."}), 403
    return jsonify({"caseId": case_id, "events": verification.history(case_id)})


if __name__ == "__main__":
    host = os.getenv("BURSAIQ_HOST", "127.0.0.1")
    port = int(os.getenv("BURSAIQ_PORT", "5000"))
    print(f"BursaIQ Copilot Studio client ready at http://{host}:{port}")
    print("Mode: Microsoft Copilot Studio · synthetic supporting sources")
    app.run(host=host, port=port, debug=False, threaded=True)

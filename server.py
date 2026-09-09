"""BursaIQ Stage 02 local demo server.

Run with: ./myenv/bin/python server.py
Open:     http://127.0.0.1:5000
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory

from bursaiq.data_loader import IngestionError, LocalDataRepository, ROLE_WORKSPACES
from bursaiq.metrics import MetricEngine
from bursaiq.model_provider import OptionalModelProvider
from bursaiq.reporting import BriefingGenerator
from bursaiq.store import VerificationStore


BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "Input"
OUTPUT_DIR = BASE_DIR / "output" / "pdf"
RUNTIME_DIR = BASE_DIR / "runtime"

app = Flask(__name__, static_folder=str(BASE_DIR / "static"), static_url_path="/static")
app.config.update(JSON_SORT_KEYS=False, MAX_CONTENT_LENGTH=2 * 1024 * 1024)

repository = LocalDataRepository(INPUT_DIR)
reports = BriefingGenerator(OUTPUT_DIR)
verification = VerificationStore(RUNTIME_DIR / "bursaiq_demo.sqlite3")
model_provider = OptionalModelProvider()


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


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/health")
def health():
    loaded = repository.load()
    return jsonify({
        "status": "ok",
        "version": "2.0.0-demo",
        "mode": "offline-first",
        "classification": "SYNTHETIC_DEMO_ONLY",
        "sources": len(loaded["documents"]),
        "ingestionErrors": loaded["meta"]["ingestionErrors"],
        "model": model_provider.status(),
        "pdf": "reportlab",
        "verification": "sqlite",
    })


@app.get("/api/bootstrap")
def bootstrap():
    payload = repository.public_bootstrap()
    payload["verification"] = verification.list_cases()
    return jsonify(payload)


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
def chat_compatibility():
    """Compatibility route for the original prototype; keeps model use optional."""
    payload = body_json()
    question = bounded_text(payload, "question", 1000)
    workspace = str(payload.get("workspace", "market")).lower()
    role = str(payload.get("role", "gcmc")).lower()
    if workspace == "market":
        if "market" not in ROLE_WORKSPACES.get(role, set()):
            return jsonify({"error": "Access denied."}), 403
        result = MetricEngine(repository.load()["market"]).query(question)
        optional = model_provider.generate(question, f"{result['summary']}\nFormula: {result['formula']}")
        return jsonify({"answer": optional or result["summary"], "result": result, "model": model_provider.status(), "classification": "SYNTHETIC_DEMO_ONLY"})
    if workspace not in ROLE_WORKSPACES.get(role, set()):
        return jsonify({"error": "Access denied."}), 403
    matches = repository.search(question, workspace, role, 3)
    context = "\n".join(item.excerpt for item in matches)
    optional = model_provider.generate(question, context)
    fallback = matches[0].excerpt if matches else "I could not find that in the approved local demo sources."
    return jsonify({"answer": optional or fallback, "sources": [item.as_dict() for item in matches], "model": model_provider.status(), "classification": "SYNTHETIC_DEMO_ONLY"})


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
        case = verification.create_case(payload["title"], payload["workspace"], payload["requestedBy"], result["filename"])
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
    return jsonify({"cases": verification.list_cases()})


@app.post("/api/verification")
def create_verification():
    payload = body_json()
    case = verification.create_case(
        bounded_text(payload, "title", 140),
        bounded_text(payload, "workspace", 80),
        bounded_text(payload, "requestedBy", 100),
        bounded_text(payload, "reportFilename", 180, required=False) or None,
    )
    return jsonify(case), 201


@app.patch("/api/verification/<case_id>")
def review_verification(case_id: str):
    payload = body_json()
    try:
        case = verification.update_status(case_id, bounded_text(payload, "status", 30), bounded_text(payload, "actor", 100))
    except KeyError:
        return jsonify({"error": "Verification case not found."}), 404
    return jsonify(case)


@app.get("/api/verification/<case_id>/history")
def verification_history(case_id: str):
    try:
        verification.get_case(case_id)
    except KeyError:
        return jsonify({"error": "Verification case not found."}), 404
    return jsonify({"caseId": case_id, "events": verification.history(case_id)})


if __name__ == "__main__":
    host = os.getenv("BURSAIQ_HOST", "127.0.0.1")
    port = int(os.getenv("BURSAIQ_PORT", "5000"))
    print(f"BursaIQ Stage 02 demo ready at http://{host}:{port}")
    print("Mode: offline-first · synthetic sources · optional model")
    app.run(host=host, port=port, debug=False, threaded=True)

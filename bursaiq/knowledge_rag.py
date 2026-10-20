"""Permission-aware local document indexing and retrieval for Ask Bursa."""

from __future__ import annotations

import csv
import hashlib
import html
import json
import math
import re
import sqlite3
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable

from openpyxl import load_workbook
from pypdf import PdfReader


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".pptx", ".csv", ".txt", ".md", ".html", ".htm"}
DEPARTMENTS = {"human_resources", "market_operations", "regulations", "group_technology", "corporate_policies"}
DEFAULT_ROLES = ["gcmc", "hr", "securities", "finance"]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class KnowledgeIndex:
    def __init__(self, database_path: Path, knowledge_root: Path, embed: Callable[[list[str]], list[list[float]]], suggest: Callable[[str, dict[str, Any]], list[dict[str, str]]] | None = None) -> None:
        self.database_path = database_path
        self.knowledge_root = knowledge_root.resolve()
        self.embed = embed
        self.suggest = suggest
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS knowledge_documents (
                    id TEXT PRIMARY KEY, relative_path TEXT UNIQUE NOT NULL, filename TEXT NOT NULL,
                    department TEXT NOT NULL, classification TEXT NOT NULL, allowed_roles_json TEXT NOT NULL,
                    owner TEXT NOT NULL, effective_date TEXT, version TEXT NOT NULL, sha256 TEXT NOT NULL,
                    indexed_at TEXT NOT NULL, expiry_date TEXT, replaces_document_id TEXT
                );
                CREATE TABLE IF NOT EXISTS knowledge_chunks (
                    id TEXT PRIMARY KEY, document_id TEXT NOT NULL, ordinal INTEGER NOT NULL,
                    location TEXT NOT NULL, text_content TEXT NOT NULL, embedding_json TEXT NOT NULL,
                    FOREIGN KEY(document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS knowledge_chunks_document ON knowledge_chunks(document_id, ordinal);
                CREATE TABLE IF NOT EXISTS knowledge_suggestions (
                    id TEXT PRIMARY KEY, document_id TEXT NOT NULL, question TEXT NOT NULL,
                    question_key TEXT NOT NULL, description TEXT NOT NULL, department TEXT NOT NULL,
                    allowed_roles_json TEXT NOT NULL, source_version TEXT NOT NULL, generated_at TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    FOREIGN KEY(document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS knowledge_suggestions_role ON knowledge_suggestions(department, generated_at DESC);
                CREATE TABLE IF NOT EXISTS knowledge_audit (
                    id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, role TEXT NOT NULL, question TEXT NOT NULL,
                    document_ids_json TEXT NOT NULL, outcome TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS knowledge_ingestion_runs (
                    id TEXT PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT NOT NULL,
                    indexed_count INTEGER NOT NULL, unchanged_count INTEGER NOT NULL,
                    removed_count INTEGER NOT NULL, errors_json TEXT NOT NULL
                );
                """
            )
            document_columns = {row["name"] for row in connection.execute("PRAGMA table_info(knowledge_documents)").fetchall()}
            if "expiry_date" not in document_columns:
                connection.execute("ALTER TABLE knowledge_documents ADD COLUMN expiry_date TEXT")
            if "replaces_document_id" not in document_columns:
                connection.execute("ALTER TABLE knowledge_documents ADD COLUMN replaces_document_id TEXT")
            suggestion_columns = {row["name"] for row in connection.execute("PRAGMA table_info(knowledge_suggestions)").fetchall()}
            if "status" not in suggestion_columns:
                connection.execute("ALTER TABLE knowledge_suggestions ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'")

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def ingest(self) -> dict[str, Any]:
        started = utc_now()
        indexed = unchanged = removed = 0
        errors: list[dict[str, str]] = []
        seen: set[str] = set()
        for path in self._source_files():
            relative = path.relative_to(self.knowledge_root).as_posix()
            seen.add(relative)
            try:
                metadata_path = path.with_name(path.name + ".metadata.json")
                digest_input = path.read_bytes() + (metadata_path.read_bytes() if metadata_path.exists() else b"")
                digest = hashlib.sha256(digest_input).hexdigest()
                existing = self._document_by_path(relative)
                if existing and existing["sha256"] == digest and (not self.suggest or self._suggestion_count(existing["id"]) > 0):
                    unchanged += 1
                    continue
                sections = extract_sections(path)
                chunks = chunk_sections(sections)
                if not chunks:
                    raise ValueError("No readable text was extracted.")
                embeddings = self.embed([chunk["text"] for chunk in chunks])
                if len(embeddings) != len(chunks):
                    raise ValueError("Embedding count did not match the extracted chunks.")
                metadata = self._metadata(path)
                suggestions: list[dict[str, str]] = []
                if self.suggest:
                    try:
                        suggestions = validate_suggestions(self.suggest("\n\n".join(chunk["text"] for chunk in chunks)[:12_000], metadata))
                    except Exception as exc:
                        errors.append({"path": relative, "error": f"Question suggestion generation failed: {exc}"})
                self._replace_document(relative, path.name, digest, metadata, chunks, embeddings, suggestions)
                indexed += 1
            except Exception as exc:
                errors.append({"path": relative, "error": str(exc)})
        with self._connect() as connection:
            rows = connection.execute("SELECT relative_path FROM knowledge_documents").fetchall()
            for row in rows:
                if row["relative_path"] not in seen:
                    connection.execute("DELETE FROM knowledge_documents WHERE relative_path = ?", (row["relative_path"],))
                    removed += 1
            run_id = f"ING-{uuid.uuid4().hex[:10].upper()}"
            completed = utc_now()
            connection.execute("INSERT INTO knowledge_ingestion_runs VALUES (?, ?, ?, ?, ?, ?, ?)", (run_id, started, completed, indexed, unchanged, removed, json.dumps(errors)))
        return {"id": run_id, "startedAt": started, "completedAt": completed, "indexed": indexed, "unchanged": unchanged, "removed": removed, "errors": errors}

    def search(self, question: str, role: str, limit: int = 6) -> list[dict[str, Any]]:
        query_embeddings = self.embed([question])
        if not query_embeddings:
            return []
        query = query_embeddings[0]
        with self._connect() as connection:
            rows = connection.execute(
                """SELECT c.*, d.filename, d.department, d.classification, d.allowed_roles_json,
                          d.owner, d.version, d.relative_path, d.expiry_date
                   FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id"""
            ).fetchall()
        ranked = []
        replaced_ids = self._replaced_document_ids()
        for row in rows:
            if role not in json.loads(row["allowed_roles_json"]) or row["document_id"] in replaced_ids or self._is_expired(row["expiry_date"]):
                continue
            score = cosine(query, json.loads(row["embedding_json"]))
            ranked.append({
                "documentId": row["document_id"], "chunkId": row["id"], "title": row["filename"],
                "department": display_department(row["department"]), "classification": row["classification"],
                "owner": row["owner"], "version": row["version"], "location": row["location"],
                "text": row["text_content"], "score": round(score, 6), "relativePath": row["relative_path"],
            })
        ranked.sort(key=lambda item: item["score"], reverse=True)
        return [item for item in ranked if item["score"] >= 0.15][:limit]

    def record_query(self, role: str, question: str, results: list[dict[str, Any]], outcome: str) -> None:
        document_ids = list(dict.fromkeys(item["documentId"] for item in results))
        with self._connect() as connection:
            connection.execute("INSERT INTO knowledge_audit VALUES (?, ?, ?, ?, ?, ?)", (f"ASK-{uuid.uuid4().hex[:10].upper()}", utc_now(), role, question, json.dumps(document_ids), outcome))

    def status(self) -> dict[str, Any]:
        with self._connect() as connection:
            documents = connection.execute("SELECT COUNT(*) FROM knowledge_documents").fetchone()[0]
            chunks = connection.execute("SELECT COUNT(*) FROM knowledge_chunks").fetchone()[0]
            suggestions = connection.execute("SELECT COUNT(*) FROM knowledge_suggestions").fetchone()[0]
            run = connection.execute("SELECT * FROM knowledge_ingestion_runs ORDER BY completed_at DESC LIMIT 1").fetchone()
        return {"documents": documents, "chunks": chunks, "suggestions": suggestions, "supportedExtensions": sorted(SUPPORTED_EXTENSIONS), "departments": sorted(DEPARTMENTS), "lastIngestion": self._run_dict(run) if run else None}

    def administration(self) -> dict[str, Any]:
        with self._connect() as connection:
            rows = connection.execute(
                """SELECT d.*, COUNT(DISTINCT c.id) AS chunk_count, COUNT(DISTINCT s.id) AS suggestion_count
                   FROM knowledge_documents d
                   LEFT JOIN knowledge_chunks c ON c.document_id=d.id
                   LEFT JOIN knowledge_suggestions s ON s.document_id=d.id
                   GROUP BY d.id ORDER BY d.indexed_at DESC"""
            ).fetchall()
            runs = connection.execute("SELECT * FROM knowledge_ingestion_runs ORDER BY completed_at DESC LIMIT 20").fetchall()
            suggestions = connection.execute(
                """SELECT s.*, d.filename FROM knowledge_suggestions s
                   JOIN knowledge_documents d ON d.id=s.document_id ORDER BY s.generated_at DESC, s.rowid DESC"""
            ).fetchall()
        replaced_ids = self._replaced_document_ids()
        documents = []
        for row in rows:
            lifecycle = "REPLACED" if row["id"] in replaced_ids else "EXPIRED" if self._is_expired(row["expiry_date"]) else "ACTIVE"
            documents.append({
                "id": row["id"], "filename": row["filename"], "relativePath": row["relative_path"],
                "department": row["department"], "departmentLabel": display_department(row["department"]),
                "classification": row["classification"], "allowedRoles": json.loads(row["allowed_roles_json"]),
                "owner": row["owner"], "effectiveDate": row["effective_date"], "expiryDate": row["expiry_date"],
                "version": row["version"], "replacesDocumentId": row["replaces_document_id"],
                "indexedAt": row["indexed_at"], "chunks": row["chunk_count"], "suggestions": row["suggestion_count"],
                "lifecycle": lifecycle,
            })
        return {
            **self.status(), "documentsList": documents,
            "ingestionRuns": [self._run_dict(row) for row in runs],
            "suggestionsList": [{
                "id": row["id"], "documentId": row["document_id"], "sourceDocument": row["filename"],
                "question": row["question"], "description": row["description"], "department": display_department(row["department"]),
                "allowedRoles": json.loads(row["allowed_roles_json"]), "sourceVersion": row["source_version"],
                "generatedAt": row["generated_at"], "status": row["status"],
            } for row in suggestions],
            "roles": DEFAULT_ROLES,
        }

    def save_upload(self, filename: str, content: bytes, metadata: dict[str, Any]) -> dict[str, Any]:
        suffix = Path(filename).suffix.lower()
        if suffix not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported document type. Use: {', '.join(sorted(SUPPORTED_EXTENSIONS))}.")
        safe_name = re.sub(r"[^A-Za-z0-9._ -]+", "_", Path(filename).name).strip(" .")
        if not safe_name:
            raise ValueError("Document filename is invalid.")
        department = str(metadata.get("department") or "").strip().lower()
        if department not in DEPARTMENTS:
            raise ValueError("A configured department is required.")
        self._validate_governance(metadata)
        folder = self.knowledge_root / department
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / safe_name
        if path.exists():
            raise ValueError("A document with this filename already exists in the selected department. Remove it first or upload a versioned filename.")
        path.write_bytes(content)
        self._write_metadata(path, metadata)
        return {"filename": safe_name, "relativePath": path.relative_to(self.knowledge_root).as_posix(), "department": department}

    def update_document(self, document_id: str, metadata: dict[str, Any]) -> dict[str, Any]:
        path = self._indexed_path(document_id)
        current = self._metadata(path)
        mapping = {
            "owner": "owner", "document_owner": "owner", "classification": "classification",
            "version": "version", "effectiveDate": "effective_date", "effective_date": "effective_date",
            "expiryDate": "expiry_date", "expiry_date": "expiry_date", "replacesDocumentId": "replaces_document_id",
            "replaces_document_id": "replaces_document_id", "allowedRoles": "allowed_roles", "allowed_roles": "allowed_roles",
        }
        for supplied, normalized in mapping.items():
            if supplied in metadata and metadata[supplied] is not None:
                current[normalized] = metadata[supplied]
        self._validate_governance(current, document_id)
        self._write_metadata(path, current)
        self._force_changed(document_id)
        ingestion = self.ingest()
        document = next(item for item in self.administration()["documentsList"] if item["id"] == document_id)
        return {"document": document, "ingestion": ingestion}

    def reindex_document(self, document_id: str) -> dict[str, Any]:
        self._indexed_path(document_id)
        self._force_changed(document_id)
        return self.ingest()

    def remove_document(self, document_id: str) -> dict[str, Any]:
        path = self._indexed_path(document_id)
        path.unlink()
        metadata_path = path.with_name(path.name + ".metadata.json")
        if metadata_path.exists():
            metadata_path.unlink()
        return self.ingest()

    def update_suggestion(self, suggestion_id: str, status: str, question: str | None = None, description: str | None = None) -> dict[str, Any]:
        normalized = status.upper()
        if normalized not in {"ACTIVE", "HIDDEN"}:
            raise ValueError("Suggestion status must be ACTIVE or HIDDEN.")
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM knowledge_suggestions WHERE id=?", (suggestion_id,)).fetchone()
            if row is None:
                raise KeyError(suggestion_id)
            next_question = (question or row["question"]).strip()
            if len(next_question) < 8 or len(next_question) > 180 or not next_question.endswith("?"):
                raise ValueError("Suggested question must be 8–180 characters and end with a question mark.")
            next_description = (description if description is not None else row["description"]).strip()[:220]
            connection.execute("UPDATE knowledge_suggestions SET question=?, question_key=?, description=?, status=? WHERE id=?", (next_question, normalize_question(next_question), next_description, normalized, suggestion_id))
        return {"id": suggestion_id, "question": next_question, "description": next_description, "status": normalized}

    def list_suggestions(self, role: str, limit: int = 8) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """SELECT s.*, d.filename, d.expiry_date FROM knowledge_suggestions s
                   JOIN knowledge_documents d ON d.id = s.document_id
                   WHERE s.status='ACTIVE' ORDER BY s.generated_at DESC, s.rowid DESC"""
            ).fetchall()
        grouped: dict[str, dict[str, Any]] = {}
        replaced_ids = self._replaced_document_ids()
        for row in rows:
            if role not in json.loads(row["allowed_roles_json"]) or row["document_id"] in replaced_ids or self._is_expired(row["expiry_date"]):
                continue
            item = grouped.get(row["question_key"])
            if item:
                if row["document_id"] not in item["supportingDocumentIds"]:
                    item["supportingDocumentIds"].append(row["document_id"])
                continue
            grouped[row["question_key"]] = {
                "id": row["id"], "question": row["question"], "description": row["description"],
                "department": display_department(row["department"]), "sourceVersion": row["source_version"],
                "supportingDocumentIds": [row["document_id"]], "sourceDocument": row["filename"],
                "generatedAt": row["generated_at"],
            }
        by_department: dict[str, list[dict[str, Any]]] = {}
        for item in grouped.values():
            by_department.setdefault(item["department"], []).append(item)
        balanced: list[dict[str, Any]] = []
        while by_department and len(balanced) < limit:
            for department in list(by_department):
                items = by_department[department]
                if items:
                    balanced.append(items.pop(0))
                if not items:
                    del by_department[department]
                if len(balanced) >= limit:
                    break
        return balanced

    def document_path(self, document_id: str, role: str) -> Path:
        with self._connect() as connection:
            row = connection.execute("SELECT relative_path, allowed_roles_json, expiry_date FROM knowledge_documents WHERE id = ?", (document_id,)).fetchone()
        if row is None or role not in json.loads(row["allowed_roles_json"]) or document_id in self._replaced_document_ids() or self._is_expired(row["expiry_date"]):
            raise KeyError(document_id)
        path = (self.knowledge_root / row["relative_path"]).resolve()
        if self.knowledge_root not in path.parents or not path.is_file():
            raise KeyError(document_id)
        return path

    def _source_files(self) -> list[Path]:
        if not self.knowledge_root.exists():
            return []
        return sorted(path for path in self.knowledge_root.rglob("*") if path.is_file() and not path.name.startswith((".", "_")) and path.suffix.lower() in SUPPORTED_EXTENSIONS)

    def _metadata(self, path: Path) -> dict[str, Any]:
        department = path.relative_to(self.knowledge_root).parts[0] if path.relative_to(self.knowledge_root).parts else "corporate_policies"
        if department not in DEPARTMENTS:
            raise ValueError(f"Document must be inside one of the configured department folders: {', '.join(sorted(DEPARTMENTS))}.")
        metadata_path = path.with_name(path.name + ".metadata.json")
        values: dict[str, Any] = {}
        if metadata_path.exists():
            values = json.loads(metadata_path.read_text(encoding="utf-8"))
            if not isinstance(values, dict):
                raise ValueError("Metadata sidecar must contain a JSON object.")
        roles = values.get("allowed_roles", DEFAULT_ROLES)
        if not isinstance(roles, list) or not roles or not all(isinstance(item, str) and item.strip() for item in roles):
            raise ValueError("allowed_roles must be a non-empty string array.")
        normalized_roles = [item.strip().lower() for item in roles]
        if "employee" in normalized_roles:
            normalized_roles.extend(DEFAULT_ROLES)
        return {"department": department, "classification": str(values.get("classification", "Internal")), "allowed_roles": sorted(set(normalized_roles)), "owner": str(values.get("document_owner", values.get("owner", display_department(department)))), "effective_date": str(values.get("effective_date", values.get("effectiveDate", ""))) or None, "expiry_date": str(values.get("expiry_date", values.get("expiryDate", ""))) or None, "version": str(values.get("version", "1.0")), "replaces_document_id": str(values.get("replaces_document_id", values.get("replacesDocumentId", ""))) or None}

    def _write_metadata(self, path: Path, values: dict[str, Any]) -> None:
        roles = values.get("allowed_roles", values.get("allowedRoles", DEFAULT_ROLES))
        payload = {
            "classification": str(values.get("classification") or "Internal"),
            "allowed_roles": roles,
            "document_owner": str(values.get("document_owner", values.get("owner")) or display_department(path.parent.name)),
            "effective_date": str(values.get("effective_date", values.get("effectiveDate")) or ""),
            "expiry_date": str(values.get("expiry_date", values.get("expiryDate")) or ""),
            "version": str(values.get("version") or "1.0"),
            "replaces_document_id": str(values.get("replaces_document_id", values.get("replacesDocumentId")) or ""),
        }
        if not isinstance(roles, list) or not roles:
            raise ValueError("At least one allowed role is required.")
        path.with_name(path.name + ".metadata.json").write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")

    def _validate_governance(self, values: dict[str, Any], current_id: str | None = None) -> None:
        roles = values.get("allowed_roles", values.get("allowedRoles", DEFAULT_ROLES))
        normalized_roles = {str(role).strip().lower() for role in roles} if isinstance(roles, list) else set()
        if not normalized_roles or not normalized_roles.issubset(set(DEFAULT_ROLES) | {"employee"}):
            raise ValueError("Allowed roles must contain one or more configured BursaIQ roles.")
        effective = str(values.get("effective_date", values.get("effectiveDate", "")) or "")
        expiry = str(values.get("expiry_date", values.get("expiryDate", "")) or "")
        try:
            effective_date = date.fromisoformat(effective) if effective else None
            expiry_date = date.fromisoformat(expiry) if expiry else None
        except ValueError as exc:
            raise ValueError("Effective and expiry dates must use YYYY-MM-DD.") from exc
        if effective_date and expiry_date and expiry_date < effective_date:
            raise ValueError("Expiry date cannot be earlier than the effective date.")
        replacement = str(values.get("replaces_document_id", values.get("replacesDocumentId", "")) or "")
        if replacement:
            if replacement == current_id:
                raise ValueError("A document cannot replace itself.")
            with self._connect() as connection:
                exists = connection.execute("SELECT 1 FROM knowledge_documents WHERE id=?", (replacement,)).fetchone()
            if exists is None:
                raise ValueError("The replaced source does not exist.")

    def _indexed_path(self, document_id: str) -> Path:
        with self._connect() as connection:
            row = connection.execute("SELECT relative_path FROM knowledge_documents WHERE id=?", (document_id,)).fetchone()
        if row is None:
            raise KeyError(document_id)
        path = (self.knowledge_root / row["relative_path"]).resolve()
        if self.knowledge_root not in path.parents or not path.is_file():
            raise KeyError(document_id)
        return path

    def _force_changed(self, document_id: str) -> None:
        with self._connect() as connection:
            connection.execute("UPDATE knowledge_documents SET sha256='' WHERE id=?", (document_id,))

    def _replaced_document_ids(self) -> set[str]:
        with self._connect() as connection:
            rows = connection.execute("SELECT replaces_document_id FROM knowledge_documents WHERE replaces_document_id IS NOT NULL AND replaces_document_id != ''").fetchall()
        return {row[0] for row in rows}

    @staticmethod
    def _is_expired(value: str | None) -> bool:
        if not value:
            return False
        try:
            return date.fromisoformat(value) < datetime.now(timezone.utc).date()
        except ValueError:
            return False

    @staticmethod
    def _run_dict(row: sqlite3.Row) -> dict[str, Any]:
        return {"id": row["id"], "startedAt": row["started_at"], "completedAt": row["completed_at"], "indexed": row["indexed_count"], "unchanged": row["unchanged_count"], "removed": row["removed_count"], "errors": json.loads(row["errors_json"])}

    def _document_by_path(self, relative: str) -> sqlite3.Row | None:
        with self._connect() as connection:
            return connection.execute("SELECT * FROM knowledge_documents WHERE relative_path = ?", (relative,)).fetchone()

    def _suggestion_count(self, document_id: str) -> int:
        with self._connect() as connection:
            return int(connection.execute("SELECT COUNT(*) FROM knowledge_suggestions WHERE document_id = ?", (document_id,)).fetchone()[0])

    def _replace_document(self, relative: str, filename: str, digest: str, metadata: dict[str, Any], chunks: list[dict[str, str]], embeddings: list[list[float]], suggestions: list[dict[str, str]]) -> None:
        existing = self._document_by_path(relative)
        document_id = existing["id"] if existing else f"DOC-{uuid.uuid4().hex[:12].upper()}"
        with self._connect() as connection:
            connection.execute("DELETE FROM knowledge_chunks WHERE document_id = ?", (document_id,))
            connection.execute("DELETE FROM knowledge_suggestions WHERE document_id = ?", (document_id,))
            connection.execute(
                """INSERT INTO knowledge_documents
                   (id, relative_path, filename, department, classification, allowed_roles_json, owner, effective_date, version, sha256, indexed_at, expiry_date, replaces_document_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET filename=excluded.filename, department=excluded.department,
                   classification=excluded.classification, allowed_roles_json=excluded.allowed_roles_json,
                   owner=excluded.owner, effective_date=excluded.effective_date, version=excluded.version,
                   sha256=excluded.sha256, indexed_at=excluded.indexed_at, expiry_date=excluded.expiry_date,
                   replaces_document_id=excluded.replaces_document_id""",
                (document_id, relative, filename, metadata["department"], metadata["classification"], json.dumps(metadata["allowed_roles"]), metadata["owner"], metadata["effective_date"], metadata["version"], digest, utc_now(), metadata["expiry_date"], metadata["replaces_document_id"]),
            )
            for ordinal, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                connection.execute("INSERT INTO knowledge_chunks VALUES (?, ?, ?, ?, ?, ?)", (f"CHK-{uuid.uuid4().hex[:12].upper()}", document_id, ordinal, chunk["location"], chunk["text"], json.dumps(embedding)))
            for suggestion in suggestions:
                question_key = normalize_question(suggestion["question"])
                connection.execute("""INSERT INTO knowledge_suggestions
                    (id, document_id, question, question_key, description, department, allowed_roles_json, source_version, generated_at, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')""", (f"SUG-{uuid.uuid4().hex[:12].upper()}", document_id, suggestion["question"], question_key, suggestion["description"], metadata["department"], json.dumps(metadata["allowed_roles"]), metadata["version"], utc_now()))


def extract_sections(path: Path) -> list[tuple[str, str]]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return [(f"Page {index}", page.extract_text() or "") for index, page in enumerate(PdfReader(str(path)).pages, start=1)]
    if suffix == ".docx":
        try:
            from docx import Document
        except ModuleNotFoundError as exc:
            raise ValueError("Word extraction requires python-docx. Run pip install -r requirements.txt.") from exc
        document = Document(str(path))
        return [("Document", "\n".join(paragraph.text for paragraph in document.paragraphs))]
    if suffix == ".pptx":
        try:
            from pptx import Presentation
        except ModuleNotFoundError as exc:
            raise ValueError("PowerPoint extraction requires python-pptx. Run pip install -r requirements.txt.") from exc
        presentation = Presentation(str(path))
        return [(f"Slide {index}", "\n".join(shape.text for shape in slide.shapes if hasattr(shape, "text"))) for index, slide in enumerate(presentation.slides, start=1)]
    if suffix == ".xlsx":
        workbook = load_workbook(path, read_only=True, data_only=True)
        return [(f"Sheet {sheet.title}", "\n".join(" | ".join(str(value) for value in row if value is not None) for row in sheet.iter_rows(values_only=True))) for sheet in workbook.worksheets]
    if suffix == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as handle:
            return [("CSV", "\n".join(" | ".join(row) for row in csv.reader(handle)))]
    text = path.read_text(encoding="utf-8", errors="replace")
    if suffix in {".html", ".htm"}:
        text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    return [("Document", text)]


def chunk_sections(sections: list[tuple[str, str]], size: int = 1200, overlap: int = 180) -> list[dict[str, str]]:
    chunks = []
    for location, raw in sections:
        text = re.sub(r"\s+", " ", raw).strip()
        start = 0
        while text and start < len(text):
            end = min(len(text), start + size)
            if end < len(text):
                boundary = text.rfind(" ", start + size // 2, end)
                if boundary > start:
                    end = boundary
            value = text[start:end].strip()
            if value:
                chunks.append({"location": location, "text": value})
            if end >= len(text):
                break
            start = max(start + 1, end - overlap)
    return chunks


def cosine(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    denominator = math.sqrt(sum(value * value for value in left)) * math.sqrt(sum(value * value for value in right))
    return sum(a * b for a, b in zip(left, right)) / denominator if denominator else 0.0


def display_department(value: str) -> str:
    return value.replace("_", " ").title().replace("Human Resources", "Human Resources").replace("Group Technology", "Group Technology")


def normalize_question(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def validate_suggestions(values: Any) -> list[dict[str, str]]:
    if not isinstance(values, list):
        raise ValueError("Suggestion generator must return an array.")
    result = []
    seen = set()
    for value in values[:8]:
        if not isinstance(value, dict):
            continue
        question = str(value.get("question") or "").strip()
        description = str(value.get("description") or "").strip()
        key = normalize_question(question)
        if len(question) < 8 or len(question) > 180 or not question.endswith("?") or not key or key in seen:
            continue
        seen.add(key)
        result.append({"question": question, "description": description[:220] or "Suggested from an indexed internal document."})
    return result

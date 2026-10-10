"""Ephemeral, local-only document extraction and evidence retrieval for BursaIQ."""

from __future__ import annotations

import csv
import io
import json
import re
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from openpyxl import load_workbook
from pypdf import PdfReader


SUPPORTED_EXTENSIONS = {".pdf", ".xlsx", ".csv", ".json", ".txt", ".md"}
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_FILES = 6
MAX_TEXT_CHARS = 80_000
TOKEN_PATTERN = re.compile(r"[a-z0-9][a-z0-9-]{1,}", re.IGNORECASE)
STOPWORDS = {
    "about", "and", "are", "can", "could", "document", "documents", "for", "from", "give", "how", "in",
    "is", "me", "of", "please", "show", "summarise", "summarize", "tell", "the", "this", "to", "what",
    "when", "where", "which", "who", "why", "with",
}


class LocalAnalysisError(ValueError):
    """Raised when a browser-supplied document cannot be safely analysed."""


@dataclass(frozen=True)
class LocalDocument:
    id: str
    name: str
    extension: str
    size: int
    text: str
    detail: str

    def metadata(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "format": self.extension.removeprefix(".").upper(),
            "size": self.size,
            "characters": len(self.text),
            "detail": self.detail,
        }


class LocalAnalysisService:
    """Keep uploaded documents in memory and answer with extractive evidence."""

    def __init__(self) -> None:
        self._sessions: dict[str, list[LocalDocument]] = {}
        self._lock = threading.Lock()

    def create_session(self, uploads: Iterable[tuple[str, bytes]], session_id: str | None = None) -> dict[str, Any]:
        provided = list(uploads)
        if not provided:
            raise LocalAnalysisError("Choose at least one document to analyse.")
        if len(provided) > MAX_FILES:
            raise LocalAnalysisError(f"Upload no more than {MAX_FILES} documents at a time.")

        documents = [self._extract(name, data) for name, data in provided]
        safe_session = session_id if session_id and re.fullmatch(r"[a-f0-9]{32}", session_id) else uuid.uuid4().hex
        with self._lock:
            existing = self._sessions.get(safe_session, [])
            combined = [*existing, *documents]
            if len(combined) > MAX_FILES:
                raise LocalAnalysisError(f"A workspace can hold no more than {MAX_FILES} documents.")
            self._sessions[safe_session] = combined
        return {
            "sessionId": safe_session,
            "documents": [item.metadata() for item in combined],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "storage": "memory-only",
        }

    def documents(self, session_id: str) -> list[LocalDocument]:
        with self._lock:
            documents = list(self._sessions.get(session_id, []))
        if not documents:
            raise LocalAnalysisError("This analysis workspace has expired. Upload the documents again.")
        return documents

    def clear(self, session_id: str) -> bool:
        with self._lock:
            return self._sessions.pop(session_id, None) is not None

    def query(self, session_id: str, question: str) -> dict[str, Any]:
        documents = self.documents(session_id)
        tokens = set(TOKEN_PATTERN.findall(question.lower())).difference(STOPWORDS)
        candidates: list[tuple[int, int, LocalDocument, str]] = []
        for document in documents:
            for index, chunk in enumerate(self._chunks(document.text)):
                lowered = chunk.lower()
                score = sum(2 for token in tokens if re.search(rf"\b{re.escape(token)}\b", lowered))
                score += min(sum(character.isdigit() for character in chunk), 4) if re.search(r"trend|change|number|amount|percent|compare|difference", question, re.IGNORECASE) else 0
                candidates.append((score, -index, document, chunk))

        ranked = sorted(candidates, key=lambda item: (item[0], item[1]), reverse=True)
        selected: list[tuple[LocalDocument, str]] = []
        seen: set[tuple[str, str]] = set()
        for score, _index, document, chunk in ranked:
            if tokens and score <= 0:
                continue
            key = (document.id, chunk[:120])
            if key in seen:
                continue
            selected.append((document, chunk))
            seen.add(key)
            if len(selected) == 5:
                break
        if not selected:
            selected = [(document, next(iter(self._chunks(document.text)), "No extractable text was found.")) for document in documents[:3]]

        citations = []
        evidence_lines = []
        for index, (document, chunk) in enumerate(selected, start=1):
            excerpt = self._clip(chunk, 520)
            evidence_lines.append(f"[{index}] {excerpt}")
            citations.append({
                "index": index,
                "documentId": document.id,
                "name": document.name,
                "format": document.extension.removeprefix(".").upper(),
                "excerpt": excerpt,
            })

        if tokens and all(score <= 0 for score, *_rest in ranked):
            answer = (
                "I could not find a direct match for this instruction in the uploaded documents. "
                "The closest available passages are shown below so you can refine the question without relying on unsupported inference.\n\n"
                + "\n\n".join(evidence_lines)
            )
        else:
            answer = (
                f"The uploaded evidence most relevant to “{question}” is summarised below. "
                "This local result is extractive: it surfaces document language and does not invent facts beyond the files.\n\n"
                + "\n\n".join(evidence_lines)
            )
        return {
            "sessionId": session_id,
            "answer": answer,
            "mode": "local-extractive",
            "citations": citations,
            "documentCount": len(documents),
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

    def copilot_context(self, session_id: str, question: str) -> tuple[list[dict[str, Any]], str]:
        local_result = self.query(session_id, question)
        excerpts = "\n\n".join(
            f"[{item['index']}] {item['name']}\n{item['excerpt']}" for item in local_result["citations"]
        )
        return local_result["citations"], excerpts[:12_000]

    def _extract(self, supplied_name: str, data: bytes) -> LocalDocument:
        name = Path(supplied_name or "document").name
        extension = Path(name).suffix.lower()
        if extension not in SUPPORTED_EXTENSIONS:
            supported = ", ".join(sorted(item.removeprefix(".").upper() for item in SUPPORTED_EXTENSIONS))
            raise LocalAnalysisError(f"{name} is not supported. Use {supported}.")
        if not data:
            raise LocalAnalysisError(f"{name} is empty.")
        if len(data) > MAX_FILE_BYTES:
            raise LocalAnalysisError(f"{name} exceeds the 5 MB per-file limit.")

        try:
            if extension == ".pdf":
                text, detail = self._pdf_text(data)
            elif extension == ".xlsx":
                text, detail = self._workbook_text(data)
            elif extension == ".json":
                payload = json.loads(data.decode("utf-8-sig"))
                text = json.dumps(payload, ensure_ascii=False, indent=2)
                detail = "Structured JSON"
            elif extension == ".csv":
                decoded = data.decode("utf-8-sig")
                rows = list(csv.reader(io.StringIO(decoded)))[:2_000]
                text = "\n".join(" | ".join(cell for cell in row[:50]) for row in rows)
                detail = f"{len(rows)} rows read"
            else:
                text = data.decode("utf-8-sig")
                detail = "Plain text"
        except (UnicodeDecodeError, json.JSONDecodeError, OSError, ValueError) as error:
            raise LocalAnalysisError(f"{name} could not be read: {error}") from error

        collapsed = "\n".join(line.strip() for line in text.splitlines() if line.strip())[:MAX_TEXT_CHARS]
        if not collapsed:
            raise LocalAnalysisError(f"{name} does not contain extractable text.")
        return LocalDocument(uuid.uuid4().hex, name, extension, len(data), collapsed, detail)

    @staticmethod
    def _pdf_text(data: bytes) -> tuple[str, str]:
        reader = PdfReader(io.BytesIO(data))
        pages = reader.pages[:40]
        return "\n".join((page.extract_text() or "") for page in pages), f"{len(pages)} page{'s' if len(pages) != 1 else ''} read"

    @staticmethod
    def _workbook_text(data: bytes) -> tuple[str, str]:
        workbook = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        lines: list[str] = []
        for sheet in workbook.worksheets[:20]:
            lines.append(f"Worksheet: {sheet.title}")
            for row_index, row in enumerate(sheet.iter_rows(values_only=True), start=1):
                if row_index > 2_000:
                    break
                lines.append(" | ".join("" if value is None else str(value) for value in row[:50]))
        sheet_count = len(workbook.sheetnames)
        workbook.close()
        return "\n".join(lines), f"{sheet_count} worksheet{'s' if sheet_count != 1 else ''} read"

    @staticmethod
    def _chunks(text: str) -> Iterable[str]:
        paragraphs = [item.strip() for item in re.split(r"\n{2,}|(?<=[.!?])\s+", text) if item.strip()]
        for paragraph in paragraphs:
            if len(paragraph) <= 900:
                yield paragraph
                continue
            for start in range(0, len(paragraph), 760):
                yield paragraph[start : start + 900]

    @staticmethod
    def _clip(value: str, maximum: int) -> str:
        collapsed = " ".join(value.split())
        return collapsed if len(collapsed) <= maximum else collapsed[: maximum - 1].rstrip() + "…"

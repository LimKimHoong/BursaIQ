"""Branded, verifiable PDF briefing generation for BursaIQ."""

from __future__ import annotations

import hashlib
import html
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


NAVY = colors.HexColor("#07171D")
INK = colors.HexColor("#22383E")
MUTED = colors.HexColor("#667D81")
TEAL = colors.HexColor("#159E8B")
PALE_TEAL = colors.HexColor("#E8F5F2")
GOLD = colors.HexColor("#D2A84C")
PALE_GOLD = colors.HexColor("#FBF5E8")
LINE = colors.HexColor("#DCE7E5")


def clean_text(value: Any) -> str:
    text = str(value or "")
    text = re.sub(r"<li[^>]*>", "\n• ", text, flags=re.IGNORECASE)
    text = re.sub(r"</(?:p|div|ul|ol|h\d)>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()


def safe_paragraph(value: Any) -> str:
    return html.escape(clean_text(value)).replace("\n", "<br/>")


class BriefingGenerator:
    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate(self, payload: dict[str, Any]) -> dict[str, Any]:
        title = clean_text(payload.get("title"))[:140] or "BursaIQ Executive Briefing"
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:48] or "briefing"
        filename = f"bursaiq-{slug}-{timestamp}.pdf"
        path = self.output_dir / filename
        fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()
        self._build(path, payload, title, fingerprint)
        validation = self.validate(path, title)
        return {"filename": filename, "path": path, "fingerprint": fingerprint, "validation": validation}

    def _styles(self) -> dict[str, ParagraphStyle]:
        base = getSampleStyleSheet()
        return {
            "eyebrow": ParagraphStyle("eyebrow", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=TEAL, tracking=1.2, spaceAfter=7),
            "title": ParagraphStyle("reportTitle", parent=base["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=NAVY, alignment=TA_LEFT, spaceAfter=10),
            "dek": ParagraphStyle("dek", parent=base["BodyText"], fontName="Helvetica", fontSize=10, leading=15, textColor=MUTED, spaceAfter=15),
            "h1": ParagraphStyle("heading", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=20, textColor=NAVY, spaceBefore=7, spaceAfter=8),
            "h2": ParagraphStyle("subheading", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=INK, spaceBefore=6, spaceAfter=5),
            "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=9.3, leading=14.2, textColor=INK, spaceAfter=8),
            "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Helvetica", fontSize=7.4, leading=10.5, textColor=MUTED, spaceAfter=4),
            "label": ParagraphStyle("label", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=MUTED, tracking=.8, spaceAfter=3),
            "callout": ParagraphStyle("callout", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=9, leading=13.5, textColor=colors.HexColor("#0B665A"), backColor=PALE_TEAL, borderColor=colors.HexColor("#BDE2DB"), borderWidth=.5, borderPadding=10, spaceBefore=4, spaceAfter=12),
            "watermark": ParagraphStyle("watermark", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=GOLD, alignment=TA_CENTER),
        }

    def _build(self, path: Path, payload: dict[str, Any], title: str, fingerprint: str) -> None:
        answer = payload.get("answer") or {}
        styles = self._styles()
        created = datetime.now().strftime("%d %b %Y · %H:%M MYT")
        verification = clean_text(payload.get("verification")) or "Draft — not verified"
        story: list[Any] = [
            Spacer(1, 8 * mm),
            Paragraph("BURSAIQ / EXECUTIVE BRIEFING", styles["eyebrow"]),
            Paragraph(safe_paragraph(title), styles["title"]),
            Paragraph("Evidence-grounded decision support generated from controlled local sources.", styles["dek"]),
        ]

        metadata = [
            [Paragraph("PREPARED FOR", styles["label"]), Paragraph("WORKSPACE", styles["label"]), Paragraph("STATUS", styles["label"])],
            [Paragraph(safe_paragraph(payload.get("requestedBy", "Demo user")), styles["body"]), Paragraph(safe_paragraph(payload.get("workspace", "BursaIQ")), styles["body"]), Paragraph(safe_paragraph(verification), styles["body"])],
            [Paragraph("CREATED", styles["label"]), Paragraph("DATA CUT-OFF", styles["label"]), Paragraph("CLASSIFICATION", styles["label"])],
            [Paragraph(created, styles["body"]), Paragraph("31 Jul 2026", styles["body"]), Paragraph("SYNTHETIC DEMO ONLY", styles["body"])],
        ]
        meta_table = Table(metadata, colWidths=[57 * mm, 57 * mm, 57 * mm])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAF9")),
            ("BOX", (0, 0), (-1, -1), .5, LINE),
            ("INNERGRID", (0, 0), (-1, -1), .5, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.extend([meta_table, Spacer(1, 7 * mm)])

        question = clean_text(payload.get("question"))
        if question:
            story.extend([Paragraph("QUESTION", styles["eyebrow"]), Paragraph(safe_paragraph(question), styles["callout"])])
        story.extend([Paragraph("Management read", styles["h1"]), Paragraph(safe_paragraph(answer.get("html") or answer.get("summary") or "No answer content supplied."), styles["body"])])

        context = answer.get("context") or {}
        if context:
            context_rows = [[Paragraph("QUALIFIER", styles["label"]), Paragraph("VALUE", styles["label"])]]
            context_rows.extend([[Paragraph(safe_paragraph(key), styles["small"]), Paragraph(safe_paragraph(value), styles["small"])] for key, value in context.items()])
            context_table = Table(context_rows, colWidths=[57 * mm, 114 * mm], repeatRows=1)
            context_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), .4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FBFA")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.extend([Spacer(1, 4 * mm), Paragraph("Scope and assumptions", styles["h1"]), context_table])

        method = answer.get("method") or []
        formula = clean_text(answer.get("formula"))
        if method or formula:
            elements = [Paragraph("Calculation and method", styles["h1"])]
            for step in method:
                if isinstance(step, (list, tuple)) and len(step) >= 3:
                    elements.append(Paragraph(f"<b>{html.escape(str(step[0]))}. {html.escape(str(step[1]))}</b> — {html.escape(str(step[2]))}", styles["body"]))
            if formula:
                elements.append(Paragraph(f"<b>Formula</b><br/>{safe_paragraph(formula)}", styles["callout"]))
            story.append(KeepTogether(elements))

        story.append(PageBreak())
        story.extend([Paragraph("Evidence register", styles["h1"]), Paragraph("The following controlled local sources were attached to the answer at generation time.", styles["body"])])
        sources = answer.get("sources") or []
        if sources:
            rows = [[Paragraph("SOURCE", styles["label"]), Paragraph("OWNER / LOCATION", styles["label"])]]
            for source in sources:
                rows.append([
                    Paragraph(f"<b>{safe_paragraph(source.get('title', 'Source'))}</b><br/><font color='#667D81'>{safe_paragraph(source.get('filename', ''))}</font>", styles["small"]),
                    Paragraph(f"{safe_paragraph(source.get('owner', ''))}<br/><font color='#667D81'>{safe_paragraph(source.get('detail') or source.get('excerpt', ''))}</font>", styles["small"]),
                ])
            source_table = Table(rows, colWidths=[66 * mm, 105 * mm], repeatRows=1)
            source_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), .4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FBFA")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(source_table)
        else:
            story.append(Paragraph("No source references were supplied.", styles["body"]))

        story.extend([
            Spacer(1, 8 * mm),
            Paragraph("Verification note", styles["h1"]),
            Paragraph("This document is a competition-demo artifact. A reviewer should confirm the narrative, calculations and cited evidence before any management or external use.", styles["callout"]),
            Paragraph(f"Content fingerprint (SHA-256): {fingerprint}", styles["small"]),
        ])

        document = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=21 * mm, bottomMargin=18 * mm, title=title, author="BursaIQ", subject="Synthetic Stage 02 executive briefing")
        document.build(story, onFirstPage=self._page_frame, onLaterPages=self._page_frame)

    @staticmethod
    def _page_frame(canvas, document) -> None:
        canvas.saveState()
        width, height = A4
        canvas.setFillColor(NAVY)
        canvas.rect(0, height - 13 * mm, width, 13 * mm, fill=1, stroke=0)
        canvas.setFillColor(TEAL)
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(18 * mm, height - 8.7 * mm, "BURSAIQ")
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica", 7)
        canvas.drawRightString(width - 18 * mm, height - 8.7 * mm, "DECISION INTELLIGENCE / STAGE 02")
        canvas.setFillColor(colors.HexColor("#8B9C9F"))
        canvas.setFont("Helvetica", 6.8)
        canvas.drawString(18 * mm, 9 * mm, "SYNTHETIC COMPETITION OUTPUT — NOT AN OFFICIAL BURSA MALAYSIA REPORT")
        canvas.drawRightString(width - 18 * mm, 9 * mm, f"PAGE {document.page}")
        canvas.setStrokeColor(LINE)
        canvas.line(18 * mm, 12.5 * mm, width - 18 * mm, 12.5 * mm)
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#EEF2F1"))
        canvas.setFont("Helvetica-Bold", 35)
        canvas.translate(width / 2, height / 2)
        canvas.rotate(35)
        canvas.drawCentredString(0, 0, "SYNTHETIC DEMO")
        canvas.restoreState()
        canvas.restoreState()

    @staticmethod
    def validate(path: Path, expected_title: str) -> dict[str, Any]:
        if not path.exists() or path.stat().st_size < 2500:
            raise RuntimeError("Generated PDF is missing or unexpectedly small.")
        reader = PdfReader(str(path))
        extracted = "\n".join((page.extract_text() or "") for page in reader.pages)
        checks = {
            "opens": True,
            "pageCount": len(reader.pages),
            "titlePresent": expected_title[:30].lower() in extracted.lower(),
            "syntheticLabelPresent": "synthetic" in extracted.lower(),
            "sourceRegisterPresent": "evidence register" in extracted.lower(),
        }
        checks["passed"] = all(value for key, value in checks.items() if key not in {"pageCount", "passed"}) and checks["pageCount"] >= 2
        if not checks["passed"]:
            raise RuntimeError(f"Generated PDF failed validation: {checks}")
        return checks

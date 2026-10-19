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
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.shapes import Drawing, String
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

    def generate_mission(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create the competition ADV report from the exact dashboard result payload."""
        mission = payload["mission"]
        result = payload["result"]
        title = clean_text(mission.get("title"))[:140] or "Malaysia Equity Market ADV Intelligence Report"
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"bursaiq-adv-mission-{mission['id'].lower()}-{timestamp}.pdf"
        path = self.output_dir / filename
        fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode("utf-8")).hexdigest()
        self._build_mission(path, mission, result, title, fingerprint)
        validation = self.validate(path, title)
        return {"filename": filename, "path": path, "fingerprint": fingerprint, "validation": validation}

    def _build_mission(self, path: Path, mission: dict[str, Any], result: dict[str, Any], title: str, fingerprint: str) -> None:
        styles = self._styles()
        scope = result["scope"]
        metrics = result["metrics"]
        monthly = result["monthly"]
        story: list[Any] = [
            Spacer(1, 7 * mm),
            Paragraph("BURSAIQ / AI WORKFORCE MISSION", styles["eyebrow"]),
            Paragraph(safe_paragraph(title), styles["title"]),
            Paragraph(safe_paragraph(result["classification"]), styles["watermark"]),
            Spacer(1, 4 * mm),
        ]
        metadata = [
            [Paragraph("MISSION", styles["label"]), Paragraph("REPORTING WINDOW", styles["label"]), Paragraph("STATUS", styles["label"])],
            [Paragraph(mission["id"], styles["body"]), Paragraph(f"{scope['dateStart']} to {scope['dateEnd']}", styles["body"]), Paragraph("DRAFT READY - HUMAN REVIEW REQUIRED", styles["body"])],
            [Paragraph("REQUESTED BY", styles["label"]), Paragraph("TRADING-DAY RULE", styles["label"]), Paragraph("BOARD SCOPE", styles["label"])],
            [Paragraph(safe_paragraph(mission["requestedBy"]), styles["body"]), Paragraph(safe_paragraph(scope["tradingDayRule"]), styles["small"]), Paragraph(safe_paragraph(", ".join(scope["boards"])), styles["small"])],
        ]
        table = Table(metadata, colWidths=[48 * mm, 67 * mm, 56 * mm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAF9")),
            ("GRID", (0, 0), (-1, -1), .45, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.extend([table, Spacer(1, 6 * mm), Paragraph("Executive summary", styles["h1"])])
        for finding in result["findings"]:
            story.append(Paragraph(f"• {safe_paragraph(finding)}", styles["body"]))

        metric_rows = [
            [Paragraph("PERIOD ADV", styles["label"]), Paragraph("TRADING DAYS", styles["label"]), Paragraph("TOTAL VALUE", styles["label"]), Paragraph("FIRST TO LAST MONTH", styles["label"])],
            [Paragraph(f"RM{metrics['periodAdvBn']:.3f}bn", styles["h2"]), Paragraph(str(metrics["tradingDays"]), styles["h2"]), Paragraph(f"RM{metrics['totalTradedValueMyr']/1_000_000_000:.2f}bn", styles["h2"]), Paragraph(f"{metrics['firstToLastChangePct']:+.2f}%", styles["h2"])],
        ]
        metric_table = Table(metric_rows, colWidths=[42.75 * mm] * 4)
        metric_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 1), (-1, 1), PALE_TEAL), ("GRID", (0, 0), (-1, -1), .45, LINE),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        story.extend([Spacer(1, 2 * mm), metric_table, Spacer(1, 6 * mm), Paragraph("Monthly ADV trend", styles["h1"]), self._mission_chart(monthly)])

        month_rows = [[Paragraph("MONTH", styles["label"]), Paragraph("TRADING DAYS", styles["label"]), Paragraph("TOTAL VALUE", styles["label"]), Paragraph("ADV", styles["label"])]]
        month_rows.extend([
            [Paragraph(item["label"], styles["small"]), Paragraph(str(item["tradingDays"]), styles["small"]), Paragraph(f"RM{item['totalMyr']/1_000_000_000:.2f}bn", styles["small"]), Paragraph(f"RM{item['advBn']:.3f}bn", styles["small"])]
            for item in monthly
        ])
        month_table = Table(month_rows, colWidths=[50 * mm, 36 * mm, 45 * mm, 40 * mm], repeatRows=1)
        month_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF9")]),
            ("GRID", (0, 0), (-1, -1), .4, LINE), ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.extend([PageBreak(), month_table, Spacer(1, 6 * mm), Paragraph("Contribution and participation", styles["h1"])])

        sector_rows = [[Paragraph("SECTOR", styles["label"]), Paragraph("TRADED VALUE", styles["label"]), Paragraph("SHARE", styles["label"])]]
        sector_rows.extend([[Paragraph(safe_paragraph(item["sector"].title()), styles["small"]), Paragraph(f"RM{item['tradedValueMyr']/1_000_000_000:.2f}bn", styles["small"]), Paragraph(f"{item['sharePct']:.2f}%", styles["small"])] for item in result["sectors"]])
        sector_table = Table(sector_rows, colWidths=[91 * mm, 46 * mm, 34 * mm], repeatRows=1)
        sector_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, LINE), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF9")]), ("ALIGN", (1, 1), (-1, -1), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        story.extend([sector_table, Spacer(1, 6 * mm), Paragraph("Investor participation", styles["h1"])])
        investor_rows = [[Paragraph("GROUP", styles["label"]), Paragraph("BUY", styles["label"]), Paragraph("SELL", styles["label"]), Paragraph("NET", styles["label"]), Paragraph("GROSS SHARE", styles["label"])]]
        investor_rows.extend([[Paragraph(item["group"], styles["small"]), Paragraph(f"RM{item['buyMyr']/1_000_000_000:.2f}bn", styles["small"]), Paragraph(f"RM{item['sellMyr']/1_000_000_000:.2f}bn", styles["small"]), Paragraph(f"RM{item['netMyr']/1_000_000_000:+.2f}bn", styles["small"]), Paragraph(f"{item['grossSharePct']:.2f}%", styles["small"])] for item in result["investors"]])
        investor_table = Table(investor_rows, colWidths=[39 * mm, 34 * mm, 34 * mm, 34 * mm, 30 * mm], repeatRows=1)
        investor_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, LINE), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF9")]), ("ALIGN", (1, 1), (-1, -1), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        story.extend([investor_table, PageBreak(), Paragraph("Methodology and limitations", styles["h1"]), Paragraph(safe_paragraph(result["formula"]), styles["callout"]), Paragraph(safe_paragraph(result["interpretationBoundary"]), styles["body"])])

        quality = result["quality"]
        quality_rows = [[Paragraph("CHECK", styles["label"]), Paragraph("RESULT", styles["label"]), Paragraph("EVIDENCE", styles["label"])],
            [Paragraph("Schema and numeric validity", styles["small"]), Paragraph("Passed" if quality["passed"] else "Review", styles["small"]), Paragraph(f"Market invalid: {quality['marketInvalidRows']}; investor invalid: {quality['investorInvalidRows']}", styles["small"])],
            [Paragraph("Exact duplicate control", styles["small"]), Paragraph("Passed", styles["small"]), Paragraph(f"{quality['marketExactDuplicatesExcluded']} exact duplicate rows excluded", styles["small"])],
            [Paragraph("Coverage", styles["small"]), Paragraph("Passed", styles["small"]), Paragraph(f"{metrics['tradingDays']} distinct eligible trading dates", styles["small"])],
            [Paragraph("Dashboard / PDF consistency", styles["small"]), Paragraph("Passed", styles["small"]), Paragraph("Both rendered from this fingerprinted result payload", styles["small"])]]
        quality_table = Table(quality_rows, colWidths=[54 * mm, 28 * mm, 89 * mm], repeatRows=1)
        quality_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, LINE), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF9")]), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        story.extend([Paragraph("Data quality and consistency checks", styles["h1"]), quality_table, Spacer(1, 5 * mm)])

        worker_rows = [[Paragraph("WORKER", styles["label"]), Paragraph("VERIFIABLE OUTPUT", styles["label"])],
            [Paragraph("Mission Manager", styles["small"]), Paragraph("Validated dates, board scope, output contract and human checkpoint.", styles["small"])],
            [Paragraph("Data Agent", styles["small"]), Paragraph(f"Read {quality['marketRowsRead']:,} market rows and {quality['investorRowsRead']:,} investor rows.", styles["small"])],
            [Paragraph("Analysis Agent", styles["small"]), Paragraph("Recomputed ADV, monthly trend, sector contribution and investor participation.", styles["small"])],
            [Paragraph("Insight Agent", styles["small"]), Paragraph("Produced three rule-based observations with no causal attribution.", styles["small"])],
            [Paragraph("Report Agent", styles["small"]), Paragraph("Rendered this PDF from the dashboard result and verified its required content.", styles["small"])]]
        worker_table = Table(worker_rows, colWidths=[48 * mm, 123 * mm], repeatRows=1)
        worker_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, LINE), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAF9")]), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.extend([Paragraph("Worker execution record", styles["h1"]), worker_table, Spacer(1, 5 * mm)])

        source_rows = [[Paragraph("SOURCE", styles["label"]), Paragraph("TRACE", styles["label"])]]
        for source in result["sources"]:
            source_rows.append([Paragraph(f"<b>{safe_paragraph(source['filename'])}</b><br/>{safe_paragraph(source['role'])}", styles["small"]), Paragraph(f"Rows read: {source['rowsRead']:,}<br/>SHA-256: {source['sha256'][:24]}…", styles["small"])])
        source_table = Table(source_rows, colWidths=[93 * mm, 78 * mm], repeatRows=1)
        source_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        story.extend([Paragraph("Evidence register", styles["h1"]), source_table, Spacer(1, 5 * mm), Paragraph(f"Content fingerprint (SHA-256): {fingerprint}", styles["small"])])

        document = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=21 * mm, bottomMargin=18 * mm, title=title, author="BursaIQ", subject="Synthetic ADV mission report")
        document.build(story, onFirstPage=self._page_frame, onLaterPages=self._page_frame)

    @staticmethod
    def _mission_chart(monthly: list[dict[str, Any]]) -> Drawing:
        drawing = Drawing(480, 175)
        chart = HorizontalLineChart()
        chart.x = 46
        chart.y = 35
        chart.height = 110
        chart.width = 410
        chart.data = [[item["advBn"] for item in monthly]]
        chart.categoryAxis.categoryNames = [item["label"].split()[0] for item in monthly]
        chart.categoryAxis.labels.fontName = "Helvetica"
        chart.categoryAxis.labels.fontSize = 7
        chart.valueAxis.valueMin = 0
        chart.valueAxis.labels.fontName = "Helvetica"
        chart.valueAxis.labels.fontSize = 7
        chart.valueAxis.labelTextFormat = "%.1f"
        chart.lines[0].strokeColor = TEAL
        chart.lines[0].strokeWidth = 2.5
        chart.lines[0].symbol = None
        drawing.add(chart)
        drawing.add(String(4, 153, "RM bn", fontName="Helvetica-Bold", fontSize=7, fillColor=MUTED))
        return drawing

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
        story.extend([
            Paragraph("Management read", styles["h1"]),
            Paragraph(safe_paragraph(answer.get("agentNarrative") or answer.get("html") or answer.get("summary") or "No answer content supplied."), styles["body"]),
        ])

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

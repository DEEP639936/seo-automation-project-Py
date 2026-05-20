"""PDF Service - Report generation using ReportLab."""
import os
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.utils.logger import logger


def issues_badge(severity: str) -> str:
    return {"critical": "Critical", "warning": "Warning", "passed": "Passed"}.get(severity, severity)


def ranking_change(change: int) -> str:
    if change is None:
        return "—"
    if change > 0:
        return f"▲ {change}"
    if change < 0:
        return f"▼ {abs(change)}"
    return "—"


async def generate_pdf(data: Dict[str, Any], report_type: str) -> Dict[str, Any]:
    """Generate a PDF report."""
    try:
        os.makedirs("reports", exist_ok=True)
        file_name = f"report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{report_type}.pdf"
        file_path = os.path.join("reports", file_name)

        doc = SimpleDocTemplate(file_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#2563eb"),
            spaceAfter=20,
        )
        story.append(Paragraph(data.get("title", "SEO Report"), title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Meta info
        meta = f"""<b>Website:</b> {data.get("website_name", "N/A")}<br/>
<b>URL:</b> {data.get("website_url", "N/A")}<br/>
<b>Type:</b> {report_type.upper()}<br/>
<b>Generated:</b> {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC"""
        story.append(Paragraph(meta, styles["Normal"]))
        story.append(Spacer(1, 0.3 * inch))

        # SEO Score section
        if (report_type in ("audit", "full_seo")) and data.get("seo_score") is not None:
            story.append(Paragraph("<b>SEO Health Score</b>", styles["Heading2"]))
            score_data = [
                ["Metric", "Value"],
                ["SEO Score", f"{data['seo_score']} / 100"],
                ["Critical Issues", str(data.get("critical_issues", 0))],
                ["Warnings", str(data.get("warnings", 0))],
                ["Pages Crawled", str(data.get("pages_crawled", 0))],
            ]
            score_table = Table(score_data, colWidths=[3 * inch, 2 * inch])
            score_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f3f4f6")),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]))
            story.append(score_table)
            story.append(Spacer(1, 0.3 * inch))

            # Issues table
            issues = data.get("issues", [])
            if issues:
                story.append(Paragraph("<b>Issues Found</b>", styles["Heading2"]))
                issue_data = [["Page", "Issue", "Severity"]]
                for issue in issues[:30]:
                    issue_data.append([
                        issue.get("page_url", ""),
                        issue.get("message", issue.get("description", "")),
                        issues_badge(issue.get("type", issue.get("severity", "warning"))),
                    ])
                issue_table = Table(issue_data, colWidths=[2.5 * inch, 2.5 * inch, 1.5 * inch])
                issue_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc2626")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ]))
                story.append(issue_table)
                story.append(Spacer(1, 0.3 * inch))

        # Rankings section
        if (report_type in ("ranking", "full_seo")) and data.get("rankings"):
            story.append(Paragraph("<b>Keyword Rankings</b>", styles["Heading2"]))
            rank_data = [["Keyword", "Position", "Change", "Search Volume"]]
            for r in data["rankings"]:
                rank_data.append([
                    r.get("keyword", ""),
                    str(r.get("position", "Not ranked")),
                    ranking_change(r.get("change")),
                    str(r.get("search_volume", "—")),
                ])
            rank_table = Table(rank_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
            rank_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#059669")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]))
            story.append(rank_table)
            story.append(Spacer(1, 0.3 * inch))

        # Backlinks section
        if (report_type in ("backlink", "full_seo")) and data.get("backlinks"):
            story.append(Paragraph(f"<b>Backlinks (Top {min(len(data['backlinks']), 20)})</b>", styles["Heading2"]))
            back_data = [["Source", "Type", "DA", "Status"]]
            for b in data["backlinks"][:20]:
                back_data.append([
                    b.get("source_url", ""),
                    b.get("link_type", ""),
                    str(b.get("domain_authority", "—")),
                    issues_badge("passed" if b.get("status") == "active" else "critical"),
                ])
            back_table = Table(back_data, colWidths=[2.5 * inch, 1.5 * inch, 1 * inch, 1.5 * inch])
            back_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]))
            story.append(back_table)

        doc.build(story)
        file_size = os.path.getsize(file_path)
        logger.info(f"PDF generated: {file_path} ({file_size} bytes)")
        return {"success": True, "filePath": file_path, "fileSize": file_size}
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        return {"success": False, "error": str(e)}

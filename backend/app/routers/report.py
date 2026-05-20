"""Report Router - /api/reports"""
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Report, Website, Audit, Keyword, Backlink, User
from app.schemas.report import ReportCreate, ReportResponse
from app.services.pdf_service import generate_pdf
from app.services.email_service import send_report_email
from app.middleware.auth import get_current_user
from app.utils.logger import logger
import asyncio

router = APIRouter(prefix="/api/reports", tags=["Reports"])


async def generate_report_content(report: Report, website: Website, report_type: str, db: Session):
    """Background report generation."""
    try:
        report_data = {
            "title": report.title,
            "website_name": website.name,
            "website_url": website.url,
            "type": report_type,
            "generated_at": datetime.utcnow().isoformat(),
        }

        if report_type in ("audit", "full_seo"):
            latest_audit = db.query(Audit).filter(Audit.website_id == website.id).order_by(Audit.created_at.desc()).first()
            if latest_audit:
                report_data["seo_score"] = latest_audit.seo_score
                report_data["pages_crawled"] = latest_audit.pages_crawled
                report_data["critical_issues"] = latest_audit.critical_issues
                report_data["warnings"] = latest_audit.warnings
                issues = []
                for page in (latest_audit.page_results or []):
                    for issue in (page.get("issues") or []):
                        issues.append({**issue, "page_url": page.get("url", "")})
                report_data["issues"] = issues
                suggestions = []
                for page in (latest_audit.page_results or []):
                    if page.get("ai_suggestions"):
                        suggestions.append({
                            "title": f"Suggestions for {page.get('url')}",
                            "description": str(page["ai_suggestions"]),
                        })
                report_data["ai_suggestions"] = suggestions

        if report_type in ("ranking", "full_seo"):
            keywords = db.query(Keyword).filter(Keyword.website_id == website.id).order_by(Keyword.current_position.asc()).all()
            report_data["keywords_tracked"] = len(keywords)
            report_data["rankings"] = [
                {
                    "keyword": k.keyword,
                    "position": k.current_position,
                    "change": k.position_change,
                    "search_volume": k.search_volume,
                    "url": k.url_ranked,
                }
                for k in keywords
            ]

        if report_type in ("backlink", "full_seo"):
            backlinks = db.query(Backlink).filter(Backlink.website_id == website.id).order_by(Backlink.domain_authority.desc()).limit(50).all()
            report_data["backlinks"] = [
                {
                    "source_url": b.source_url,
                    "target_url": b.target_url,
                    "anchor_text": b.anchor_text,
                    "domain_authority": b.domain_authority,
                    "page_authority": b.page_authority,
                    "link_type": b.link_type.value if b.link_type else "dofollow",
                    "status": b.status.value if b.status else "active",
                }
                for b in backlinks
            ]

        pdf_result = await generate_pdf(report_data, report_type)

        if pdf_result.get("success"):
            report.status = "completed"
            report.file_path = pdf_result.get("filePath")
            report.file_size = pdf_result.get("fileSize")
            report.content = report_data
            db.commit()

            if report.frequency != "once" and website.settings and website.settings.get("email_notifications"):
                user = db.query(User).filter(User.id == report.user_id).first()
                if user:
                    await send_report_email(user.email, report_data, pdf_result.get("filePath"))
                    report.sent_at = datetime.utcnow()
                    db.commit()

            logger.info(f"Report {report.id} generated successfully")
        else:
            raise Exception(pdf_result.get("error", "PDF generation failed"))
    except Exception as e:
        logger.error(f"Report generation failed for {report.id}: {e}")
        report.status = "failed"
        report.content = {"error": str(e)}
        db.commit()


@router.post("/", response_model=dict)
async def generate_report(data: ReportCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Generate new report."""
    website = db.query(Website).filter(Website.id == data.website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    report = Report(
        website_id=data.website_id,
        user_id=user.id,
        type=data.type,
        title=data.title,
        frequency=data.frequency or "once",
        status="generating",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    asyncio.create_task(generate_report_content(report, website, data.type, db))

    return {"status": "success", "message": "Report generation started", "data": {"report": report_to_dict(report)}}


@router.get("/", response_model=dict)
async def get_reports(website_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all reports."""
    query = db.query(Report).filter(Report.user_id == user.id)
    if website_id:
        query = query.filter(Report.website_id == website_id)
    reports = query.order_by(Report.created_at.desc()).all()
    return {"status": "success", "data": {"reports": [report_to_dict(r) for r in reports], "count": len(reports)}}


@router.get("/{report_id}", response_model=dict)
async def get_report(report_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get single report."""
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return {"status": "success", "data": {"report": report_to_dict(report)}}


@router.get("/{report_id}/download")
async def download_report(report_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Download report PDF."""
    from fastapi.responses import FileResponse
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user.id).first()
    if not report or not report.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    report.downloaded_at = datetime.utcnow()
    db.commit()

    filename = f"{report.title.replace(' ', '_')}.pdf"
    return FileResponse(report.file_path, filename=filename, media_type="application/pdf")


@router.delete("/{report_id}", response_model=dict)
async def delete_report(report_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete report."""
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    if report.file_path and os.path.exists(report.file_path):
        os.remove(report.file_path)

    db.delete(report)
    db.commit()
    return {"status": "success", "message": "Report deleted"}


def report_to_dict(report: Report) -> dict:
    return {
        "id": report.id,
        "website_id": report.website_id,
        "user_id": report.user_id,
        "type": report.type.value if report.type else "full_seo",
        "title": report.title,
        "format": report.format.value if report.format else "pdf",
        "status": report.status.value if report.status else "generating",
        "file_path": report.file_path,
        "file_size": report.file_size,
        "content": report.content or {},
        "scheduled": report.scheduled,
        "frequency": report.frequency.value if report.frequency else "once",
        "sent_at": report.sent_at.isoformat() if report.sent_at else None,
        "downloaded_at": report.downloaded_at.isoformat() if report.downloaded_at else None,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
    }

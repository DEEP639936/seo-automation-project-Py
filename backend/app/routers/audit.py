"""Audit Router - /api/audits"""
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Audit, Website, User
from app.schemas.audit import AuditCreate
from app.services.crawler_service import crawl_website
from app.services.claude_service import generate_page_suggestions
from app.middleware.auth import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/api/audits", tags=["Audits"])


async def run_crawl(audit: Audit, url: str, db: Session):
    """Background crawl execution."""
    start_time = datetime.utcnow()
    try:
        logger.info(f"Starting crawl for audit {audit.id}: {url}")
        crawl_data = await crawl_website(url)

        # Generate AI suggestions for pages with issues
        pages_with_suggestions = []
        for page in crawl_data.get("pages", []):
            if page.get("issues") and len(page["issues"]) > 0:
                try:
                    ai_result = await generate_page_suggestions(page)
                    page["ai_suggestions"] = ai_result.get("parsed")
                except Exception as e:
                    logger.error(f"AI suggestion error: {e}")
            pages_with_suggestions.append(page)

        duration = int((datetime.utcnow() - start_time).total_seconds())

        audit.status = "completed"
        audit.pages_crawled = crawl_data.get("pages_crawled", 0)
        audit.total_pages = crawl_data.get("total_pages", 0)
        audit.seo_score = crawl_data.get("seo_score", 0)
        audit.issues_found = crawl_data.get("issues", {}).get("critical", 0) + crawl_data.get("issues", {}).get("warnings", 0)
        audit.critical_issues = crawl_data.get("issues", {}).get("critical", 0)
        audit.warnings = crawl_data.get("issues", {}).get("warnings", 0)
        audit.passed_checks = crawl_data.get("issues", {}).get("passed", 0)
        audit.page_results = pages_with_suggestions
        audit.summary = crawl_data.get("summary", {})
        audit.completed_at = datetime.utcnow()
        audit.duration_seconds = duration
        db.commit()

        # Update website SEO score
        website = db.query(Website).filter(Website.id == audit.website_id).first()
        if website:
            website.seo_score = crawl_data.get("seo_score", 0)
            website.last_crawled_at = datetime.utcnow()
            db.commit()

        logger.info(f"Crawl completed for audit {audit.id} in {duration}s")
    except Exception as e:
        logger.error(f"Crawl failed for audit {audit.id}: {e}")
        audit.status = "failed"
        audit.summary = {"error": str(e)}
        db.commit()


@router.post("/", response_model=dict)
async def start_audit(data: AuditCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Start new SEO audit (crawl)."""
    website = db.query(Website).filter(Website.id == data.website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    audit = Audit(website_id=data.website_id, status="running")
    db.add(audit)
    db.commit()
    db.refresh(audit)

    # Start crawl asynchronously (don't block response)
    asyncio.create_task(run_crawl(audit, website.url, db))

    return {"status": "success", "message": "Audit started", "data": {"audit": audit_to_dict(audit)}}


@router.get("/", response_model=dict)
async def get_audits(website_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all audits for a website."""
    query = db.query(Audit).join(Website).filter(Website.user_id == user.id)
    if website_id:
        query = query.filter(Audit.website_id == website_id)
    audits = query.order_by(Audit.created_at.desc()).all()
    return {"status": "success", "data": {"audits": [audit_to_dict(a) for a in audits], "count": len(audits)}}


@router.get("/{audit_id}", response_model=dict)
async def get_audit(audit_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get single audit details."""
    audit = db.query(Audit).join(Website).filter(Audit.id == audit_id, Website.user_id == user.id).first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")
    return {"status": "success", "data": {"audit": audit_to_dict(audit)}}


@router.post("/{audit_id}/rerun", response_model=dict)
async def rerun_audit(audit_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Re-run audit."""
    existing = db.query(Audit).join(Website).filter(Audit.id == audit_id, Website.user_id == user.id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    new_audit = Audit(website_id=existing.website_id, status="running")
    db.add(new_audit)
    db.commit()
    db.refresh(new_audit)

    website = db.query(Website).filter(Website.id == existing.website_id).first()
    asyncio.create_task(run_crawl(new_audit, website.url, db))

    return {"status": "success", "message": "Audit re-started", "data": {"audit": audit_to_dict(new_audit)}}


def audit_to_dict(audit: Audit) -> dict:
    return {
        "id": audit.id,
        "website_id": audit.website_id,
        "status": audit.status.value if audit.status else "running",
        "pages_crawled": audit.pages_crawled,
        "total_pages": audit.total_pages,
        "seo_score": audit.seo_score,
        "issues_found": audit.issues_found,
        "critical_issues": audit.critical_issues,
        "warnings": audit.warnings,
        "passed_checks": audit.passed_checks,
        "page_results": audit.page_results or [],
        "summary": audit.summary or {},
        "completed_at": audit.completed_at.isoformat() if audit.completed_at else None,
        "duration_seconds": audit.duration_seconds,
        "created_at": audit.created_at.isoformat(),
        "updated_at": audit.updated_at.isoformat(),
    }

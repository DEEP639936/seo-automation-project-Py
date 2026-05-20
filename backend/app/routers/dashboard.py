"""Dashboard Router - /api/dashboard"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Website, Audit, Keyword, Backlink, Report, User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=dict)
async def get_overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get dashboard overview data."""
    user_id = user.id

    # Count stats
    website_count = db.query(Website).filter(Website.user_id == user_id).count()
    audit_count = db.query(Audit).join(Website).filter(Website.user_id == user_id).count()
    keyword_count = db.query(Keyword).join(Website).filter(Website.user_id == user_id).count()
    backlink_count = db.query(Backlink).join(Website).filter(Website.user_id == user_id).count()

    # Average SEO score
    websites = db.query(Website).filter(Website.user_id == user_id).all()
    avg_seo_score = round(sum(w.seo_score or 0 for w in websites) / len(websites)) if websites else 0

    # Recent activity
    recent_audits = db.query(Audit).join(Website).filter(Website.user_id == user_id).order_by(Audit.created_at.desc()).limit(5).all()
    recent_reports = db.query(Report).filter(Report.user_id == user_id).order_by(Report.created_at.desc()).limit(5).all()

    # Keyword ranking distribution
    keywords = db.query(Keyword).join(Website).filter(Website.user_id == user_id).all()
    ranking_distribution = {
        "top3": sum(1 for k in keywords if k.current_position and k.current_position <= 3),
        "top10": sum(1 for k in keywords if k.current_position and 3 < k.current_position <= 10),
        "top50": sum(1 for k in keywords if k.current_position and 10 < k.current_position <= 50),
        "notRanked": sum(1 for k in keywords if not k.current_position or k.current_position > 50),
    }

    # Issues summary across all audits
    latest_audits = db.query(Audit).join(Website).filter(
        Website.user_id == user_id, Audit.status == "completed"
    ).order_by(Audit.created_at.desc()).limit(10).all()

    total_issues = sum(a.issues_found or 0 for a in latest_audits)
    total_critical = sum(a.critical_issues or 0 for a in latest_audits)
    total_warnings = sum(a.warnings or 0 for a in latest_audits)

    return {
        "status": "success",
        "data": {
            "stats": {
                "websites": website_count,
                "audits": audit_count,
                "keywords": keyword_count,
                "backlinks": backlink_count,
                "avg_seo_score": avg_seo_score,
                "total_issues": total_issues,
                "critical_issues": total_critical,
                "warnings": total_warnings,
            },
            "websites": [
                {
                    "id": w.id,
                    "name": w.name,
                    "url": w.url,
                    "seo_score": w.seo_score,
                    "last_crawled_at": w.last_crawled_at.isoformat() if w.last_crawled_at else None,
                    "status": w.status.value if w.status else "active",
                }
                for w in websites
            ],
            "recent_audits": [
                {
                    "id": a.id,
                    "website_id": a.website_id,
                    "status": a.status.value if a.status else "running",
                    "seo_score": a.seo_score,
                    "created_at": a.created_at.isoformat(),
                    "website": {"name": a.website.name} if a.website else None,
                }
                for a in recent_audits
            ],
            "recent_reports": [
                {
                    "id": r.id,
                    "title": r.title,
                    "type": r.type.value if r.type else "full_seo",
                    "status": r.status.value if r.status else "generating",
                    "created_at": r.created_at.isoformat(),
                }
                for r in recent_reports
            ],
            "ranking_distribution": ranking_distribution,
            "keywords_summary": {
                "total": len(keywords),
                "improved": sum(1 for k in keywords if k.position_change and k.position_change > 0),
                "dropped": sum(1 for k in keywords if k.position_change and k.position_change < 0),
                "unchanged": sum(1 for k in keywords if not k.position_change or k.position_change == 0),
            },
        },
    }


@router.get("/score-trend", response_model=dict)
async def get_score_trend(website_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get SEO score trend (last 30 days)."""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    if website_id:
        website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
        if not website:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")
        audits = db.query(Audit).filter(
            Audit.website_id == website_id, Audit.status == "completed", Audit.created_at >= thirty_days_ago
        ).order_by(Audit.created_at.asc()).all()
    else:
        websites = db.query(Website).filter(Website.user_id == user.id).all()
        website_ids = [w.id for w in websites]
        audits = db.query(Audit).filter(
            Audit.website_id.in_(website_ids), Audit.status == "completed", Audit.created_at >= thirty_days_ago
        ).order_by(Audit.created_at.asc()).all()

    trend = [
        {
            "date": a.created_at.strftime("%Y-%m-%d"),
            "score": a.seo_score,
            "website_id": a.website_id,
        }
        for a in audits
    ]

    return {"status": "success", "data": {"trend": trend}}

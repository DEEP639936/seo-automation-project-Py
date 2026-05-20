"""Website Router - /api/websites"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Website, Audit, Keyword, Backlink, User
from app.schemas.website import WebsiteCreate, WebsiteUpdate, WebsiteResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/websites", tags=["Websites"])


@router.post("/", response_model=dict)
async def create_website(data: WebsiteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create new website project."""
    website = Website(
        user_id=user.id,
        name=data.name,
        url=str(data.url),
        target_keywords=data.target_keywords or [],
        description=data.description,
        status=data.status or "active",
        settings=data.settings,
    )
    db.add(website)
    db.commit()
    db.refresh(website)
    return {"status": "success", "message": "Website added successfully", "data": {"website": website_to_dict(website)}}


@router.get("/", response_model=dict)
async def get_websites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all user websites."""
    websites = db.query(Website).filter(Website.user_id == user.id).order_by(Website.created_at.desc()).all()
    result = []
    for w in websites:
        wd = website_to_dict(w)
        wd["audits"] = [audit_to_dict(a) for a in w.audits[:1]]
        wd["keywords"] = [keyword_to_dict(k) for k in w.keywords[:5]]
        wd["backlinks"] = [backlink_to_dict(b) for b in w.backlinks[:5]]
        result.append(wd)
    return {"status": "success", "data": {"websites": result, "count": len(result)}}


@router.get("/{website_id}", response_model=dict)
async def get_website(website_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get single website with details."""
    website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")
    wd = website_to_dict(website)
    wd["audits"] = [audit_to_dict(a) for a in website.audits[:5]]
    wd["keywords"] = [keyword_to_dict(k) for k in website.keywords]
    wd["backlinks"] = [backlink_to_dict(b) for b in website.backlinks[:10]]
    return {"status": "success", "data": {"website": wd}}


@router.put("/{website_id}", response_model=dict)
async def update_website(website_id: str, data: WebsiteUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Update website."""
    website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    if data.name is not None:
        website.name = data.name
    if data.target_keywords is not None:
        website.target_keywords = data.target_keywords
    if data.description is not None:
        website.description = data.description
    if data.status is not None:
        website.status = data.status
    if data.settings is not None:
        current = website.settings or {}
        current.update(data.settings)
        website.settings = current

    db.commit()
    db.refresh(website)
    return {"status": "success", "message": "Website updated", "data": {"website": website_to_dict(website)}}


@router.delete("/{website_id}", response_model=dict)
async def delete_website(website_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete website."""
    website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")
    db.delete(website)
    db.commit()
    return {"status": "success", "message": "Website deleted"}


def website_to_dict(website: Website) -> dict:
    return {
        "id": website.id,
        "user_id": website.user_id,
        "name": website.name,
        "url": website.url,
        "target_keywords": website.target_keywords or [],
        "description": website.description,
        "status": website.status.value if website.status else "active",
        "last_crawled_at": website.last_crawled_at.isoformat() if website.last_crawled_at else None,
        "seo_score": website.seo_score,
        "settings": website.settings,
        "created_at": website.created_at.isoformat(),
        "updated_at": website.updated_at.isoformat(),
    }


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
        "completed_at": audit.completed_at.isoformat() if audit.completed_at else None,
        "duration_seconds": audit.duration_seconds,
        "created_at": audit.created_at.isoformat(),
    }


def keyword_to_dict(keyword: Keyword) -> dict:
    return {
        "id": keyword.id,
        "website_id": keyword.website_id,
        "keyword": keyword.keyword,
        "search_volume": keyword.search_volume,
        "difficulty": keyword.difficulty,
        "cpc": float(keyword.cpc) if keyword.cpc else None,
        "competition": keyword.competition.value if keyword.competition else None,
        "current_position": keyword.current_position,
        "previous_position": keyword.previous_position,
        "position_change": keyword.position_change,
        "url_ranked": keyword.url_ranked,
        "country": keyword.country,
        "language": keyword.language,
        "is_target": keyword.is_target,
        "last_checked": keyword.last_checked.isoformat(),
        "history": keyword.history or [],
        "created_at": keyword.created_at.isoformat(),
    }


def backlink_to_dict(backlink: Backlink) -> dict:
    return {
        "id": backlink.id,
        "website_id": backlink.website_id,
        "source_url": backlink.source_url,
        "target_url": backlink.target_url,
        "anchor_text": backlink.anchor_text,
        "domain_authority": backlink.domain_authority,
        "page_authority": backlink.page_authority,
        "link_type": backlink.link_type.value if backlink.link_type else "dofollow",
        "status": backlink.status.value if backlink.status else "active",
        "first_seen": backlink.first_seen.isoformat(),
        "last_checked": backlink.last_checked.isoformat(),
        "created_at": backlink.created_at.isoformat(),
    }

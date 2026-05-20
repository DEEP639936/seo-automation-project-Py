"""Backlink Router - /api/backlinks"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Backlink, Website, User
from app.schemas.backlink import BacklinkUpdateRequest, BacklinkStats
from app.services.seo_api_service import get_backlinks
from app.middleware.auth import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/api/backlinks", tags=["Backlinks"])


@router.post("/update", response_model=dict)
async def update_backlinks(data: BacklinkUpdateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Fetch and update backlinks for a website."""
    website = db.query(Website).filter(Website.id == data.website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    from urllib.parse import urlparse
    domain = urlparse(website.url).hostname
    result = await get_backlinks(domain, 50)

    for backlink_data in result.get("data", []):
        existing = db.query(Backlink).filter(
            Backlink.website_id == data.website_id,
            Backlink.source_url == backlink_data["source_url"],
            Backlink.target_url == backlink_data["target_url"],
        ).first()
        if not existing:
            bl = Backlink(
                website_id=data.website_id,
                source_url=backlink_data["source_url"],
                target_url=backlink_data["target_url"],
                anchor_text=backlink_data.get("anchor_text"),
                domain_authority=backlink_data.get("domain_authority"),
                page_authority=backlink_data.get("page_authority"),
                link_type=backlink_data.get("link_type", "dofollow"),
                status=backlink_data.get("status", "active"),
                first_seen=backlink_data.get("first_seen"),
                last_checked=backlink_data.get("last_checked"),
            )
            db.add(bl)

    db.commit()

    backlinks = db.query(Backlink).filter(Backlink.website_id == data.website_id).order_by(Backlink.domain_authority.desc()).all()
    stats = BacklinkStats(
        total=len(backlinks),
        dofollow=sum(1 for b in backlinks if b.link_type and b.link_type.value == "dofollow"),
        nofollow=sum(1 for b in backlinks if b.link_type and b.link_type.value == "nofollow"),
        active=sum(1 for b in backlinks if b.status and b.status.value == "active"),
        lost=sum(1 for b in backlinks if b.status and b.status.value == "lost"),
        avg_da=round(sum(b.domain_authority or 0 for b in backlinks) / len(backlinks)) if backlinks else 0,
    )

    return {
        "status": "success",
        "message": "Backlinks updated",
        "data": {
            "backlinks": [backlink_to_dict(b) for b in backlinks],
            "stats": stats.model_dump(),
            "source": "mock" if result.get("mock") else "semrush",
        },
    }


@router.get("/", response_model=dict)
async def get_backlinks_data(website_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get backlinks for a website."""
    if website_id:
        website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
        if not website:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")
        backlinks = db.query(Backlink).filter(Backlink.website_id == website_id).order_by(Backlink.domain_authority.desc()).all()
    else:
        websites = db.query(Website).filter(Website.user_id == user.id).all()
        website_ids = [w.id for w in websites]
        backlinks = db.query(Backlink).filter(Backlink.website_id.in_(website_ids)).order_by(Backlink.domain_authority.desc()).all()

    stats = BacklinkStats(
        total=len(backlinks),
        dofollow=sum(1 for b in backlinks if b.link_type and b.link_type.value == "dofollow"),
        nofollow=sum(1 for b in backlinks if b.link_type and b.link_type.value == "nofollow"),
        active=sum(1 for b in backlinks if b.status and b.status.value == "active"),
        lost=sum(1 for b in backlinks if b.status and b.status.value == "lost"),
        avg_da=round(sum(b.domain_authority or 0 for b in backlinks) / len(backlinks)) if backlinks else 0,
    )

    return {
        "status": "success",
        "data": {"backlinks": [backlink_to_dict(b) for b in backlinks], "stats": stats.model_dump()},
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
        "updated_at": backlink.updated_at.isoformat(),
    }

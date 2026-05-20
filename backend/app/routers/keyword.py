"""Keyword Router - /api/keywords"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Keyword, Website, User
from app.schemas.keyword import KeywordResearchRequest, KeywordCreate
from app.services.seo_api_service import discover_keywords, get_keyword_metrics
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/keywords", tags=["Keywords"])


@router.post("/research", response_model=dict)
async def research_keywords(data: KeywordResearchRequest):
    """Discover new keywords (research)."""
    result = await discover_keywords(data.seed_keyword, data.country, data.limit)
    return {
        "status": "success",
        "data": {
            "seed_keyword": data.seed_keyword,
            "keywords": result["data"],
            "count": len(result["data"]),
            "source": "mock" if result.get("mock") else "semrush",
        },
    }


@router.post("/", response_model=dict)
async def add_keyword(data: KeywordCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Add keyword to track for a website."""
    website = db.query(Website).filter(Website.id == data.website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    metrics_result = await get_keyword_metrics([data.keyword], data.country)
    metrics = metrics_result["data"][0] if metrics_result.get("data") else {}

    keyword = Keyword(
        website_id=data.website_id,
        keyword=data.keyword,
        search_volume=metrics.get("search_volume"),
        difficulty=metrics.get("difficulty"),
        cpc=metrics.get("cpc"),
        competition=metrics.get("competition_level"),
        country=data.country,
        is_target=data.is_target,
    )
    db.add(keyword)
    db.commit()
    db.refresh(keyword)
    return {"status": "success", "message": "Keyword added", "data": {"keyword": keyword_to_dict(keyword)}}


@router.get("/", response_model=dict)
async def get_keywords(website_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all keywords for a website."""
    if website_id:
        website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
        if not website:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")
        keywords = db.query(Keyword).filter(Keyword.website_id == website_id).order_by(Keyword.created_at.desc()).all()
    else:
        websites = db.query(Website).filter(Website.user_id == user.id).all()
        website_ids = [w.id for w in websites]
        keywords = db.query(Keyword).filter(Keyword.website_id.in_(website_ids)).order_by(Keyword.created_at.desc()).all()

    return {"status": "success", "data": {"keywords": [keyword_to_dict(k) for k in keywords], "count": len(keywords)}}


@router.delete("/{keyword_id}", response_model=dict)
async def delete_keyword(keyword_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete keyword."""
    keyword = db.query(Keyword).join(Website).filter(Keyword.id == keyword_id, Website.user_id == user.id).first()
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
    db.delete(keyword)
    db.commit()
    return {"status": "success", "message": "Keyword removed"}


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
        "updated_at": keyword.updated_at.isoformat(),
    }

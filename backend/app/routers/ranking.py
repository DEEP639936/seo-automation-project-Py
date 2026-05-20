"""Ranking Router - /api/rankings"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Keyword, Website, User
from app.schemas.ranking import RankingUpdateRequest, RankingStats
from app.services.seo_api_service import get_rankings
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/rankings", tags=["Rankings"])


@router.post("/update", response_model=dict)
async def update_rankings(data: RankingUpdateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Update rankings for a website's keywords."""
    website = db.query(Website).filter(Website.id == data.website_id, Website.user_id == user.id).first()
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    keywords = db.query(Keyword).filter(Keyword.website_id == data.website_id).all()
    if not keywords:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No keywords found for this website. Add keywords first.")

    keyword_list = [k.keyword for k in keywords]
    from urllib.parse import urlparse
    domain = urlparse(website.url).hostname

    result = await get_rankings(domain, keyword_list)

    for ranking in result.get("data", []):
        keyword = next((k for k in keywords if k.keyword == ranking["keyword"]), None)
        if keyword:
            history = keyword.history or []
            history.append({"position": ranking["position"], "date": datetime.utcnow().isoformat()})
            if len(history) > 30:
                history.pop(0)

            keyword.current_position = ranking["position"]
            keyword.previous_position = keyword.current_position or ranking.get("previous_position")
            keyword.position_change = (keyword.current_position or 0) - ranking["position"]
            keyword.url_ranked = ranking.get("url", "")
            keyword.last_checked = datetime.utcnow()
            keyword.history = history

    db.commit()

    updated = db.query(Keyword).filter(Keyword.website_id == data.website_id).order_by(Keyword.current_position.asc()).all()
    return {
        "status": "success",
        "message": "Rankings updated",
        "data": {
            "keywords": [keyword_to_dict(k) for k in updated],
            "source": "mock" if result.get("mock") else "semrush",
            "updated_at": datetime.utcnow().isoformat(),
        },
    }


@router.get("/", response_model=dict)
async def get_rankings_data(website_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get ranking data for keywords."""
    if website_id:
        website = db.query(Website).filter(Website.id == website_id, Website.user_id == user.id).first()
        if not website:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")
        keywords = db.query(Keyword).filter(Keyword.website_id == website_id).order_by(Keyword.current_position.asc()).all()
    else:
        websites = db.query(Website).filter(Website.user_id == user.id).all()
        website_ids = [w.id for w in websites]
        keywords = db.query(Keyword).filter(Keyword.website_id.in_(website_ids)).order_by(Keyword.current_position.asc()).all()

    stats = RankingStats(
        total=len(keywords),
        top3=sum(1 for k in keywords if k.current_position and k.current_position <= 3),
        top10=sum(1 for k in keywords if k.current_position and k.current_position <= 10),
        top50=sum(1 for k in keywords if k.current_position and k.current_position <= 50),
        improved=sum(1 for k in keywords if k.position_change and k.position_change > 0),
        dropped=sum(1 for k in keywords if k.position_change and k.position_change < 0),
        unchanged=sum(1 for k in keywords if not k.position_change or k.position_change == 0),
    )

    return {
        "status": "success",
        "data": {
            "keywords": [keyword_to_dict(k) for k in keywords],
            "stats": stats.model_dump(),
            "history": [{"keyword": k.keyword, "history": k.history or []} for k in keywords],
        },
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
        "updated_at": keyword.updated_at.isoformat(),
    }

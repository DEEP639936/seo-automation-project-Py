"""Content Router - /api/content"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Audit, Website, User
from app.schemas.content import OptimizePageRequest, GenerateContentRequest
from app.services.claude_service import generate_page_suggestions, generate_article
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/content", tags=["Content"])


@router.post("/optimize", response_model=dict)
async def optimize_page(data: OptimizePageRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Generate SEO suggestions for a page."""
    audit = db.query(Audit).join(Website).filter(Audit.id == data.audit_id, Website.user_id == user.id).first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    page_data = None
    for page in (audit.page_results or []):
        if page.get("url") == data.page_url:
            page_data = page
            break

    if not page_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found in audit")

    import time
    start_time = time.time()
    result = await generate_page_suggestions(page_data)
    duration = int((time.time() - start_time) * 1000)

    return {
        "status": "success",
        "data": {
            "page_url": data.page_url,
            "original": {
                "title": page_data.get("title"),
                "metaDescription": page_data.get("meta_description"),
                "h1": page_data.get("h1"),
            },
            "suggestions": result.get("parsed") or result.get("content"),
            "generated_in_ms": duration,
            "ai_source": "mock" if result.get("mock") else "claude",
        },
    }


@router.post("/generate", response_model=dict)
async def generate_content(data: GenerateContentRequest):
    """Generate full article/content."""
    import time
    start_time = time.time()
    result = await generate_article(data.topic, data.keywords or [data.topic], data.tone)
    duration = int((time.time() - start_time) * 1000)

    content_text = result.get("content", "")
    word_count = len(content_text.split())

    return {
        "status": "success",
        "data": {
            "topic": data.topic,
            "content": content_text,
            "generated_in_ms": duration,
            "ai_source": "mock" if result.get("mock") else "claude",
            "word_count": word_count,
        },
    }


@router.get("/suggestions/{audit_id}", response_model=dict)
async def get_audit_suggestions(audit_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Get all AI suggestions for an audit."""
    audit = db.query(Audit).join(Website).filter(Audit.id == audit_id, Website.user_id == user.id).first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    suggestions = []
    for page in (audit.page_results or []):
        if page.get("ai_suggestions"):
            suggestions.append({
                "page_url": page.get("url"),
                "suggestions": page["ai_suggestions"],
            })

    return {
        "status": "success",
        "data": {
            "audit_id": audit_id,
            "suggestions": suggestions,
            "total_pages_with_suggestions": len(suggestions),
        },
    }

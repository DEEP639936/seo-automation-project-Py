"""Website Pydantic schemas."""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class WebsiteBase(BaseModel):
    name: str = Field(..., max_length=255)
    url: HttpUrl
    target_keywords: Optional[List[str]] = []
    description: Optional[str] = None
    status: Optional[str] = "active"
    settings: Optional[Dict[str, Any]] = None


class WebsiteCreate(WebsiteBase):
    pass


class WebsiteUpdate(BaseModel):
    name: Optional[str] = None
    target_keywords: Optional[List[str]] = None
    description: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class WebsiteResponse(WebsiteBase):
    id: str
    user_id: str
    seo_score: int
    last_crawled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebsiteDetailResponse(WebsiteResponse):
    audits: List[dict] = []
    keywords: List[dict] = []
    backlinks: List[dict] = []

    class Config:
        from_attributes = True

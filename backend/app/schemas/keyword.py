"""Keyword Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class KeywordResearchRequest(BaseModel):
    seed_keyword: str = Field(..., max_length=255)
    country: Optional[str] = "us"
    limit: Optional[int] = 20


class KeywordCreate(BaseModel):
    website_id: str
    keyword: str = Field(..., max_length=255)
    country: Optional[str] = "us"
    is_target: Optional[bool] = False


class KeywordResponse(BaseModel):
    id: str
    website_id: str
    keyword: str
    search_volume: Optional[int] = None
    difficulty: Optional[int] = None
    cpc: Optional[float] = None
    competition: Optional[str] = None
    current_position: Optional[int] = None
    previous_position: Optional[int] = None
    position_change: Optional[int] = None
    url_ranked: Optional[str] = None
    country: str
    language: str
    is_target: bool
    last_checked: datetime
    history: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

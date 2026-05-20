"""Content Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional, List


class OptimizePageRequest(BaseModel):
    audit_id: str
    page_url: str


class GenerateContentRequest(BaseModel):
    topic: str
    keywords: Optional[List[str]] = []
    tone: Optional[str] = "professional"


class PageSuggestionResponse(BaseModel):
    status: str = "success"
    data: dict

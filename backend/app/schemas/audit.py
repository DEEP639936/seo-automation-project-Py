"""Audit Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AuditCreate(BaseModel):
    website_id: str


class AuditResponse(BaseModel):
    id: str
    website_id: str
    status: str
    pages_crawled: int
    total_pages: int
    seo_score: int
    issues_found: int
    critical_issues: int
    warnings: int
    passed_checks: int
    page_results: List[Dict[str, Any]]
    summary: Dict[str, Any]
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

"""Dashboard Pydantic schemas."""
from pydantic import BaseModel
from typing import List, Dict, Any


class DashboardStats(BaseModel):
    websites: int
    audits: int
    keywords: int
    backlinks: int
    avg_seo_score: int
    total_issues: int
    critical_issues: int
    warnings: int


class DashboardResponse(BaseModel):
    status: str = "success"
    data: Dict[str, Any]

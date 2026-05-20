"""Report Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ReportCreate(BaseModel):
    website_id: str
    type: str = Field(..., pattern="^(audit|ranking|backlink|full_seo|custom)$")
    title: str = Field(..., min_length=1)
    frequency: Optional[str] = "once"


class ReportResponse(BaseModel):
    id: str
    website_id: str
    user_id: str
    type: str
    title: str
    format: str
    status: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    content: Dict[str, Any]
    scheduled: bool
    frequency: str
    sent_at: Optional[datetime] = None
    downloaded_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

"""Backlink Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional


class BacklinkUpdateRequest(BaseModel):
    website_id: str


class BacklinkStats(BaseModel):
    total: int
    dofollow: int
    nofollow: int
    active: int
    lost: int
    avg_da: int

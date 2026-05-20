"""Ranking Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional


class RankingUpdateRequest(BaseModel):
    website_id: str


class RankingStats(BaseModel):
    total: int
    top3: int
    top10: int
    top50: int
    improved: int
    dropped: int
    unchanged: int

"""Keyword model - Keyword Research & Tracking."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Numeric, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class CompetitionLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey("websites.id"), nullable=False, index=True)
    keyword = Column(String(255), nullable=False)
    search_volume = Column(Integer, nullable=True)
    difficulty = Column(Integer, nullable=True)
    cpc = Column(Numeric(10, 2), nullable=True)
    competition = Column(Enum(CompetitionLevel), nullable=True)
    current_position = Column(Integer, nullable=True)
    previous_position = Column(Integer, nullable=True)
    position_change = Column(Integer, nullable=True)
    url_ranked = Column(String(500), nullable=True)
    country = Column(String(10), default="US", nullable=False)
    language = Column(String(10), default="en", nullable=False)
    is_target = Column(Boolean, default=False, nullable=False)
    last_checked = Column(DateTime, default=datetime.utcnow, nullable=False)
    history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    website = relationship("Website", back_populates="keywords")

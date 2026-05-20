"""Website model - User Projects/Websites."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class WebsiteStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    error = "error"


class Website(Base):
    __tablename__ = "websites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    target_keywords = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    status = Column(Enum(WebsiteStatus), default=WebsiteStatus.active, nullable=False)
    last_crawled_at = Column(DateTime, nullable=True)
    seo_score = Column(Integer, default=0, nullable=False)
    settings = Column(JSON, default=lambda: {
        "crawl_frequency": "weekly",
        "report_frequency": "weekly",
        "email_notifications": True
    })
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="websites")
    audits = relationship("Audit", back_populates="website", cascade="all, delete-orphan")
    keywords = relationship("Keyword", back_populates="website", cascade="all, delete-orphan")
    backlinks = relationship("Backlink", back_populates="website", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="website", cascade="all, delete-orphan")

"""Audit model - SEO Crawl Results."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AuditStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"


class Audit(Base):
    __tablename__ = "audits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey("websites.id"), nullable=False, index=True)
    status = Column(Enum(AuditStatus), default=AuditStatus.running, nullable=False)
    pages_crawled = Column(Integer, default=0, nullable=False)
    total_pages = Column(Integer, default=0, nullable=False)
    seo_score = Column(Integer, default=0, nullable=False)
    issues_found = Column(Integer, default=0, nullable=False)
    critical_issues = Column(Integer, default=0, nullable=False)
    warnings = Column(Integer, default=0, nullable=False)
    passed_checks = Column(Integer, default=0, nullable=False)
    page_results = Column(JSON, default=list)
    summary = Column(JSON, default=dict)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    website = relationship("Website", back_populates="audits")

"""Report model - Generated SEO Reports."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ReportType(str, enum.Enum):
    audit = "audit"
    ranking = "ranking"
    backlink = "backlink"
    full_seo = "full_seo"
    custom = "custom"


class ReportFormat(str, enum.Enum):
    pdf = "pdf"
    html = "html"
    json = "json"


class ReportStatus(str, enum.Enum):
    generating = "generating"
    completed = "completed"
    failed = "failed"


class ReportFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    once = "once"


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey("websites.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(ReportType), default=ReportType.full_seo, nullable=False)
    title = Column(String(255), nullable=False)
    format = Column(Enum(ReportFormat), default=ReportFormat.pdf, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.generating, nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    content = Column(JSON, default=dict)
    scheduled = Column(Boolean, default=False, nullable=False)
    frequency = Column(Enum(ReportFrequency), default=ReportFrequency.once, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    downloaded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    website = relationship("Website", back_populates="reports")
    user = relationship("User", back_populates="reports")

"""Backlink model - Backlink Tracking."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class LinkType(str, enum.Enum):
    dofollow = "dofollow"
    nofollow = "nofollow"
    ugc = "ugc"
    sponsored = "sponsored"


class BacklinkStatus(str, enum.Enum):
    active = "active"
    lost = "lost"
    broken = "broken"


class Backlink(Base):
    __tablename__ = "backlinks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey("websites.id"), nullable=False, index=True)
    source_url = Column(String(500), nullable=False)
    target_url = Column(String(500), nullable=False)
    anchor_text = Column(String(255), nullable=True)
    domain_authority = Column(Integer, nullable=True)
    page_authority = Column(Integer, nullable=True)
    link_type = Column(Enum(LinkType), default=LinkType.dofollow, nullable=False)
    status = Column(Enum(BacklinkStatus), default=BacklinkStatus.active, nullable=False)
    first_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_checked = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    website = relationship("Website", back_populates="backlinks")

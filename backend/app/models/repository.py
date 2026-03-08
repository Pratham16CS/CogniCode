"""Repository model with git-hash tracking for cache validation."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RepoStatus(str, enum.Enum):
    PENDING = "pending"
    CLONING = "cloning"
    INDEXING = "indexing"
    READY = "ready"
    ERROR = "error"


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    repo_url = Column(String(500), nullable=False)
    repo_name = Column(String(255), nullable=False)  # e.g. "owner/repo"
    last_commit_hash = Column(String(40), nullable=True)
    clone_path = Column(String(500), nullable=True)
    project_overview = Column(Text, nullable=True)
    tech_stack = Column(Text, nullable=True)  # JSON string
    detected_languages = Column(Text, nullable=True)  # JSON string
    status = Column(String(20), default=RepoStatus.PENDING)
    error_message = Column(Text, nullable=True)
    total_files = Column(Integer, default=0)
    indexed_files = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    files = relationship("FileAnalysis", back_populates="repository", cascade="all, delete-orphan")

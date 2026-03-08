"""File analysis model storing skeleton data, removal logs, and embeddings."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship

from app.database import Base


class FileAnalysis(Base):
    __tablename__ = "file_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)  # Relative path within repo
    language = Column(String(50), nullable=True)
    original_content = Column(Text, nullable=True)
    skeleton_content = Column(Text, nullable=True)
    removal_log = Column(Text, nullable=True)  # JSON: [{item, reason, type}]
    logical_core = Column(Text, nullable=True)  # Explanation of algorithms/logic
    file_context = Column(Text, nullable=True)  # Role within project dependency graph
    confidence_score = Column(Float, default=0.0)  # 0-100 confidence
    embedding = Column(Text, nullable=True)  # JSON array of floats
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    repository = relationship("Repository", back_populates="files")
    notebook = relationship("Notebook", back_populates="file_analysis", uselist=False, cascade="all, delete-orphan")

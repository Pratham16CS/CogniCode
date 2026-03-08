"""Notebook model for persistent learning entries and chat history."""

from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None

from app.database import Base


class Notebook(Base):
    __tablename__ = "notebooks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_analysis_id = Column(Integer, ForeignKey("file_analyses.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chat_history = Column(Text, default="[]")  # JSON array of {role, content, timestamp}
    # Storage for the latest question embedding to enable vector search
    question_embedding = Column(Vector(1536) if Vector else Text, nullable=True)
    user_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    file_analysis = relationship("FileAnalysis", back_populates="notebook")

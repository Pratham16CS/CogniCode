"""Notebook request/response schemas."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    chat_history: List[ChatMessage]


class NotebookResponse(BaseModel):
    id: int
    file_analysis_id: int
    chat_history: str  # JSON string
    user_notes: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotebookUpdateNotes(BaseModel):
    user_notes: str

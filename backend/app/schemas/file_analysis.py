"""File analysis request/response schemas."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FileListItem(BaseModel):
    id: int
    file_path: str
    language: Optional[str] = None
    confidence_score: float = 0.0

    model_config = {"from_attributes": True}


class FileDetailResponse(BaseModel):
    id: int
    file_path: str
    language: Optional[str] = None
    original_content: Optional[str] = None
    skeleton_content: Optional[str] = None
    removal_log: Optional[str] = None  # JSON string
    logical_core: Optional[str] = None
    file_context: Optional[str] = None
    confidence_score: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}


class FileTreeNode(BaseModel):
    name: str
    path: str
    type: str  # "file" or "directory"
    language: Optional[str] = None
    children: Optional[List["FileTreeNode"]] = None
    file_id: Optional[int] = None


# Self-reference resolution
FileTreeNode.model_rebuild()

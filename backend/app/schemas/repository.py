"""Repository request/response schemas."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RepoAnalyzeRequest(BaseModel):
    repo_url: str
    github_pat: Optional[str] = None  # Optional override


class RepoStatusResponse(BaseModel):
    id: int
    repo_url: str
    repo_name: str
    status: str
    project_overview: Optional[str] = None
    tech_stack: Optional[str] = None  # JSON string
    detected_languages: Optional[str] = None  # JSON string
    total_files: int = 0
    indexed_files: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RepoListResponse(BaseModel):
    repositories: List[RepoStatusResponse]

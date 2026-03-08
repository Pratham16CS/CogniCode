"""Repository routes — submit, list, and get status."""

import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.models.user import User
from app.models.repository import Repository
from app.schemas.repository import RepoAnalyzeRequest, RepoStatusResponse, RepoListResponse
from app.api.deps import get_current_user
from app.services import analysis_service

router = APIRouter(prefix="/repos", tags=["repositories"])


async def _run_analysis_background(repo_url: str, user_id: int, github_pat: str | None):
    """Background task runner for repository analysis."""
    async with async_session() as db:
        try:
            await analysis_service.analyze_repository(db, repo_url, user_id, github_pat)
            await db.commit()
        except Exception as e:
            await db.rollback()
            import logging
            logging.getLogger(__name__).error(f"Background analysis failed: {e}")


@router.post("/analyze", response_model=RepoStatusResponse, status_code=status.HTTP_202_ACCEPTED)
async def analyze_repo(
    data: RepoAnalyzeRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a repository for analysis. Returns immediately with pending status."""
    # Quick validation
    if not data.repo_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid repository URL")

    # Create or get repo record
    repo = await analysis_service._get_or_create_repo(db, data.repo_url, user.id)
    await db.commit()

    # Use PAT from request or from user profile
    pat = data.github_pat or user.github_pat

    # Start analysis in background
    background_tasks.add_task(_run_analysis_background, data.repo_url, user.id, pat)

    return RepoStatusResponse.model_validate(repo)


@router.get("/", response_model=RepoListResponse)
async def list_repos(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all repositories for the current user."""
    result = await db.execute(
        select(Repository)
        .where(Repository.user_id == user.id)
        .order_by(Repository.updated_at.desc())
    )
    repos = result.scalars().all()
    return RepoListResponse(
        repositories=[RepoStatusResponse.model_validate(r) for r in repos]
    )


@router.get("/{repo_id}", response_model=RepoStatusResponse)
async def get_repo(
    repo_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get repository status and overview."""
    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == user.id)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return RepoStatusResponse.model_validate(repo)

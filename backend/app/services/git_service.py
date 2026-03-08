"""Git service — cloning repositories and validating commit hashes for cache."""

import os
import shutil
import asyncio
import logging
from typing import Optional, Tuple

from git import Repo, GitCommandError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.repository import Repository

logger = logging.getLogger(__name__)


def _build_clone_url(repo_url: str, token: Optional[str] = None) -> str:
    """Build clone URL, inserting PAT for authentication if provided."""
    if token and "github.com" in repo_url:
        # https://github.com/owner/repo.git → https://<token>@github.com/owner/repo.git
        return repo_url.replace("https://", f"https://{token}@")
    return repo_url


def _normalize_repo_url(url: str) -> str:
    """Normalize repo URL: strip trailing .git and slashes."""
    url = url.strip().rstrip("/")
    if url.endswith(".git"):
        url = url[:-4]
    return url


def extract_repo_name(repo_url: str) -> str:
    """Extract 'owner/repo' from a GitHub URL."""
    url = _normalize_repo_url(repo_url)
    parts = url.rstrip("/").split("/")
    if len(parts) >= 2:
        return f"{parts[-2]}/{parts[-1]}"
    return parts[-1]


async def clone_repo(repo_url: str, token: Optional[str] = None) -> str:
    """
    Clone a repository to local disk. Returns the clone path.
    If already cloned, pulls latest changes.
    """
    repo_url = _normalize_repo_url(repo_url)
    repo_name = extract_repo_name(repo_url)
    safe_name = repo_name.replace("/", "_")
    clone_path = os.path.join(settings.CLONE_DIR, safe_name)

    clone_url = _build_clone_url(repo_url + ".git", token)

    def _do_clone():
        if os.path.exists(clone_path):
            try:
                repo = Repo(clone_path)
                repo.remotes.origin.pull()
                logger.info(f"Pulled latest for {repo_name}")
            except (GitCommandError, Exception) as e:
                logger.warning(f"Pull failed, re-cloning: {e}")
                shutil.rmtree(clone_path, ignore_errors=True)
                Repo.clone_from(clone_url, clone_path, depth=1)
        else:
            os.makedirs(settings.CLONE_DIR, exist_ok=True)
            Repo.clone_from(clone_url, clone_path, depth=1)
            logger.info(f"Cloned {repo_name}")

    await asyncio.to_thread(_do_clone)
    return clone_path


async def get_latest_hash(clone_path: str) -> str:
    """Get the HEAD commit hash of a cloned repo."""
    def _get_hash():
        repo = Repo(clone_path)
        return repo.head.commit.hexsha

    return await asyncio.to_thread(_get_hash)


async def validate_cache(
    db: AsyncSession, repo_url: str, current_hash: str, user_id: int
) -> Tuple[bool, Optional[Repository]]:
    """
    Git-Hash Gatekeeper: Check if we already have analysis for this repo+hash.
    Returns (is_cached, repository_or_none).
    """
    normalized_url = _normalize_repo_url(repo_url)

    result = await db.execute(
        select(Repository).where(
            Repository.repo_url == normalized_url,
            Repository.user_id == user_id,
            Repository.last_commit_hash == current_hash,
            Repository.status == "ready",
        )
    )
    repo = result.scalar_one_or_none()

    if repo:
        logger.info(f"Cache HIT for {normalized_url} @ {current_hash[:8]}")
        return True, repo
    else:
        logger.info(f"Cache MISS for {normalized_url} @ {current_hash[:8]}")
        return False, None

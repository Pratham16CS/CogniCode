"""File routes — list files, get file details with skeleton and notebook data."""

import json
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.models.file_analysis import FileAnalysis
from app.schemas.file_analysis import FileDetailResponse, FileListItem, FileTreeNode
from app.api.deps import get_current_user

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/repo/{repo_id}", response_model=list[FileListItem])
async def list_files(
    repo_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all analyzed files for a repository."""
    # Verify repo ownership
    repo_result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == user.id)
    )
    if not repo_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Repository not found")

    result = await db.execute(
        select(FileAnalysis)
        .where(FileAnalysis.repository_id == repo_id)
        .order_by(FileAnalysis.file_path)
    )
    files = result.scalars().all()
    return [FileListItem.model_validate(f) for f in files]


@router.get("/repo/{repo_id}/tree")
async def get_file_tree(
    repo_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a hierarchical file tree for the repository."""
    # Verify repo ownership
    repo_result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == user.id)
    )
    if not repo_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Repository not found")

    result = await db.execute(
        select(FileAnalysis)
        .where(FileAnalysis.repository_id == repo_id)
        .order_by(FileAnalysis.file_path)
    )
    files = result.scalars().all()

    return _build_file_tree(files)


@router.get("/{file_id}", response_model=FileDetailResponse)
async def get_file_detail(
    file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full file details including original, skeleton, removal log, and explanations."""
    result = await db.execute(
        select(FileAnalysis).where(FileAnalysis.id == file_id)
    )
    file_analysis = result.scalar_one_or_none()

    if not file_analysis:
        raise HTTPException(status_code=404, detail="File not found")

    # Verify ownership through repository
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == file_analysis.repository_id,
            Repository.user_id == user.id,
        )
    )
    if not repo_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="File not found")

    return FileDetailResponse.model_validate(file_analysis)


def _build_file_tree(files: list[FileAnalysis]) -> list[dict]:
    """Build a hierarchical file tree from flat file paths."""
    tree: dict = {}

    for f in files:
        parts = f.file_path.replace("\\", "/").split("/")
        current = tree

        for i, part in enumerate(parts):
            if i == len(parts) - 1:
                # Leaf file
                current[part] = {
                    "name": part,
                    "path": f.file_path,
                    "type": "file",
                    "language": f.language,
                    "file_id": f.id,
                }
            else:
                if part not in current or not isinstance(current[part], dict) or "children" not in current.get(part, {}):
                    current[part] = current.get(part, {})
                    if "_meta" not in current[part]:
                        current[part]["_meta"] = {
                            "name": part,
                            "path": "/".join(parts[: i + 1]),
                            "type": "directory",
                        }
                    if "children" not in current[part]:
                        current[part]["children"] = {}
                current = current[part]["children"]

    return _tree_to_list(tree)


def _tree_to_list(tree: dict) -> list[dict]:
    """Convert nested dict tree to sorted list format."""
    result = []

    for key, value in sorted(tree.items()):
        if key == "_meta" or key == "children":
            continue

        if isinstance(value, dict) and "type" in value and value["type"] == "file":
            result.append(value)
        elif isinstance(value, dict):
            meta = value.get("_meta", {"name": key, "path": key, "type": "directory"})
            children = _tree_to_list(value.get("children", {}))
            node = {**meta, "children": children}
            result.append(node)

    # Sort: directories first, then files
    result.sort(key=lambda x: (0 if x["type"] == "directory" else 1, x["name"]))
    return result

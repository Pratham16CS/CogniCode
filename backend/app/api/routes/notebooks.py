"""Notebook routes — chat Q&A with semantic cache and user notes."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.file_analysis import FileAnalysis
from app.models.notebook import Notebook
from app.models.repository import Repository
from app.schemas.notebook import ChatRequest, ChatResponse, ChatMessage, NotebookResponse, NotebookUpdateNotes
from app.api.deps import get_current_user
from app.services.llm_service import llm_service
from app.services.semantic_cache import find_cached_answer, store_qa_with_embedding
from app.services import graph_service

router = APIRouter(prefix="/notebooks", tags=["notebooks"])


@router.get("/{file_id}", response_model=NotebookResponse)
async def get_notebook(
    file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get notebook for a specific file."""
    notebook = await _get_notebook(db, file_id, user.id)
    return NotebookResponse.model_validate(notebook)


@router.get("/{file_id}/history")
async def get_chat_history(
    file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get session chat history for a file.
    Tries LangGraph first, fallbacks to Postgres Notebook memory if empty.
    """
    history = graph_service.get_session_history(user.id, file_id)
    
    if not history:
        # Fallback to postgres
        notebook = await _get_notebook(db, file_id, user.id)
        if notebook.chat_history:
            try:
                history = json.loads(notebook.chat_history)
            except json.JSONDecodeError:
                pass

    return {"history": history}


@router.delete("/{file_id}/history")
async def clear_chat_history(
    file_id: int,
    user: User = Depends(get_current_user),
):
    """Clear LangGraph session memory for a user+file pair."""
    await graph_service.clear_session(user.id, file_id)
    return {"message": "Session memory cleared"}


@router.post("/{file_id}/chat", response_model=ChatResponse)
async def chat_about_file(
    file_id: int,
    data: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ask a question about a file via REST.
    Uses LangGraph for memory + LangChain fallback chain for generation.
    Semantic cache is checked first to avoid redundant LLM calls.
    """
    notebook = await _get_notebook(db, file_id, user.id)

    file_result = await db.execute(select(FileAnalysis).where(FileAnalysis.id == file_id))
    file_analysis = file_result.scalar_one_or_none()
    if not file_analysis:
        raise HTTPException(status_code=404, detail="File not found")

    now = datetime.now(timezone.utc).isoformat()

    # Build file context for LangGraph
    file_context = (
        f"File: {file_analysis.file_path} | Language: {file_analysis.language or 'unknown'}\n"
        f"File Context: {file_analysis.file_context or 'N/A'}\n"
        f"Skeleton:\n{file_analysis.skeleton_content or 'N/A'}\n"
        f"Logical Core: {file_analysis.logical_core or 'N/A'}"
    )

    # Check semantic cache
    cached_answer = None
    question_embedding = []
    try:
        question_embedding = await llm_service.generate_embedding(data.message)
        cached_answer = await find_cached_answer(db, question_embedding, file_id)
    except Exception:
        pass

    # Run LangGraph agent (handles fallback + memory)
    reply, was_cached = await graph_service.run_chat(
        user_id=user.id,
        file_id=file_id,
        user_message=data.message,
        file_context=file_context,
        cached_answer=cached_answer,
    )

    # Store in semantic cache DB if it was a fresh LLM response
    if not was_cached and question_embedding:
        await store_qa_with_embedding(db, notebook, data.message, reply, question_embedding, now)
        await db.flush()

    # Build response history from LangGraph session
    history = graph_service.get_session_history(user.id, file_id)
    chat_messages = [ChatMessage(role=h["role"], content=h["content"]) for h in history]
    
    # Sync back to Notebook model for standard fetching
    notebook.chat_history = json.dumps([m.model_dump() for m in chat_messages])
    await db.flush()

    return ChatResponse(reply=reply, chat_history=chat_messages)


@router.put("/{file_id}/notes", response_model=NotebookResponse)
async def update_notes(
    file_id: int,
    data: NotebookUpdateNotes,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user notes for a file."""
    notebook = await _get_notebook(db, file_id, user.id)
    notebook.user_notes = data.user_notes
    await db.flush()
    return NotebookResponse.model_validate(notebook)


async def _get_notebook(db: AsyncSession, file_id: int, user_id: int) -> Notebook:
    """Get or create notebook for a file, verifying ownership."""
    result = await db.execute(
        select(Notebook).where(
            Notebook.file_analysis_id == file_id,
            Notebook.user_id == user_id,
        )
    )
    notebook = result.scalar_one_or_none()

    if not notebook:
        # Verify file exists and user owns the repo
        file_result = await db.execute(select(FileAnalysis).where(FileAnalysis.id == file_id))
        fa = file_result.scalar_one_or_none()
        if not fa:
            raise HTTPException(status_code=404, detail="File not found")

        repo_result = await db.execute(
            select(Repository).where(Repository.id == fa.repository_id, Repository.user_id == user_id)
        )
        if not repo_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="File not found")

        notebook = Notebook(file_analysis_id=file_id, user_id=user_id)
        db.add(notebook)
        await db.flush()

    return notebook


def _sanitize_history(history: list[dict]) -> list[ChatMessage]:
    """Remove internal fields (embeddings) from chat history for API response."""
    return [
        ChatMessage(
            role=h["role"],
            content=h["content"],
            timestamp=h.get("timestamp"),
        )
        for h in history
        if h.get("role") in ("user", "assistant")
    ]

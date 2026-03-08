"""Memory management routes — expose and manage the Layer 3 long-term store.

Endpoints:
  GET  /memory/preferences          — List stored user coding preferences
  POST /memory/preferences          — Manually add a preference
  GET  /memory/episodic             — List episodic few-shot refactor examples
  POST /memory/episodic             — Manually store a refactor example
  GET  /memory/session/{file_id}    — Get current LangGraph session summary
  DELETE /memory/session/{file_id}  — Clear session checkpoint
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_current_user
from app.models.user import User
from app.services import graph_service

router = APIRouter(prefix="/memory", tags=["memory"])


class PreferenceCreate(BaseModel):
    preference: str


class EpisodicCreate(BaseModel):
    description: str
    before_code: str
    after_code: str


@router.get("/preferences")
async def get_preferences(user: User = Depends(get_current_user)):
    """List all stored user coding preferences from Layer 3."""
    prefs = graph_service.get_user_preferences(user.id)
    return {"preferences": prefs}


@router.post("/preferences")
async def add_preference(
    data: PreferenceCreate,
    user: User = Depends(get_current_user),
):
    """Manually store a user coding preference into Layer 3."""
    graph_service.store_user_preference(user.id, data.preference)
    return {"message": "Preference stored", "preference": data.preference}


@router.get("/episodic")
async def get_episodic(user: User = Depends(get_current_user)):
    """List all episodic few-shot refactor examples from Layer 3."""
    examples = graph_service.get_episodic_memories(user.id)
    return {"episodic_memories": examples}


@router.post("/episodic")
async def add_episodic(
    data: EpisodicCreate,
    user: User = Depends(get_current_user),
):
    """Manually store a successful refactor as a few-shot example into Layer 3."""
    graph_service.store_episodic_example(
        user.id, data.description, data.before_code, data.after_code
    )
    return {"message": "Episodic example stored", "description": data.description}


@router.get("/session/{file_id}")
async def get_session_memory(
    file_id: int,
    user: User = Depends(get_current_user),
):
    """Get current LangGraph checkpoint (Layer 1) and session summary (Layer 2)."""
    history = graph_service.get_session_history(user.id, file_id)
    return {"session": history}


@router.delete("/session/{file_id}")
async def clear_session_memory(
    file_id: int,
    user: User = Depends(get_current_user),
):
    """Clear the LangGraph session checkpoint for a specific file."""
    await graph_service.clear_session(user.id, file_id)
    return {"message": f"Session cleared for file {file_id}"}

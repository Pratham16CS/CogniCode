"""WebSocket handler for real-time chat and agentic code editing.

Security Layers active:
  - Layer 3: Sentinel validation on generated edit code
  - Layer 5: Human-in-the-Loop — edits are proposed, not applied, until approved
"""

import json
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.file_analysis import FileAnalysis
from app.models.notebook import Notebook
from app.services.llm_service import llm_service, TaskType
from app.services.semantic_cache import find_cached_answer, store_qa_with_embedding
from app.services.auth_service import decode_access_token
from app.services import graph_service
from app.services.security_service import (
    sentinel_validate,
    SentinelVerdict,
    SHIELDED_SYSTEM_PREAMBLE,
    prepare_secure_input,
    PendingEdit,
    store_pending_edit,
    get_pending_edit,
    remove_pending_edit,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/api/ws/{repo_id}")
async def websocket_endpoint(websocket: WebSocket, repo_id: int):
    """
    WebSocket endpoint for real-time interaction.

    Message types (client → server):
      - {"type": "auth", "token": "<jwt>"}
      - {"type": "chat", "file_id": 123, "message": "..."}
      - {"type": "edit_request", "file_id": 123, "instruction": "..."}
      - {"type": "edit_approve", "edit_id": "<uuid>"}
      - {"type": "edit_reject", "edit_id": "<uuid>"}

    Message types (server → client):
      - {"type": "chat_reply", "content": "...", "cached": false}
      - {"type": "edit_proposal", "edit_id": "...", "old_code": "...", "new_code": "...", ...}
      - {"type": "edit_applied", "file_id": ..., "text": "..."}
      - {"type": "edit_rejected", "edit_id": "..."}
      - {"type": "sentinel_blocked", "reason": "..."}
      - {"type": "error", "message": "..."}
      - {"type": "status", "message": "..."}
    """
    await websocket.accept()
    user_id = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await _send(websocket, {"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = msg.get("type")

            # Auth handshake
            if msg_type == "auth":
                user_id = decode_access_token(msg.get("token", ""))
                if user_id:
                    await _send(websocket, {"type": "status", "message": "Authenticated"})
                else:
                    await _send(websocket, {"type": "error", "message": "Invalid token"})
                continue

            if not user_id:
                await _send(websocket, {"type": "error", "message": "Not authenticated. Send auth first."})
                continue

            if msg_type == "chat":
                await _handle_chat(websocket, user_id, repo_id, msg)
            elif msg_type == "edit_request":
                await _handle_edit_request(websocket, user_id, repo_id, msg)
            elif msg_type == "edit_approve":
                await _handle_edit_approve(websocket, user_id, msg)
            elif msg_type == "edit_reject":
                await _handle_edit_reject(websocket, msg)
            else:
                await _send(websocket, {"type": "error", "message": f"Unknown type: {msg_type}"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for repo {repo_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await _send(websocket, {"type": "error", "message": str(e)})
        except Exception:
            pass


# ─────────────────────────────────────────────
# Chat Handler (LangGraph + Semantic Cache)
# ─────────────────────────────────────────────

async def _handle_chat(websocket: WebSocket, user_id: int, repo_id: int, msg: dict):
    """Handle a chat message using LangGraph agent with tri-layer memory."""
    file_id = msg.get("file_id")
    question = msg.get("message", "").strip()

    if not file_id or not question:
        await _send(websocket, {"type": "error", "message": "file_id and message required"})
        return

    async with async_session() as db:
        file_result = await db.execute(select(FileAnalysis).where(FileAnalysis.id == file_id))
        fa = file_result.scalar_one_or_none()
        if not fa:
            await _send(websocket, {"type": "error", "message": "File not found"})
            return

        now = datetime.now(timezone.utc).isoformat()

        file_context = (
            f"File: {fa.file_path} | Language: {fa.language or 'unknown'}\n"
            f"File Context: {fa.file_context or 'N/A'}\n"
            f"Skeleton:\n{fa.skeleton_content or 'N/A'}\n"
            f"Logical Core: {fa.logical_core or 'N/A'}"
        )

        cached_answer = None
        question_embedding = []
        try:
            question_embedding = await llm_service.generate_embedding(question)
            cached_answer = await find_cached_answer(db, question_embedding, file_id)
        except Exception as e:
            logger.warning(f"Semantic cache check failed: {e}")

        await _send(websocket, {"type": "status", "message": "Thinking..."})

        reply, was_cached = await graph_service.run_chat(
            user_id=user_id,
            file_id=file_id,
            user_message=question,
            file_context=file_context,
            cached_answer=cached_answer,
        )

        await _send(websocket, {
            "type": "chat_reply",
            "content": reply,
            "cached": was_cached,
        })

        # Sync LangGraph SQLite memory back to Postgres
        history = graph_service.get_session_history(user_id, file_id)
        notebook = await _get_or_create_notebook(db, file_id, user_id)
        notebook.chat_history = json.dumps(history)

        if not was_cached and question_embedding:
            await store_qa_with_embedding(db, notebook, question, reply, question_embedding, now)
            
        await db.commit()


# ─────────────────────────────────────────────
# Edit Handler (Sentinel + Human-in-the-Loop)
# ─────────────────────────────────────────────

async def _handle_edit_request(websocket: WebSocket, user_id: int, repo_id: int, msg: dict):
    """
    Agentic edit with security:
    1. LLM generates new skeleton
    2. Layer 3: Sentinel validates the generated code
    3. Layer 5: If safe, sends a PROPOSAL (not direct apply) — user must approve
    """
    file_id = msg.get("file_id")
    instruction = msg.get("instruction", "").strip()

    if not file_id or not instruction:
        await _send(websocket, {"type": "error", "message": "file_id and instruction required"})
        return

    async with async_session() as db:
        file_result = await db.execute(select(FileAnalysis).where(FileAnalysis.id == file_id))
        fa = file_result.scalar_one_or_none()
        if not fa:
            await _send(websocket, {"type": "error", "message": "File not found"})
            return

        await _send(websocket, {"type": "status", "message": "Generating edit..."})

        # Layer 1: Shield the existing skeleton in XML
        secured_skeleton = prepare_secure_input(
            fa.skeleton_content or "", fa.file_path, fa.language or ""
        )

        prompt = f"""{SHIELDED_SYSTEM_PREAMBLE}

The user wants to modify the skeleton code.

Current Skeleton:
{secured_skeleton}

User Instruction: {instruction}

Generate the COMPLETE updated skeleton code. Output ONLY the code, no markdown fences."""

        new_skeleton = await llm_service.generate(
            prompt=prompt,
            task_type=TaskType.CHAT,
            system_prompt="You are CogniCode. Apply the user's instruction precisely. Output only code.",
            temperature=0.2,
        )

        # Layer 3: Sentinel validation on the generated code
        verdict, explanation = await sentinel_validate(
            new_skeleton,
            context=f"Edit for {fa.file_path}: {instruction}",
            use_llm=True,  # Full LLM sentinel for edits (edits are high-risk)
        )

        if verdict == SentinelVerdict.BLOCKED:
            logger.warning(f"Sentinel BLOCKED edit for {fa.file_path}: {explanation}")
            await _send(websocket, {
                "type": "sentinel_blocked",
                "reason": explanation,
                "file_path": fa.file_path,
            })
            return

        # Layer 5: Human-in-the-Loop — propose, don't apply
        edit_id = str(uuid.uuid4())
        pending = PendingEdit(
            edit_id=edit_id,
            file_id=file_id,
            file_path=fa.file_path,
            old_code=fa.skeleton_content or "",
            new_code=new_skeleton,
            sentinel_verdict=verdict,
            sentinel_explanation=explanation,
        )
        store_pending_edit(pending)

        # Send proposal to client for diff review
        await _send(websocket, {
            "type": "edit_proposal",
            **pending.to_dict(),
        })
        logger.info(f"Edit proposed [{edit_id}] for {fa.file_path} — awaiting user approval")


async def _handle_edit_approve(websocket: WebSocket, user_id: int, msg: dict):
    """User approved a proposed edit — apply it now."""
    edit_id = msg.get("edit_id", "")
    pending = remove_pending_edit(edit_id)

    if not pending:
        await _send(websocket, {"type": "error", "message": f"Edit {edit_id} not found or expired"})
        return

    async with async_session() as db:
        file_result = await db.execute(
            select(FileAnalysis).where(FileAnalysis.id == pending.file_id)
        )
        fa = file_result.scalar_one_or_none()
        if not fa:
            await _send(websocket, {"type": "error", "message": "File no longer exists"})
            return

        # Apply the edit
        fa.skeleton_content = pending.new_code
        await db.commit()

        # Store as episodic memory (successful refactor example)
        graph_service.store_episodic_example(
            user_id,
            description=f"Edit to {pending.file_path}",
            before_code=pending.old_code[:500],
            after_code=pending.new_code[:500],
        )

        await _send(websocket, {
            "type": "edit_applied",
            "edit_id": edit_id,
            "file_id": pending.file_id,
            "path": pending.file_path,
            "text": pending.new_code,
            "full_replace": True,
        })
        logger.info(f"Edit [{edit_id}] APPROVED and applied to {pending.file_path}")


async def _handle_edit_reject(websocket: WebSocket, msg: dict):
    """User rejected a proposed edit — discard it."""
    edit_id = msg.get("edit_id", "")
    pending = remove_pending_edit(edit_id)

    if pending:
        await _send(websocket, {
            "type": "edit_rejected",
            "edit_id": edit_id,
        })
        logger.info(f"Edit [{edit_id}] REJECTED by user")
    else:
        await _send(websocket, {"type": "error", "message": f"Edit {edit_id} not found"})


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

async def _get_or_create_notebook(db: AsyncSession, file_id: int, user_id: int) -> Notebook:
    """Get or create a notebook entry."""
    result = await db.execute(
        select(Notebook).where(Notebook.file_analysis_id == file_id, Notebook.user_id == user_id)
    )
    notebook = result.scalar_one_or_none()
    if not notebook:
        notebook = Notebook(file_analysis_id=file_id, user_id=user_id)
        db.add(notebook)
        await db.flush()
    return notebook


async def _send(websocket: WebSocket, data: dict):
    """Send JSON message via WebSocket."""
    await websocket.send_text(json.dumps(data))


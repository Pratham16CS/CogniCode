"""
Tri-Layer Memory Architecture for CogniCode Chat Agent
=======================================================

Layer 1 — Short-Term (Thread Persistence)
    AsyncSqliteSaver checkpointer: saves the full graph state after every node.
    Key: thread_id = f"{user_id}:{file_id}"
    Enables crash recovery — the agent resumes exactly where it left off.

Layer 2 — Contextual (Adaptive Memory)
    - Summarizer node: every SUMMARIZE_EVERY turns, condenses old messages into a
      running summary string, then truncates the message list.
    - trim_messages: hard token budget enforced on the message window.
    - Virtual code window: only shows the LLM the relevant code block, not the full file.

Layer 3 — Long-Term (Cross-Thread Store)
    InMemoryStore namespaced by:
      (user_id, "preferences") — coding style preferences extracted from conversation
      (user_id, "episodic")    — successful before/after refactor examples (few-shot)
    Long-term store is consulted at every LLM call to personalize responses.
"""

import json
import logging
import asyncio
from pathlib import Path
from typing import Annotated, Optional, Any
from typing_extensions import TypedDict

from langchain_core.messages import (
    BaseMessage, HumanMessage, AIMessage, SystemMessage,
    trim_messages, RemoveMessage,
)
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.store.memory import InMemoryStore

from app.services.llm_service import llm_service, TaskType
from app.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────
SUMMARIZE_EVERY = 8          # Summarize after every N human turns
MAX_TOKENS_IN_WINDOW = 6000  # Hard token budget for the message window
DB_PATH = Path("./cognicode_memory.db")  # SQLite file for checkpointer


# ─────────────────────────────────────────────────────────────
# State Definition
# ─────────────────────────────────────────────────────────────
class CogniCodeState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    summary: str              # Running summary of prior conversation (Layer 2)
    file_context: str         # System context about the current file
    code_window: str          # Virtual window: the specific code block being discussed
    cached_answer: Optional[str]
    used_cache: bool
    turn_count: int           # Number of human turns in this session


# ─────────────────────────────────────────────────────────────
# Long-Term Store (Layer 3)
# ─────────────────────────────────────────────────────────────
_long_term_store = InMemoryStore()


def _get_user_preferences(user_id: int) -> str:
    """Retrieve stored coding preferences for a user from the long-term store."""
    try:
        items = _long_term_store.search(("preferences", str(user_id)))
        if not items:
            return ""
        prefs = [item.value.get("preference", "") for item in items if item.value]
        return "User Preferences:\n" + "\n".join(f"- {p}" for p in prefs if p)
    except Exception:
        return ""


def _get_episodic_examples(user_id: int, max_examples: int = 2) -> str:
    """Retrieve few-shot refactor examples from the episodic memory store."""
    try:
        items = _long_term_store.search(("episodic", str(user_id)))
        if not items:
            return ""
        examples = []
        for item in items[-max_examples:]:
            v = item.value
            examples.append(
                f"Past Example — {v.get('description', 'refactor')}:\n"
                f"  Before: {v.get('before', '')[:200]}\n"
                f"  After:  {v.get('after', '')[:200]}"
            )
        return "Past Successful Refactors (Few-Shot):\n" + "\n\n".join(examples)
    except Exception:
        return ""


def store_user_preference(user_id: int, preference: str) -> None:
    """Persist a detected user coding preference to the long-term store."""
    import uuid
    _long_term_store.put(
        ("preferences", str(user_id)),
        key=str(uuid.uuid4()),
        value={"preference": preference},
    )
    logger.info(f"Stored preference for user {user_id}: {preference}")


def store_episodic_example(
    user_id: int, description: str, before_code: str, after_code: str
) -> None:
    """Persist a successful refactor example (few-shot) to episodic memory."""
    import uuid
    _long_term_store.put(
        ("episodic", str(user_id)),
        key=str(uuid.uuid4()),
        value={
            "description": description,
            "before": before_code,
            "after": after_code,
        },
    )
    logger.info(f"Stored episodic example for user {user_id}: {description}")


# ─────────────────────────────────────────────────────────────
# Graph Nodes
# ─────────────────────────────────────────────────────────────

async def summarize_node(state: CogniCodeState) -> dict:
    """
    Layer 2 — Contextual Memory: Summarization
    Condenses old conversation into a running summary, then removes old messages
    from state (keeping only the last 2 for continuity + the new system message).
    """
    messages = state["messages"]
    existing_summary = state.get("summary", "")

    # Build summarization prompt
    conversation_text = "\n".join(
        f"{('User' if isinstance(m, HumanMessage) else 'CogniCode')}: {m.content}"
        for m in messages
        if isinstance(m, (HumanMessage, AIMessage))
    )

    summary_prompt = (
        f"Previous summary: {existing_summary}\n\n"
        f"New conversation:\n{conversation_text}\n\n"
        "Create an updated concise summary of this conversation. "
        "Focus on: what files were discussed, what issues were identified, "
        "what was refactored, and any pending tasks. "
        "Keep it under 150 words."
    )

    chain = llm_service._build_runnable_chain(TaskType.CHAT, temperature=0.1)
    new_summary = await chain.ainvoke([HumanMessage(content=summary_prompt)])
    logger.info(f"Summarized conversation: {len(new_summary)} chars")

    # Remove all messages except the last 2 (most recent exchange)
    delete_messages = [RemoveMessage(id=m.id) for m in messages[:-2] if hasattr(m, "id") and m.id]

    return {
        "summary": new_summary,
        "messages": delete_messages,
    }


async def llm_node(state: CogniCodeState, store: Any = None) -> dict:
    """
    Layer 1 + 2 + 3 — Main LLM call with:
    - File context injected as System message
    - Running summary prepended (Layer 2)
    - User preferences + episodic examples from long-term store (Layer 3)
    - trim_messages applied to enforce token budget (Layer 2)
    """
    # Extract user_id from thread config (passed via store namespace)
    # We reconstruct from store search - get from state metadata
    user_id = state.get("_user_id", 0)

    file_context = state.get("file_context", "")
    code_window = state.get("code_window", "")
    summary = state.get("summary", "")

    # Layer 3: Fetch long-term memories
    user_prefs = _get_user_preferences(user_id)
    episodic = _get_episodic_examples(user_id)

    # Build dynamic system message
    system_parts = [
        "You are CogniCode, an expert code tutor and software architect.",
        "Answer questions about the code clearly, concisely, and with educational depth.",
        "",
    ]
    if file_context:
        system_parts.append(file_context)
    if code_window:
        system_parts.append(f"\nCurrent Code Focus:\n```\n{code_window}\n```")
    if summary:
        system_parts.append(f"\nConversation Summary: {summary}")
    if user_prefs:
        system_parts.append(f"\n{user_prefs}")
    if episodic:
        system_parts.append(f"\n{episodic}")

    system_msg = SystemMessage(content="\n".join(system_parts))

    # Layer 2: Apply token trimming to message history
    messages = state["messages"]
    trimmed = trim_messages(
        messages,
        max_tokens=MAX_TOKENS_IN_WINDOW,
        strategy="last",
        token_counter=lambda msgs: sum(len(m.content.split()) * 1.3 for m in msgs),
        include_system=False,
        allow_partial=False,
    )

    full_messages = [system_msg] + trimmed

    chain = llm_service._build_runnable_chain(TaskType.CHAT, temperature=0.4)
    response = await chain.ainvoke(full_messages)

    # Detect preference statements in user message for Layer 3 storage
    last_human = next(
        (m for m in reversed(messages) if isinstance(m, HumanMessage)), None
    )
    if last_human and user_id:
        _detect_and_store_preference(user_id, last_human.content)

    return {
        "messages": [AIMessage(content=response)],
        "cached_answer": None,
        "used_cache": False,
        "turn_count": state.get("turn_count", 0) + 1,
    }


async def cache_respond_node(state: CogniCodeState) -> dict:
    """Return a cached answer directly without LLM call."""
    cached = state.get("cached_answer", "")
    return {
        "messages": [AIMessage(content=cached)],
        "used_cache": True,
        "turn_count": state.get("turn_count", 0) + 1,
    }


def _detect_and_store_preference(user_id: int, message: str) -> None:
    """
    Heuristically detect preference statements, store in long-term memory.
    E.g., "always use list comprehensions", "prefer async patterns".
    """
    pref_triggers = [
        "always ", "prefer ", "i like ", "use ", "don't use ", "avoid ",
        "instead of ", "rather than ",
    ]
    msg_lower = message.lower().strip()
    if any(msg_lower.startswith(t) or f" {t}" in msg_lower for t in pref_triggers):
        if len(message) < 200:  # Only short, declarative statements
            store_user_preference(user_id, message)


# ─────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────

def should_summarize(state: CogniCodeState) -> str:
    """Route to summarizer if we've hit the turn threshold, else go to LLM."""
    if state.get("cached_answer"):
        return "cache_respond"
    turn_count = state.get("turn_count", 0)
    messages = state.get("messages", [])
    human_turns = sum(1 for m in messages if isinstance(m, HumanMessage))
    if human_turns > 0 and human_turns % SUMMARIZE_EVERY == 0:
        return "summarize"
    return "llm_call"


# ─────────────────────────────────────────────────────────────
# Graph Assembly
# ─────────────────────────────────────────────────────────────

def _build_graph(checkpointer) -> StateGraph:
    builder = StateGraph(CogniCodeState)

    builder.add_node("llm_call", llm_node)
    builder.add_node("cache_respond", cache_respond_node)
    builder.add_node("summarize", summarize_node)

    builder.add_conditional_edges(
        START,
        should_summarize,
        {
            "llm_call": "llm_call",
            "cache_respond": "cache_respond",
            "summarize": "summarize",
        },
    )
    # After summarization, proceed to LLM with fresh context
    builder.add_edge("summarize", "llm_call")
    builder.add_edge("llm_call", END)
    builder.add_edge("cache_respond", END)

    return builder.compile(checkpointer=checkpointer, store=_long_term_store)


# ─────────────────────────────────────────────────────────────
# Initialization (async, called from FastAPI lifespan)
# ─────────────────────────────────────────────────────────────
_chat_graph = None
_checkpointer_ctx = None


async def initialize():
    """Initialize the AsyncSqliteSaver checkpointer and compile the graph."""
    global _chat_graph, _checkpointer_ctx
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    _checkpointer_ctx = AsyncSqliteSaver.from_conn_string(str(DB_PATH))
    checkpointer = await _checkpointer_ctx.__aenter__()
    _chat_graph = _build_graph(checkpointer)
    logger.info(f"LangGraph chat agent initialized with SQLite checkpointer at {DB_PATH}")


async def shutdown():
    """Clean up the checkpointer connection."""
    global _checkpointer_ctx
    if _checkpointer_ctx:
        await _checkpointer_ctx.__aexit__(None, None, None)


# ─────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────

async def run_chat(
    user_id: int,
    file_id: int,
    user_message: str,
    file_context: str,
    cached_answer: Optional[str] = None,
    code_window: str = "",
) -> tuple[str, bool]:
    """
    Run one turn of the tri-layer memory chat agent.

    Args:
        user_id:      Authenticated user ID
        file_id:      The file being discussed (scopes the thread)
        user_message: The user's question or instruction
        file_context: File path, language, skeleton, and logical core info
        cached_answer: Pre-fetched semantic cache result (or None)
        code_window:  The specific code block in focus (virtual window)

    Returns:
        (response_text, was_cached)
    """
    if _chat_graph is None:
        raise RuntimeError("graph_service not initialized. Call await initialize() first.")

    thread_id = f"{user_id}:{file_id}"
    config = {"configurable": {"thread_id": thread_id}}

    input_state: CogniCodeState = {
        "messages": [HumanMessage(content=user_message)],
        "summary": "",             # Will be loaded from checkpoint automatically
        "file_context": file_context,
        "code_window": code_window,
        "cached_answer": cached_answer,
        "used_cache": False,
        "turn_count": 0,
        "_user_id": user_id,       # Passed through for Layer 3 store access
    }

    result = await _chat_graph.ainvoke(input_state, config=config)

    ai_messages = [m for m in result["messages"] if isinstance(m, AIMessage)]
    response = ai_messages[-1].content if ai_messages else "No response generated."
    was_cached = result.get("used_cache", False)

    logger.info(f"Chat [{thread_id}] cached={was_cached} turns={result.get('turn_count')} len={len(response)}")
    return response, was_cached


async def clear_session(user_id: int, file_id: int) -> None:
    """Clear the conversation checkpoint for a user+file session."""
    if _chat_graph is None:
        return
    thread_id = f"{user_id}:{file_id}"
    config = {"configurable": {"thread_id": thread_id}}
    try:
        await _chat_graph.aupdate_state(
            config,
            {"messages": [], "summary": "", "turn_count": 0, "cached_answer": None},
        )
    except Exception as e:
        logger.warning(f"Could not clear session {thread_id}: {e}")


def get_session_history(user_id: int, file_id: int) -> list[dict]:
    """Return formatted conversation history from the checkpoint."""
    if _chat_graph is None:
        return []
    thread_id = f"{user_id}:{file_id}"
    config = {"configurable": {"thread_id": thread_id}}
    try:
        state = _chat_graph.get_state(config)
        if not state or not state.values:
            return []
        messages = state.values.get("messages", [])
        summary = state.values.get("summary", "")
        result = []
        if summary:
            result.append({"role": "system", "content": f"[Summary] {summary}"})
        result.extend(
            {
                "role": "user" if isinstance(m, HumanMessage) else "assistant",
                "content": m.content,
            }
            for m in messages
            if isinstance(m, (HumanMessage, AIMessage))
        )
        return result
    except Exception:
        return []


def get_user_preferences(user_id: int) -> list[str]:
    """Retrieve all stored user preferences from Layer 3."""
    try:
        items = _long_term_store.search(("preferences", str(user_id)))
        return [item.value.get("preference", "") for item in items if item.value]
    except Exception:
        return []


def get_episodic_memories(user_id: int) -> list[dict]:
    """Retrieve all episodic few-shot examples from Layer 3."""
    try:
        items = _long_term_store.search(("episodic", str(user_id)))
        return [item.value for item in items if item.value]
    except Exception:
        return []

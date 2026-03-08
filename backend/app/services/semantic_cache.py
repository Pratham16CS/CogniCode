"""Semantic cache — avoids redundant LLM calls by finding similar past Q&A pairs.

Uses embedding cosine similarity to match new questions against cached answers.
If similarity > threshold, returns cached answer directly without an LLM call.
"""

import json
import math
import logging
from typing import Optional, Tuple, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notebook import Notebook

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.92  # Cosine similarity threshold for cache hits


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b) or not a:
        return 0.0

    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))

    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


async def find_cached_answer(
    db: AsyncSession,
    question_embedding: List[float],
    file_analysis_id: int,
) -> Optional[str]:
    """
    Search past chat history for a similar question.
    Returns the cached answer if found, None otherwise.
    """
    result = await db.execute(
        select(Notebook).where(Notebook.file_analysis_id == file_analysis_id)
    )
    notebook = result.scalar_one_or_none()

    if not notebook or not notebook.chat_history:
        return None

    try:
        history = json.loads(notebook.chat_history)
    except json.JSONDecodeError:
        return None

    # Search through Q&A pairs with embeddings
    best_similarity = 0.0
    best_answer = None

    for entry in history:
        if entry.get("role") != "user" or "embedding" not in entry:
            continue

        cached_embedding = entry["embedding"]
        similarity = cosine_similarity(question_embedding, cached_embedding)

        if similarity > best_similarity:
            best_similarity = similarity
            best_answer_idx = history.index(entry)

    if best_similarity >= SIMILARITY_THRESHOLD and best_answer_idx is not None:
        # Find the assistant reply that follows this user message
        for j in range(best_answer_idx + 1, len(history)):
            if history[j].get("role") == "assistant":
                best_answer = history[j]["content"]
                break

    if best_answer:
        logger.info(
            f"Semantic cache HIT (similarity={best_similarity:.3f}) "
            f"for file_analysis_id={file_analysis_id}"
        )
        return best_answer

    return None


async def store_qa_with_embedding(
    db: AsyncSession,
    notebook: Notebook,
    question: str,
    answer: str,
    question_embedding: List[float],
    timestamp: str,
):
    """Store a Q&A pair with the question's embedding for future cache lookups."""
    try:
        history = json.loads(notebook.chat_history) if notebook.chat_history else []
    except json.JSONDecodeError:
        history = []

    # Store user message with embedding
    history.append({
        "role": "user",
        "content": question,
        "embedding": question_embedding,
        "timestamp": timestamp,
    })

    # Store assistant reply (no embedding needed for answers)
    history.append({
        "role": "assistant",
        "content": answer,
        "timestamp": timestamp,
    })

    notebook.chat_history = json.dumps(history)
    await db.flush()

    logger.info(f"Stored Q&A with embedding for notebook {notebook.id}")

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
    Search past chat history for a similar question using pgvector in SQL.
    Returns the cached answer if found, None otherwise.
    """
    # Check if we are on Postgres to use native vector search
    from sqlalchemy import text
    from app.database import db_url
    
    if "postgresql" in db_url:
        # pgvector search using Euclidean distance (<->) or Cosine distance (<=>)
        # We use a subquery or join to find the matching reply in chat_history
        # For simplicity in this MVP, we find the best matching notebook entry 
        # that has a question_embedding similar to ours.
        
        # Note: If multiple notebooks exist for the same file, we pick the best.
        # However, notebooks are currently unique per file_analysis.
        # We need to search through ALL notebook updates? 
        # Actually, our current model stores ONE chat_history JSON per notebook.
        # If we want to search *history* via SQL, we'd need a message-level table.
        # For now, let's keep the persistence in JSON but use the latest question_embedding
        # for a quick check if the *last* question was similar.
        
        result = await db.execute(
            select(Notebook)
            .where(Notebook.file_analysis_id == file_analysis_id)
            .where(Notebook.question_embedding.l2_distance(question_embedding) < 0.4) # Approx SIMILARITY_THRESHOLD
            .order_by(Notebook.question_embedding.l2_distance(question_embedding))
            .limit(1)
        )
        notebook = result.scalar_one_or_none()
        if notebook and notebook.chat_history:
            history = json.loads(notebook.chat_history)
            # Find the last assistant message
            for entry in reversed(history):
                if entry.get("role") == "assistant":
                    return entry.get("content")
        return None

    # Fallback for SQLite (manual loop)
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
    best_answer_idx = None

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
    # Update the primary question_embedding for the next quick SQL lookup
    notebook.question_embedding = question_embedding
    await db.flush()

    logger.info(f"Stored Q&A with embedding for notebook {notebook.id}")

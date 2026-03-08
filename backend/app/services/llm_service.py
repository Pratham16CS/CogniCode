"""Multi-model LLM service using LangChain with automatic fallback chains.

Uses LangChain's ChatGoogleGenerativeAI and ChatGroq with RunnableWithFallbacks
for a clean 3-tier model chain per task type.
"""

import asyncio
import logging
import time
from typing import Optional
from enum import Enum

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq

from app.config import settings

logger = logging.getLogger(__name__)


class TaskType(str, Enum):
    TRIAGE = "triage"          # Fast Groq filtering of file tree
    MAPPING = "mapping"        # Batched Gemini Flash logic extraction
    SYNTHESIS = "synthesis"    # Final expert Gemini Pro synthesis
    CHAT = "chat"              # Chat / Q&A


class RateLimiter:
    """Simple in-memory rate limiter tracking requests per minute."""

    def __init__(self, max_rpm: int = 8):
        self.max_rpm = max_rpm
        self.timestamps: list[float] = []

    def can_proceed(self) -> bool:
        now = time.time()
        self.timestamps = [t for t in self.timestamps if now - t < 60]
        return len(self.timestamps) < self.max_rpm

    def record(self):
        self.timestamps.append(time.time())

    async def wait_if_needed(self):
        while not self.can_proceed():
            wait_time = 60 - (time.time() - self.timestamps[0]) + 0.5
            logger.info(f"Rate limit reached, waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
            self.timestamps = [t for t in self.timestamps if time.time() - t < 60]


class LLMService:
    """
    LangChain-powered multi-provider LLM service with automatic 3-tier fallback.

    For each TaskType, a LangChain `RunnableWithFallbacks` chain is constructed:
        Primary (Gemini) → Fallback 1 → Fallback 2 (Groq)
    """

    def __init__(self):
        self.gemini_limiter = RateLimiter(max_rpm=8)
        self._chains: dict = {}
        self._embedding_model = None
        self._build_chains()

    def _make_gemini(self, model: str, temperature: float) -> ChatGoogleGenerativeAI:
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            google_api_key=settings.GEMINI_API_KEY,
            convert_system_message_to_human=False,
        )

    def _make_groq(self, model: str, temperature: float) -> ChatGroq:
        return ChatGroq(
            model=model,
            temperature=temperature,
            groq_api_key=settings.GROQ_API_KEY,
            max_tokens=4096,
        )

    def _build_chains(self):
        """
        Build RunnableWithFallbacks chains for each task type.
        Chains are temperature-neutral here; temperature is applied at call time.
        """
        # We store model *names* and build chains lazily at call time
        # so temperature can be set per-call.
        self._model_chains = {
            TaskType.TRIAGE: [
                ("groq",   "llama-3.3-70b-versatile"),
            ],
            TaskType.MAPPING: [
                ("gemini", "gemini-2.5-flash-lite"),
                ("gemini", "gemini-2.5-flash"),
                ("groq",   "llama-3.3-70b-versatile"),
            ],
            TaskType.SYNTHESIS: [
                ("gemini", "gemini-3-flash-preview"),
                ("groq",   "llama-3.3-70b-versatile"),
                ("groq","moonshotai/kimi-k2-instruct-0905"),
                ("gemini", "gemini-2.5-flash"),
            ],
            TaskType.CHAT: [
                ("groq",   "llama-3.3-70b-versatile"),
                ("gemini", "gemini-2.5-flash"),
                ("groq",   "qwen/qwen3-32b"),
            ],
        }

    def _build_runnable_chain(self, task_type: TaskType, temperature: float):
        """
        Dynamically build a LangChain RunnableWithFallbacks for a given task type.
        Returns a chain: ChatPromptTemplate | LLM chain with fallbacks | StrOutputParser
        """
        models_spec = self._model_chains[task_type]
        runnables = []

        for provider, model_name in models_spec:
            if provider == "gemini" and settings.GEMINI_API_KEY:
                runnables.append(self._make_gemini(model_name, temperature))
            elif provider == "groq" and settings.GROQ_API_KEY:
                runnables.append(self._make_groq(model_name, temperature))

        if not runnables:
            raise RuntimeError("No LLM providers configured. Set GEMINI_API_KEY or GROQ_API_KEY.")

        # Chain with fallbacks: primary.with_fallbacks([secondary, tertiary])
        primary = runnables[0]
        fallbacks = runnables[1:]
        if fallbacks:
            chain = primary.with_fallbacks(fallbacks)
        else:
            chain = primary

        return chain | StrOutputParser()

    async def generate(
        self,
        prompt: str,
        task_type: TaskType,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate text using the LangChain fallback chain for the task type.
        """
        # Only rate-limit if primary model is Gemini
        primary_provider = self._model_chains[task_type][0][0]
        if primary_provider == "gemini":
            await self.gemini_limiter.wait_if_needed()
            self.gemini_limiter.record()

        chain = self._build_runnable_chain(task_type, temperature)

        # Build messages
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))

        result = await chain.ainvoke(messages)
        logger.info(f"LLM response for {task_type}: {len(result)} chars")
        return result

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate embeddings using LangChain's Google Generative AI embeddings."""
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("Gemini API key not configured")

        if self._embedding_model is None:
            self._embedding_model = GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-001",
                google_api_key=settings.GEMINI_API_KEY,
            )

        await self.gemini_limiter.wait_if_needed()
        self.gemini_limiter.record()

        # LangChain embeddings are sync; run in thread pool
        embedding = await asyncio.to_thread(
            self._embedding_model.embed_query, text
        )
        return embedding


# Singleton
llm_service = LLMService()

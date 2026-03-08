# 📐 CogniCode — Technical Design Document

## 1. System Architecture
CogniCode is built as a decoupled **Client-Server** application with an emphasis on **Asynchronous Processing** and **Agentic AI**.

### 1.1 High-Level Flow
1.  **Ingestion Layer**: A Python-based Git service clones the repository into a temporary workspace.
2.  **Analysis Pipeline (Map-Reduce)**:
    *   **Map**: The `AnalysisService` iterates through the file tree, filtering out binary and noise files (via `.gitignore` and heuristics). For each source file, it triggers a Gemini/Groq chain to generate a **Logical Skeleton**.
    *   **Reduce**: Once all files are mapped, a secondary synthesis chain aggregates the logical cores into a `ProjectOverview`.
3.  **Persistence Layer**: Results are stored in **PostgreSQL**. Embeddings for questions and code are stored using the `pgvector` extension for efficient semantic search.
4.  **Interaction Layer**: A **LangGraph** agent manages the "AI Tutor" session, utilizing the vector DB for RAG (Retrieval-Augmented Generation) and following a stateful multi-turn history.

## 2. Core Components

### 2.1 The "Logical Skeleton" Concept
Unlike traditional code summarization, a Logical Skeleton is a functional piece of code where:
*   Standard imports are removed.
*   Function bodies are replaced with high-level descriptions or pseudo-code if they are "mechanical" (e.g., getters/setters).
*   Critical algorithms are preserved but commented with `// WHY:` explaining the underlying logic.

### 2.2 Semantic Cache System
To minimize LLM costs and latency, CogniCode implements a two-tier cache:
1.  **Git-Hash Cache**: If a file's hash hasn't changed since the last analysis, the system skips the LLM call entirely.
2.  **Vector-Based Q&A Cache**: User questions are embedded and compared against past Q&A pairs in the DB using **Euclidean Distance (`l2_distance`)**. If a highly similar question is found (threshold > 0.9), the cached answer is returned.

### 2.3 Agentic AI (LangGraph)
The chat system is not a simple prompt. It is a **Graph-based Agent** that:
*   Analyzes the user's intent.
*   Decides if it needs to fetch file context from the database.
*   Incorporates "Sentinel Validation" to ensure code suggestions are safe.
*   Maintains a persistent session across requests.

## 3. Data Model
*   **Repository**: Metadata about the GitHub repo (URL, branch, stats).
*   **FileAnalysis**: The results of the mapping phase (skeleton, context, logical core, **embedding**).
*   **Notebook**: Persistent memory for a file-user pair, storing **chat_history** and **user_notes**.

## 4. Security Architecture (The 5-Layer Shield)
1.  **Shielded Input**: Regex-based validation of all external inputs.
2.  **AST Sanitization**: Removing dangerous decorators or patterns (e.g., `__getattr__` or `exec`) before LLM processing.
3.  **Sentinel Checks**: Post-LLM verification to ensure the generated skeleton doesn't contain hidden payloads.
4.  **Environment Isolation**: Repos are cloned into a dedicated `CLONE_DIR` with strict file permissions.
5.  **Audit Logs**: All AI interactions are logged for accountability.

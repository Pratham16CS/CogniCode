# 📋 CogniCode — Requirement Document

## 1. Project Goal
To provide an autonomous, AI-driven educational platform that empowers developers to understand complex GitHub repositories by distilling them into **Logical Skeletons** and providing an interactive **AI-driven learning environment**.

## 2. Functional Requirements (FR)

### 2.1 Repository Ingestion
*   **FR-1.1**: User must be able to input a public GitHub repository URL.
*   **FR-1.2**: System must clone the repository and index its file tree.
*   **FR-1.3**: System must detect the project's tech stack (languages, frameworks).

### 2.2 Analysis Pipeline (Logic Skeletons)
*   **FR-2.1**: System must generate a "Logical Skeleton" for each source file, removing boilerplate code.
*   **FR-2.2**: System must explain the "Rule in Project" and "Logical Core" for each file.
*   **FR-2.3**: System must track removed code in a "Removal Log" with clear justifications.

### 2.3 Learning Ecosystem
*   **FR-3.1**: User must have a side-by-side view (Original Source vs. Logic Skeleton).
*   **FR-3.2**: System must provide an AI Tutor Chat for Q&A on a per-file basis.
*   **FR-3.3**: User must be able to save personal notes per file analysis in a persistent notebook.
*   **FR-3.4**: System must persist all Q/A history per user/file pair.

### 2.4 Performance & Scalability
*   **FR-4.1**: System must use a **Semantic Cache** (pgvector) to identify and return similar past answers instantly.
*   **FR-4.2**: System must support **Multimodal Failover** (Gemini ↔ Groq) for maximum uptime.

## 3. Non-Functional Requirements (NFR)

### 3.1 Security (The 5-Layer Shield)
*   **NFR-1.1**: System must implement input sanitization for all external URLs.
*   **NFR-1.2**: System must perform AST-based code analysis to prevent malicious prompt injection.
*   **NFR-1.3**: User data must be protected via JWT-based authentication.

### 3.2 Reliability & Availability
*   **NFR-2.1**: System must handle LLM rate limits gracefully using a tiered fallback mechanism.
*   **NFR-2.2**: Database must persist data across server restarts (PostgreSQL requirement for production).

### 3.3 Usability
*   **NFR-3.1**: UI must follow a high-fidelity "Retro-Futuristic" (CRT/Glassmorphism) design language.
*   **NFR-3.2**: Entire analyzer flow must provide real-time progress feedback (cloning, indexing, analysis).

## 4. Target Users
*   **Educational Sector**: Students learning new frameworks.
*   **Corporate Sector**: Developers onboarding onto large, legacy codebases.
*   **Open Source**: Contributors looking to understand a new package quickly.

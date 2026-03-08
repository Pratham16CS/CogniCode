# CogniCode — Autonomous Educational Web App

**Understand any codebase in minutes, not weeks.** CogniCode distills GitHub repositories into "Logical Skeletons" — stripping away boilerplate to expose core algorithms, design patterns, and critical logic.

## Features

- 🧬 **Logical Skeletons** — AI-generated simplified code preserving only core logic
- 📓 **Learning Notebooks** — File context, removal logs, and algorithm explanations per file
- 🤖 **AI Code Tutor** — Chat with context-aware AI about any file
- ✂️ **Dual Editor** — Original source (read-only) side-by-side with editable skeleton
- 📊 **Tech Stack Analysis** — Auto-detected languages, frameworks, and build tools
- 🔒 **Smart Caching** — Git-hash gatekeeper prevents redundant LLM calls
- ⚡ **Semantic Q&A Cache** — Similar questions return cached answers (cosine similarity)
- 🛡️ **JWT Auth** — Email/password registration with secure token-based sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion, Monaco Editor, Zustand |
| Backend | FastAPI, SQLAlchemy (async), WebSockets |
| Database | SQLite (MVP) — migration-ready for PostgreSQL + pgvector |
| AI | Gemini 2.5 Pro/Flash + Groq (Llama 3.3, Qwen3) with 3-tier fallback |

## Quick Start

### 1. Setup Environment

```bash
# Copy env template and add your API keys
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, GROQ_API_KEY, etc.
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install  # already done if scaffolded
npm run dev
```

### 4. Open

Visit `http://localhost:5173` → Register → Paste a GitHub repo URL → Explore!

## LLM Model Routing

| Task | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Indexing | gemini-2.5-flash | gemini-2.5-flash-lite | llama-3.3-70b (Groq) |
| Synthesis | gemini-2.5-pro | gemini-2.5-flash | qwen3-32b (Groq) |
| Chat | gemini-2.5-flash | qwen3-32b (Groq) | llama-3.3-70b (Groq) |

## Architecture

```
Client → React App → Vite Proxy → FastAPI Backend
                                      ├── REST API (CRUD)
                                      ├── WebSocket (real-time chat/edits)
                                      ├── Gemini/Groq LLM Service
                                      └── SQLite Database
```

## License

MIT

# 🚀 CogniCode Deployment Guide: Step-by-Step

This guide provides the exact steps to deploy **CogniCode** to production using **Neon Postgres** (Database) and **Render** (Hosting) while ensuring the app remains stable.

---

## Phase 1: The Database (Neon.tech)
Since Render's free tier has ephemeral storage, we must use an external Postgres database to keep your repos and chat history safe.

1.  **Sign Up**: Go to [Neon.tech](https://neon.tech/) and create a free account.
2.  **Create Project**: Name it `CogniCode`.
3.  **Connection String**:
    *   In the Neon dashboard, find the **Connection Details**.
    *   Select **Pooled connection** (it usually starts with `postgres://...`).
    *   **CRITICAL**: Since our app uses `asyncpg`, you must change the prefix from `postgres://` or `postgresql://` to **`postgresql+asyncpg://`**.
    *   *Example:* `postgresql+asyncpg://alex:pass@ep-cool-darkness-123.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## Phase 2: Prepare for GitHub Deployment
Render works best by pulling directly from your GitHub repository.

1.  **Push to GitHub**: If you haven't already, push your `AWS_Hack` folder to a private or public GitHub repo.
    ```bash
    git init
    git add .
    git commit -m "Final CogniCode build for production"
    git remote add origin YOUR_GITHUB_REPO_URL
    git push -u origin main
    ```

---

## Phase 3: Deploy Backend (FastAPI) on Render
1.  **New Web Service**: In [Render](https://render.com/), click **New +** → **Web Service**.
2.  **Connect Repo**: Select your `CogniCode` repository.
3.  **Settings**:
    *   **Name**: `cognicode-backend`
    *   **Root Directory**: `backend`
    *   **Environment**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 10000`
4.  **Environment Variables**: Click **Advanced** and add:
    *   `DATABASE_URL`: *Your Neon connection string from Phase 1.*
    *   `GEMINI_API_KEY`: *Your Google API Key.*
    *   `GROQ_API_KEY`: *Your Groq API Key.*
    *   `GITHUB_PAT`: *Your GitHub Personal Access Token.*
    *   `JWT_SECRET`: *Generate a random string.*
    *   `CORS_ORIGINS`: `https://your-frontend-url.onrender.com` (Add this later once frontend is up).

---

## Phase 4: Deploy Frontend (React/Vite) on Render
1.  **New Static Site**: In Render, click **New +** → **Static Site**.
2.  **Settings**:
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
3.  **Redirects/Rewrites**:
    *   Since Vite uses a proxy locally, we need to handle the `/api` requests in production.
    *   Go to **Redirects/Rewrites** in the Render dashboard.
    *   **Add Rule**:
        *   **Source**: `/api/*`
        *   **Destination**: `https://cognicode-backend.onrender.com/api/*`
        *   **Action**: `Rewrite`

---

## Phase 5: Final Handshake
1.  Once the Frontend is deployed, grab its URL (e.g., `https://cognicode.onrender.com`).
2.  Go back to the **Backend Web Service** settings in Render.
3.  Update the `CORS_ORIGINS` environment variable with your actual frontend URL.
4.  Restart the backend service.

---

### ✅ Checklist for Success
*   [ ] Is `pgvector` enabled? (The code handles this automatically on startup).
*   [ ] Did I use `postgresql+asyncpg://` in the URL?
*   [ ] Is the Frontend rewrite rule pointing to the Backend URL?
*   [ ] Are all API keys in the Render environment variables?

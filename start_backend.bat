@echo off
echo ================================================
echo   CogniCode — Starting Backend
echo ================================================

cd /d "%~dp0backend"

if not exist ".env" (
    echo [ERROR] .env file not found. Copy .env.example and add your API keys.
    pause
    exit /b 1
)

if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [INFO] Installing dependencies...
pip install -r requirements.txt --quiet

echo [INFO] Starting FastAPI backend on http://localhost:8000
echo [INFO] API docs available at http://localhost:8000/docs
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

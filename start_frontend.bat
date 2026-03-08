@echo off
echo ================================================
echo   CogniCode — Starting Frontend
echo ================================================

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] Installing npm packages...
    npm install
)

echo [INFO] Starting Vite dev server on http://localhost:5173
npm run dev

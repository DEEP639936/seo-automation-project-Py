@echo off
chcp 65001 >nul
echo ========================================
echo   SEO Automation System - Launcher
echo ========================================
echo.

echo [1/4] Setting up Backend...
cd backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing backend dependencies...
pip install -q -r requirements.txt

if not exist .env (
    echo Creating .env from example...
    copy .env.example .env
)

echo [2/4] Starting Backend Server...
start "Backend Server" cmd /k "python run.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

cd ..
echo [3/4] Setting up Frontend...
cd frontend

if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo [4/4] Starting Frontend Dev Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo API Docs: http://localhost:5000/docs
echo.
echo Press any key to exit this window (servers will keep running)
pause >nul

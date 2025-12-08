@echo off
cd /d "%~dp0"
echo Starting Bio-Miner AI...
echo =========================

:: Start Backend in a new window
echo Starting Backend Server...
start "Bio-Miner Backend" cmd /k "cd backend && python main.py"

:: Wait a moment for backend to initialize
timeout /t 5 /nobreak >nul

:: Start Frontend in the current window (or you could use 'start' for a new window too)
echo Starting Frontend...
cd frontend
npm start

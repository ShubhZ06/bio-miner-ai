@echo off
echo ==========================================
echo       Starting Bio-Miner AI System
echo ==========================================

echo.
echo [1/2] Launching Backend Server...
cd /d "%~dp0backend"
start "Bio-Miner Backend" python main.py

echo.
echo [2/2] Launching Frontend Application...
cd /d "%~dp0frontend"
start "Bio-Miner Frontend" npm start

echo.
echo ==========================================
echo    System Started! Windows will open.
echo ==========================================
echo.
pause

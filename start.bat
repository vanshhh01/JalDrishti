@echo off
title JalDrishti Launcher
color 0B

echo ================================================================
echo       JalDrishti - Smart Water Intelligence System
echo ================================================================
echo.

:: Ensure working directory is the script folder
cd /d "%~dp0"

:: 1. Check Backend Dependencies
if not exist "backend\node_modules\" (
    echo [*] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo [OK] Backend dependencies installed.
)

:: 2. Check Frontend Dependencies
if not exist "frontend\node_modules\" (
    echo [*] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend dependencies installed.
)

echo.
echo [*] Starting Backend API Server (Port 5000)...
start "JalDrishti - Backend (Port 5000)" cmd /k "cd /d ""%~dp0backend"" && npm start"

echo [*] Starting Frontend Dev Server (Port 5173)...
start "JalDrishti - Frontend (Port 5173)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ================================================================
echo  Servers are starting in separate windows!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo ================================================================
echo.
echo Waiting 4 seconds before opening browser...
timeout /t 4 /nobreak >nul

echo [*] Opening JalDrishti web application in browser...
start http://localhost:5173

echo.
echo All services launched! You may close this window.
exit

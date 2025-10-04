@echo off
REM NASA Exoplanet Hunter - Windows Setup and Run Script
REM This script sets up dependencies and runs both backend and frontend

setlocal enabledelayedexpansion

echo.
echo ======================================================
echo 🚀 NASA Exoplanet Hunter - Setup and Launch Script
echo ======================================================
echo.

REM Set project paths
set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%"
set "FRONTEND_DIR=%PROJECT_DIR%frontend\exoplanet-ui"
set "VENV_DIR=%PROJECT_DIR%venv"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is available  
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ℹ️  Setting up Python backend...
cd /d "%BACKEND_DIR%"

REM Create virtual environment if it doesn't exist
if not exist "%VENV_DIR%" (
    echo ℹ️  Creating Python virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment
echo ℹ️  Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

REM Install dependencies
if exist "requirements_compatible.txt" (
    echo ℹ️  Installing Python dependencies from requirements_compatible.txt...
    pip install -r requirements_compatible.txt
) else if exist "requirements.txt" (
    echo ℹ️  Installing Python dependencies from requirements.txt...
    pip install -r requirements.txt
) else (
    echo ⚠️  No requirements file found, installing basic dependencies...
    pip install fastapi uvicorn pandas scikit-learn xgboost
)

echo ✅ Backend setup complete

echo ℹ️  Setting up React frontend...
cd /d "%FRONTEND_DIR%"

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo ℹ️  Installing frontend dependencies...
    npm install
    echo ✅ Frontend dependencies installed
) else (
    echo ℹ️  Checking for updated dependencies...
    npm install
    echo ✅ Frontend dependencies up to date
)

echo ✅ Frontend setup complete

REM Start backend server
echo ℹ️  Starting backend server...
cd /d "%BACKEND_DIR%"
call "%VENV_DIR%\Scripts\activate.bat"

echo ℹ️  Launching FastAPI server on http://localhost:8000
start /b python backend\main.py

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server  
echo ℹ️  Starting frontend development server...
cd /d "%FRONTEND_DIR%"

echo ℹ️  Launching React development server on http://localhost:5173
start /b npm run dev

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo 🎉 NASA Exoplanet Hunter is running!
echo.
echo 📊 Frontend Application: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000  
echo 📖 API Documentation: http://localhost:8000/docs
echo.
echo Press any key to stop all servers...
pause >nul

REM Cleanup (this won't work perfectly for background processes)
echo ℹ️  Shutting down servers...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo ✅ Cleanup complete

endlocal
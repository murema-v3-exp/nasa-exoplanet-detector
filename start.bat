@echo off
REM NASA Exoplanet Hunter - Windows Launch Script

echo ========================================
echo 🚀 NASA Exoplanet Hunter - Launcher
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 16+
    pause
    exit /b 1
)

echo ✅ Python and Node.js detected
echo.

REM Start backend
echo 🔧 Starting FastAPI Backend...
start "NASA Backend" cmd /k "uvicorn backend.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🔧 Starting React Frontend...
cd frontend\exoplanet-ui

REM Install dependencies if needed
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
)

start "NASA Frontend" cmd /k "npm run dev"
cd ..\..

echo.
echo ========================================
echo 🎉 NASA Exoplanet Hunter is ready!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo 📊 Available Models:
echo    • xgb - XGBoost (Kepler only, 87.1%% recall)
echo    • xgb_multi - XGBoost (Kepler + K2 + TESS, 88.9%% recall)
echo.
echo Press any key to open the application...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo ✨ Application opened in browser!
echo.
echo To stop services: Close the terminal windows
echo.
pause

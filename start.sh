#!/usr/bin/env bash
# NASA Exoplanet Hunter - Launch Script

echo "🚀 Starting NASA Exoplanet Hunter"
echo "=================================="

# Check if backend is already running
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Backend already running on http://localhost:8000"
else
    echo "🔧 Starting FastAPI backend..."
    cd "$(dirname "$0")"
    
    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Start backend in background
    uvicorn backend.main:app --reload --port 8000 > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID) - Logs: backend.log"
    sleep 3
fi

# Check if frontend is already running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend already running on http://localhost:5173"
else
    echo "🔧 Starting React frontend..."
    cd frontend/exoplanet-ui
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Start frontend in background
    npm run dev > ../../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID) - Logs: ../../frontend.log"
    cd ../..
fi

echo ""
echo "=================================="
echo "🎉 NASA Exoplanet Hunter is ready!"
echo "=================================="
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Available Models:"
echo "   • xgb - XGBoost (Kepler only)"
echo "   • xgb_multi - XGBoost (Kepler + K2 + TESS)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait

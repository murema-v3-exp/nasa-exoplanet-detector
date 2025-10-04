#!/bin/bash

# NASA Exoplanet Hunter - Complete Setup and Run Script
# This script sets up dependencies and runs both backend and frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project paths
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR"
FRONTEND_DIR="$PROJECT_DIR/frontend/exoplanet-ui"
VENV_DIR="$PROJECT_DIR/venv"

echo -e "${BLUE}🚀 NASA Exoplanet Hunter - Setup and Launch Script${NC}"
echo -e "${BLUE}===============================================${NC}"

# Function to print colored output
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup Python backend
setup_backend() {
    log_info "Setting up Python backend..."
    
    cd "$BACKEND_DIR"
    
    # Check if Python is available
    if ! command_exists python3 && ! command_exists python; then
        log_error "Python is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    # Use python3 if available, otherwise python
    PYTHON_CMD="python3"
    if ! command_exists python3; then
        PYTHON_CMD="python"
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Creating Python virtual environment..."
        $PYTHON_CMD -m venv venv
        log_success "Virtual environment created"
    else
        log_success "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    log_info "Activating virtual environment..."
    source "$VENV_DIR/bin/activate"
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    if [ -f "requirements_compatible.txt" ]; then
        log_info "Installing Python dependencies from requirements_compatible.txt..."
        pip install -r requirements_compatible.txt
    elif [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies from requirements.txt..."
        pip install -r requirements.txt
    else
        log_warning "No requirements file found, installing basic dependencies..."
        pip install fastapi uvicorn pandas scikit-learn xgboost
    fi
    
    log_success "Backend setup complete"
}

# Function to setup React frontend
setup_frontend() {
    log_info "Setting up React frontend..."
    
    # Check if Node.js is available
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check if npm is available
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
        log_success "Frontend dependencies installed"
    else
        log_info "Checking for updated dependencies..."
        npm install
        log_success "Frontend dependencies up to date"
    fi
    
    log_success "Frontend setup complete"
}

# Function to start backend server
start_backend() {
    log_info "Starting backend server..."
    
    cd "$BACKEND_DIR"
    source "$VENV_DIR/bin/activate"
    
    # Check if models exist
    if [ ! -d "models" ] || [ ! -f "models/xgb.pkl" ]; then
        log_warning "Model files not found. The API may not work properly."
        log_info "You may need to train the model first using scripts/train_xgb.py"
    fi
    
    # Start the backend server in background
    log_info "Launching FastAPI server on http://localhost:8000"
    # Set PYTHONPATH to include the project root so imports work correctly
    export PYTHONPATH="$PROJECT_DIR:$PYTHONPATH"
    python backend/main.py &
    BACKEND_PID=$!
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if backend is running
    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_success "Backend server started (PID: $BACKEND_PID)"
        echo "  📋 API Documentation: http://localhost:8000/docs"
        echo "  🏥 Health Check: http://localhost:8000/api/health"
    else
        log_error "Failed to start backend server"
        exit 1
    fi
}

# Function to start frontend server
start_frontend() {
    log_info "Starting frontend development server..."
    
    cd "$FRONTEND_DIR"
    
    # Start the frontend server in background
    log_info "Launching React development server on http://localhost:5173"
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if frontend is running
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_success "Frontend server started (PID: $FRONTEND_PID)"
        echo "  🌐 Application: http://localhost:5173"
    else
        log_error "Failed to start frontend server"
        exit 1
    fi
}

# Function to cleanup on exit
cleanup() {
    log_info "Shutting down servers..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_info "Backend server stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_info "Frontend server stopped"
    fi
    
    log_success "Cleanup complete"
}

# Function to wait for user interruption
wait_for_exit() {
    log_success "🎉 NASA Exoplanet Hunter is running!"
    echo ""
    echo -e "${GREEN}📊 Frontend Application: http://localhost:5173${NC}"
    echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}📖 API Documentation: http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
    echo ""
    
    # Wait for SIGINT (Ctrl+C)
    trap cleanup EXIT INT TERM
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Main execution
main() {
    log_info "Starting NASA Exoplanet Hunter setup..."
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Start servers
    start_backend
    start_frontend
    
    # Wait for user to stop
    wait_for_exit
}

# Check for help flag
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "NASA Exoplanet Hunter - Setup and Run Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "This script will:"
    echo "  1. Set up Python virtual environment (if needed)"
    echo "  2. Install Python dependencies (if needed)"
    echo "  3. Install Node.js dependencies (if needed)"
    echo "  4. Start the FastAPI backend server"
    echo "  5. Start the React frontend development server"
    echo ""
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Requirements:"
    echo "  - Python 3.8+"
    echo "  - Node.js 18+"
    echo "  - npm"
    echo ""
    echo "Servers will run on:"
    echo "  - Backend:  http://localhost:8000"
    echo "  - Frontend: http://localhost:5173"
    exit 0
fi

# Run main function
main
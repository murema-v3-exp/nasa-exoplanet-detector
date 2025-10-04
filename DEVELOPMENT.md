# NASA Exoplanet Hunter - Development Guide

## Quick Start

### Automatic Setup (Recommended)

The easiest way to get started is using the automated run script:

#### macOS/Linux:

```bash
./run.sh
```

#### Windows:

```batch
run.bat
```

This script will automatically:

1. ✅ Check for Python and Node.js dependencies
2. ✅ Create Python virtual environment (if needed)
3. ✅ Install Python packages (if needed)
4. ✅ Install Node.js packages (if needed)
5. ✅ Start the FastAPI backend server
6. ✅ Start the React frontend development server

### Manual Setup

If you prefer to set up components individually:

#### Backend Setup:

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements_compatible.txt

# Start backend server
python backend/main.py
```

#### Frontend Setup:

```bash
# Navigate to frontend directory
cd frontend/exoplanet-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

## Application URLs

Once running, access the application at:

-   **🌐 Frontend Application**: http://localhost:5173
-   **🔧 Backend API**: http://localhost:8000
-   **📖 API Documentation**: http://localhost:8000/docs
-   **🏥 Health Check**: http://localhost:8000/api/health

## Project Structure

```
nasa-exoplanet-detector/
├── 📁 backend/              # FastAPI backend server
│   ├── api/                 # API endpoints
│   ├── core/               # Core configuration
│   └── schemas/            # Pydantic models
├── 📁 frontend/            # React frontend application
│   └── exoplanet-ui/      # Vite + React + TypeScript
│       ├── src/
│       │   ├── components/ # React components
│       │   └── services/   # API service layer
│       └── package.json
├── 📁 data/               # Sample datasets (Kepler, K2, TESS)
├── 📁 models/             # Trained ML models
├── 📁 src/                # Core Python modules
└── 📁 scripts/            # Training and utility scripts
```

## Development Workflow

### 1. File Upload & Analysis

-   Upload CSV files in Kepler/K2/TESS format
-   Configure model settings (XGBoost, CNN, Ensemble)
-   Adjust classification threshold (0.0 - 1.0)

### 2. Real-time Predictions

-   Backend processes data using trained models
-   Results include probability scores and classifications
-   Summary statistics and performance metrics

### 3. 3D Visualization

-   Interactive 3D exoplanet system visualization
-   Orbital mechanics simulation
-   Temperature-based color coding
-   Planet detail information panels

## API Integration

The frontend communicates with the backend through:

### Health Check

```javascript
GET / api / health;
// Returns: server status, loaded models, uptime
```

### Predictions

```javascript
POST / api / predict;
// Body: FormData with file, model, threshold
// Returns: predictions array, summary stats, processing time
```

### Models

```javascript
GET / api / models;
// Returns: available ML models list
```

## Technology Stack

### Backend:

-   **FastAPI**: Modern Python web framework
-   **XGBoost**: Gradient boosting ML model
-   **Pandas**: Data manipulation and analysis
-   **Scikit-learn**: Machine learning utilities
-   **Uvicorn**: ASGI server implementation

### Frontend:

-   **React 19**: Modern UI framework
-   **TypeScript**: Type-safe JavaScript
-   **Vite**: Fast build tool and dev server
-   **Three.js**: 3D graphics and visualization
-   **@react-three/fiber**: React renderer for Three.js
-   **Lucide React**: Modern icon library

## Troubleshooting

### Common Issues:

#### "Command not found: python"

-   Install Python 3.8+ from python.org
-   On macOS: `brew install python`
-   On Ubuntu: `sudo apt install python3`

#### "Command not found: node"

-   Install Node.js 18+ from nodejs.org
-   On macOS: `brew install node`
-   On Ubuntu: `sudo apt install nodejs npm`

#### "Virtual environment not found"

-   Run the setup script: `./run.sh`
-   Or manually: `python3 -m venv venv`

#### "Module not found" errors

-   Ensure virtual environment is activated
-   Reinstall dependencies: `pip install -r requirements_compatible.txt`

#### Frontend won't start

-   Ensure Node.js 18+ is installed
-   Delete node_modules and reinstall: `rm -rf node_modules && npm install`

#### Backend API connection failed

-   Check if backend is running on port 8000
-   Verify firewall settings allow localhost:8000
-   Check backend logs for error messages

### Performance Tips:

1. **File Size**: Keep CSV files under 50MB for optimal performance
2. **Browser**: Use Chrome/Firefox for best 3D visualization performance
3. **Memory**: Ensure 4GB+ RAM available for large dataset processing
4. **Models**: XGBoost model provides best balance of speed and accuracy

## Development Commands

```bash
# Start full application
./run.sh

# Show help
./run.sh --help

# Backend only
cd backend && python main.py

# Frontend only
cd frontend/exoplanet-ui && npm run dev

# Run tests
python -m pytest test_*.py

# Format frontend code
cd frontend/exoplanet-ui && npm run lint
```

## Contributing

1. Follow the existing code structure
2. Add appropriate error handling
3. Update this guide for new features
4. Test both frontend and backend changes
5. Ensure API compatibility between versions

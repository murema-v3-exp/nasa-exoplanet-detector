# NASA Exoplanet Hunter 🌌🔭

[![NASA Space Apps 2025](https://img.shields.io/badge/NASA%20Space%20Apps-2025-blue)](https://www.spaceappschallenge.org/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI-powered exoplanet detection system** built for NASA Space Apps 2025 by
**Murema Manganyi**, **Thando**, and **Hlali**.

🎯 **Mission:** Help astronomers prioritize follow-up observations by
identifying the most promising exoplanet candidates from Kepler/K2/TESS mission
data using advanced machine learning and interactive 3D visualization.

**Status:** ✅ **Production Ready** - Full-stack React + FastAPI application
with 87% recall

---

## 🚀 Quick Start

### One-Click Setup & Launch

The easiest way to get started:

#### macOS/Linux:

```bash
# Clone the repository
git clone https://github.com/murema-v3-exp/nasa-exoplanet-detector.git
cd nasa-exoplanet-detector

# Run the automated setup script
./run.sh
```

#### Windows:

```batch
# Clone the repository
git clone https://github.com/murema-v3-exp/nasa-exoplanet-detector.git
cd nasa-exoplanet-detector

# Run the automated setup script
run.bat
```

That's it! The script will automatically:

-   ✅ Check system requirements (Python 3.8+, Node.js 18+)
-   ✅ Create Python virtual environment (if needed)
-   ✅ Install all dependencies (if needed)
-   ✅ Start the FastAPI backend server
-   ✅ Start the React frontend development server

### Access the Application

Once running, open your browser to:

-   **🌐 Main Application**: http://localhost:5173
-   **🔧 API Backend**: http://localhost:8000
-   **📖 API Documentation**: http://localhost:8000/docs

---

## ✨ Features

### 🖥️ Modern React Frontend

-   **3D Space Environment**: Immersive Three.js-powered interface
-   **Interactive File Upload**: Drag-and-drop CSV processing
-   **Manual Exoplanet Entry**: Create and visualize custom exoplanets with
    scientific parameters
-   **Real-time Analysis**: Live progress tracking and results
-   **3D Exoplanet Visualization**: Interactive orbital system simulations
-   **Advanced Results Dashboard**: Comprehensive prediction analytics
-   **Responsive Design**: Works on desktop and mobile devices

### 🚀 FastAPI Backend

-   **High-Performance API**: Fast predictions (~2s for 9K samples)
-   **Multiple ML Models**: XGBoost, CNN, and ensemble options
-   **Model Registry**: Auto-load and manage trained models
-   **Real-time Processing**: Streaming predictions with progress updates
-   **Health Monitoring**: Built-in health checks and metrics
-   **Interactive Documentation**: Auto-generated Swagger UI

### 🤖 Machine Learning Pipeline

-   **87.1% Recall**: High sensitivity for planet detection
-   **Feature Engineering**: Advanced signal processing techniques
-   **Data Preprocessing**: Robust cleaning and validation
-   **Model Validation**: Cross-validation and performance metrics
-   **Scalable Processing**: Handles large datasets efficiently

---

## 📊 Model Performance

| Metric        | Score | Description                             |
| ------------- | ----- | --------------------------------------- |
| **Recall**    | 87.1% | Successfully identifies true exoplanets |
| **Precision** | 81.8% | Minimizes false positive detections     |
| **ROC-AUC**   | 89.4% | Overall classification performance      |
| **F1 Score**  | 84.3% | Balanced precision and recall           |

---

## 🛠️ Technology Stack

### Frontend Architecture

-   **React 19**: Latest version with concurrent features
-   **TypeScript**: Full type safety and enhanced developer experience
-   **Vite**: Lightning-fast build tool and development server
-   **Three.js**: 3D graphics engine for space visualizations
-   **@react-three/fiber**: React renderer for Three.js
-   **@react-three/drei**: Helpful Three.js abstractions
-   **Lucide React**: Beautiful, customizable icons

### Backend Architecture

-   **FastAPI**: Modern, high-performance Python web framework
-   **XGBoost**: Gradient boosting machine learning model
-   **Pandas**: Data manipulation and analysis
-   **Scikit-learn**: Machine learning utilities and preprocessing
-   **Uvicorn**: Lightning-fast ASGI server
-   **Pydantic**: Data validation using Python type annotations

### Data Processing

-   **NASA Datasets**: Kepler, K2, and TESS mission data
-   **Feature Engineering**: Transit depth, period, radius calculations
-   **Data Validation**: Robust error handling and data cleaning
-   **Export Formats**: CSV, JSON with full metadata

---

## 📁 Project Structure

```
nasa-exoplanet-detector/
├── 🚀 run.sh                    # One-click setup script (macOS/Linux)
├── 🚀 run.bat                   # One-click setup script (Windows)
├── 📖 DEVELOPMENT.md            # Detailed development guide
│
├── 📁 backend/                   # FastAPI backend server
│   ├── api/                      # REST API endpoints
│   │   ├── predict.py           # Prediction endpoints
│   │   ├── models.py            # Model management
│   │   └── health.py            # Health checks
│   ├── core/                    # Core configuration
│   │   ├── config.py            # Application settings
│   │   └── model_registry.py    # ML model registry
│   ├── schemas/                 # Pydantic data models
│   └── main.py                  # FastAPI application entry
│
├── 📁 frontend/                  # React frontend application
│   └── exoplanet-ui/           # Vite + React + TypeScript
│       ├── src/
│       │   ├── components/      # React components
│       │   │   ├── SpaceScene.tsx        # 3D background
│       │   │   ├── FileUpload.tsx        # File upload interface
│       │   │   ├── PredictionResults.tsx # Results dashboard
│       │   │   └── ExoplanetVisualization.tsx # 3D planet view
│       │   ├── services/        # API service layer
│       │   │   └── api.ts       # Backend API integration
│       │   ├── App.tsx          # Main application component
│       │   └── main.tsx         # Application entry point
│       ├── package.json         # Frontend dependencies
│       └── vite.config.ts       # Build configuration
│
├── 📁 data/                     # Sample datasets
│   ├── Keppler.csv              # Kepler mission data
│   ├── K2.csv                   # K2 mission data
│   └── TESS.csv                 # TESS mission data
│
├── 📁 models/                   # Trained ML models
│   ├── xgb.pkl                  # XGBoost classifier
│   └── scaler.pkl               # Feature scaler
│
├── 📁 src/                      # Core Python modules
│   ├── preprocessing.py         # Data cleaning utilities
│   ├── features.py              # Feature engineering
│   └── scaling.py               # Data normalization
│
└── 📁 scripts/                  # Training and utility scripts
    ├── train_xgb.py             # Model training
    ├── cross_validate.py        # Model validation
    └── data_diagnostic.py       # Data quality checks
```

---

## 📈 Usage Guide

### 1. Upload Data

-   Drag and drop CSV files in Kepler/K2/TESS format
-   Supported formats: `.csv` files with standard astronomical columns
-   Maximum file size: 50MB for optimal performance

### 2. Configure Analysis

-   **Model Selection**: Choose between XGBoost, CNN, or ensemble models
-   **Threshold Adjustment**: Set classification threshold (0.0 - 1.0)
-   **Processing Options**: Configure advanced analysis parameters

### 3. View Results

-   **Summary Dashboard**: Overview of detections and statistics
-   **Detailed Results**: Individual predictions with confidence scores
-   **3D Visualization**: Interactive exoplanet system exploration
-   **Data Export**: Download results in CSV or JSON format

### 4. Explore Discoveries

-   **Interactive 3D View**: Navigate through detected exoplanet systems
-   **Planet Details**: Orbital characteristics, temperature, discovery info
-   **Comparative Analysis**: Compare multiple candidates side-by-side

---

## 🔧 Development

### System Requirements

-   **Python**: 3.8 or higher
-   **Node.js**: 18 or higher
-   **Memory**: 4GB RAM minimum (8GB recommended)
-   **Storage**: 2GB available space

### Manual Setup (Advanced)

If you prefer manual setup over the automated scripts:

#### Backend Development:

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements_compatible.txt

# Start backend server
python backend/main.py
```

#### Frontend Development:

```bash
# Navigate to frontend directory
cd frontend/exoplanet-ui

# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
./run.sh           # Start full application
./run.sh --help    # Show detailed help
npm run backend    # Backend only
npm run frontend   # Frontend only
npm test          # Run test suite
```

---

## 🧪 Testing

### API Testing

```bash
# Test all endpoints
python test_api.py

# Test specific functionality
python test_setup.py
```

### Dataset Validation

```bash
# Check data quality
python scripts/data_diagnostic.py

# Validate model performance
python scripts/cross_validate.py
```

---

## 📚 Documentation

-   **📖 [Development Guide](DEVELOPMENT.md)**: Detailed setup and contribution
    guide
-   **🔧 [API Documentation](http://localhost:8000/docs)**: Interactive Swagger
    UI (when running)
-   **📊 [Model Training](scripts/train_xgb.py)**: Machine learning pipeline
    documentation
-   **🎨 [Frontend Components](frontend/exoplanet-ui/src/components/)**: React
    component library

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**: Create your own fork on GitHub
2. **Clone & Setup**: Use the `./run.sh` script for quick setup
3. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
4. **Make Changes**: Follow existing code patterns and add tests
5. **Test Thoroughly**: Ensure both frontend and backend work correctly
6. **Submit Pull Request**: Describe your changes and impact

### Code Standards

-   **Python**: Follow PEP 8 guidelines
-   **TypeScript**: Use strict typing and ESLint rules
-   **Documentation**: Update relevant docs for new features
-   **Testing**: Add tests for new functionality

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

---

## 🙏 Acknowledgments

-   **NASA Space Apps Challenge 2025**: For the inspiring global hackathon
-   **NASA Kepler/K2/TESS Teams**: For providing the astronomical datasets
-   **Open Source Community**: For the amazing tools and libraries used
-   **Team Members**: Murema Manganyi, Thando, and Hlali for their dedication

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=murema-v3-exp/nasa-exoplanet-detector&type=Date)](https://star-history.com/#murema-v3-exp/nasa-exoplanet-detector&Date)

---

**Made with ❤️ for NASA Space Apps Challenge 2025**

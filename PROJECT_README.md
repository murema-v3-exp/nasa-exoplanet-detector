# 🌌 NASA Exoplanet Hunter

[![NASA Space Apps 2025](https://img.shields.io/badge/NASA-Space%20Apps%202025-blue)](https://www.spaceappschallenge.org/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange.svg)](https://xgboost.ai/)

**AI-Powered Exoplanet Detection System using NASA's Kepler, K2, and TESS Mission Data**

![NASA Exoplanet Hunter](https://img.shields.io/badge/Status-Competition%20Ready-success)

---

## 🚀 Quick Start

### **Option 1: Automated Launcher (Recommended)**

**Windows:**

```powershell
.\start.bat
```

**Linux/Mac:**

```bash
chmod +x start.sh
./start.sh
```

### **Option 2: Manual Launch**

**Terminal 1 - Backend:**

```bash
# Activate virtual environment (if using one)
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```bash
cd frontend/exoplanet-ui
npm install  # First time only
npm run dev
```

**Access Application:**

- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:8000
- 📚 API Documentation: http://localhost:8000/docs

---

## ✨ Features

### 🎯 Core Capabilities

- **Multi-Dataset Training** - Trained on 19,418 samples from Kepler, K2, and TESS missions
- **High Performance** - 88.9% recall, 93.2% precision on test set
- **Interactive 3D Visualization** - Three.js powered real-time rendering
- **REST API** - FastAPI backend with 6+ endpoints
- **Real-time Processing** - Upload CSV, get predictions in seconds
- **Model Comparison** - Switch between single-dataset and multi-dataset models

### 🎨 Frontend Features

- ✅ **Stunning 3D Space Environment** - Immersive Three.js background
- ✅ **Drag & Drop File Upload** - Support for Kepler/K2/TESS CSV formats
- ✅ **Interactive 3D Data Visualization** - Visualize predictions in 3D space
- ✅ **Real-time API Status** - Connection monitoring and health checks
- ✅ **Model Selection** - Choose between available ML models
- ✅ **Threshold Control** - Adjust classification threshold dynamically
- ✅ **Export Results** - Download predictions as CSV
- ✅ **Responsive Design** - Works on desktop and mobile

### ⚙️ Backend Features

- ✅ **Multi-Model Support** - Load multiple trained models
- ✅ **Automatic Feature Extraction** - 5 core features from raw data
- ✅ **Data Preprocessing** - Robust CSV parsing and cleaning
- ✅ **Feature Scaling** - RobustScaler for outlier handling
- ✅ **Performance Metrics** - Track accuracy, precision, recall, F1, ROC-AUC
- ✅ **Feature Importance** - Understand model decisions
- ✅ **CORS Enabled** - Ready for frontend integration

---

## 🏗️ Architecture

```
nasa-exoplanet-detector/
├── frontend/                    # React + TypeScript + Three.js
│   └── exoplanet-ui/
│       ├── src/
│       │   ├── components/      # React components
│       │   │   ├── FileUpload.tsx
│       │   │   ├── PredictionResults.tsx
│       │   │   ├── ExoplanetVisualization.tsx
│       │   │   └── SpaceScene.tsx
│       │   ├── services/        # API integration
│       │   │   └── api.ts
│       │   ├── App.tsx          # Main application
│       │   └── main.tsx
│       └── package.json
│
├── backend/                     # FastAPI Backend
│   ├── api/                     # API endpoints
│   │   ├── predict.py           # POST /api/predict
│   │   ├── models.py            # GET /api/models
│   │   └── health.py            # GET /api/health
│   ├── core/                    # Core modules
│   │   ├── config.py            # Configuration
│   │   └── model_registry.py   # Model loading/caching
│   ├── schemas/                 # Pydantic models
│   │   ├── prediction.py
│   │   └── response.py
│   └── main.py                  # FastAPI app
│
├── src/                         # ML Pipeline
│   ├── preprocessing.py         # Data cleaning
│   ├── features.py              # Feature extraction
│   └── scaling.py               # Feature scaling
│
├── scripts/                     # Training scripts
│   ├── train_xgb.py            # Single dataset training
│   ├── train_multi_dataset.py  # Multi-dataset training
│   └── cross_validate.py       # Cross-validation
│
├── models/                      # Trained models
│   ├── xgb.pkl                 # Kepler-only model
│   ├── xgb_multi.pkl           # Multi-dataset model
│   ├── scaler.pkl
│   └── scaler_multi.pkl
│
└── data/                        # NASA mission data
    ├── Keppler.csv             # Kepler Objects of Interest
    ├── K2.csv                  # K2 confirmed planets
    └── TESS.csv                # TESS Objects of Interest
```

---

## 🧠 Machine Learning

### Models

| Model         | Dataset            | Samples | Recall    | Precision | ROC-AUC   |
| ------------- | ------------------ | ------- | --------- | --------- | --------- |
| **xgb**       | Kepler             | 9,201   | 87.1%     | 81.8%     | 89.4%     |
| **xgb_multi** | Kepler + K2 + TESS | 19,418  | **88.9%** | **93.2%** | **92.1%** |

### Features Used

1. **Orbital Period** - Time for one complete orbit (days)
2. **Planet Radius** - Size relative to Earth radii
3. **Transit Duration** - Duration of light blocking (hours)
4. **Transit Depth** - Brightness decrease (parts per million)
5. **Stellar Temperature** - Host star temperature (Kelvin)

### Training Process

```bash
# Single dataset (Kepler only)
python scripts/train_xgb.py

# Multi-dataset (Kepler + K2 + TESS)
python scripts/train_multi_dataset.py

# Cross-validation
python scripts/cross_validate.py
```

---

## 🔌 API Reference

### **Health Check**

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "models_loaded": ["xgb", "xgb_multi"],
  "version": "1.0.0",
  "uptime_seconds": 3847.2
}
```

### **List Models**

```http
GET /api/models
```

**Response:**

```json
{
  "models": [
    {
      "id": "xgb",
      "name": "XGBoost Baseline",
      "dataset": "Kepler",
      "status": "ready"
    },
    {
      "id": "xgb_multi",
      "name": "XGBoost Multi-Dataset",
      "dataset": "Kepler + K2 + TESS",
      "status": "ready"
    }
  ]
}
```

### **Predict Exoplanets**

```http
POST /api/predict
Content-Type: multipart/form-data
```

**Parameters:**

- `file` (required) - CSV file with exoplanet data
- `model` (optional) - Model ID (default: "xgb")
- `threshold` (optional) - Classification threshold 0.0-1.0 (default: 0.5)

**Response:**

```json
{
  "success": true,
  "model_used": "xgb_multi",
  "threshold": 0.5,
  "total_samples": 1500,
  "predictions": [...],
  "summary": {
    "predicted_planets": 142,
    "false_positives": 1358,
    "mean_probability": 0.34,
    "high_confidence_count": 89
  },
  "processing_time_ms": 1847.3
}
```

### **Model Metrics**

```http
GET /api/models/{model_id}/metrics
```

### **Feature Importance**

```http
GET /api/models/{model_id}/importance
```

See [API_ENDPOINTS.md](frontend/API_ENDPOINTS.md) for complete documentation.

---

## 📊 Dataset Information

### Kepler Mission

- **Samples:** 9,564 (9,201 after preprocessing)
- **Planets:** 4,619
- **False Positives:** 4,582
- **Source:** NASA Exoplanet Archive

### K2 Mission

- **Samples:** 4,004 (3,127 after preprocessing)
- **All Confirmed Planets**
- **Extended Kepler Mission**

### TESS Mission

- **Samples:** 7,703 (7,090 after preprocessing)
- **All Confirmed Planets**
- **Ongoing Mission**

**Total Combined:** 19,418 samples from 3 NASA missions

---

## 🛠️ Tech Stack

### Frontend

- **React 19.1** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers
- **Lucide React** - Icons

### Backend

- **Python 3.8+**
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **XGBoost** - ML model
- **scikit-learn** - ML utilities
- **pandas** - Data manipulation
- **NumPy** - Numerical computing

---

## 📦 Installation

### Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **pip** - Python package manager
- **npm** - Node package manager

### Backend Setup

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install Python dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend/exoplanet-ui
npm install
```

---

## 🧪 Testing

### Backend Tests

```bash
# Test API endpoints
python test_api.py

# Test model predictions
python scripts/model_diagnostic.py
```

### Frontend Tests

```bash
cd frontend/exoplanet-ui
npm run lint
npm run build  # Production build test
```

---

## 🎯 NASA Space Apps Challenge Requirements

| Requirement            | Status | Implementation                      |
| ---------------------- | ------ | ----------------------------------- |
| Train on NASA datasets | ✅     | Kepler + K2 + TESS (19,418 samples) |
| Web interface          | ✅     | React + Three.js frontend           |
| Manual data entry      | ⚠️     | Planned for Phase B                 |
| Model statistics       | ✅     | Available via API and UI            |
| Hyperparameter tuning  | ⚠️     | Planned for Phase B                 |
| Online learning        | ⚠️     | Planned for Phase B                 |
| Support researchers    | ✅     | Detailed metrics and CSV export     |
| Support novices        | ✅     | Educational visualizations          |

**Status:** Competition-ready MVP with core features complete

---

## 🚀 Deployment

### Docker (Coming Soon)

```bash
docker-compose up
```

### Production Build

```bash
# Frontend
cd frontend/exoplanet-ui
npm run build
npm run preview

# Backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

---

## 📝 License

This project was developed for **NASA Space Apps Challenge 2025**.

---

## 👥 Team

- **Backend & ML:** [Your Name]
- **Frontend:** [Teammate Name]

---

## 🙏 Acknowledgments

- **NASA** - For Kepler, K2, and TESS mission data
- **NASA Exoplanet Archive** - Data source
- **NASA Space Apps Challenge** - Competition organizers

---

## 🌟 Future Enhancements

### Phase B (High Priority)

- [ ] Manual data entry form
- [ ] Hyperparameter tuning interface
- [ ] Online learning / model retraining
- [ ] Time-series flux visualization
- [ ] CNN model for lightcurve data
- [ ] Ensemble model (XGBoost + CNN)

### Phase C (Polish)

- [ ] Model comparison dashboard
- [ ] Confidence intervals
- [ ] Batch processing UI
- [ ] Docker deployment
- [ ] CI/CD pipeline

---

## 📞 Support

For questions or issues:

1. Check [API Documentation](http://localhost:8000/docs)
2. Review [Frontend API Guide](frontend/API_ENDPOINTS.md)
3. Open an issue on GitHub

---

<div align="center">
  <p>Made with ❤️ for NASA Space Apps Challenge 2025</p>
  <p>🌌 Discovering Exoplanets with AI 🚀</p>
</div>

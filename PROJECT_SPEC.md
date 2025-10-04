# NASA Exoplanet Hunter - Full Project Specification

**Project:** AI-powered Exoplanet Detection System  
**Challenge:** NASA Space Apps 2025 - "A World Away: Hunting for Exoplanets with AI"  
**Current Status:** MVP Complete (Streamlit) | Next Phase: Production React Frontend  
**Last Updated:** October 4, 2025

---

## 🎯 Project Overview

### Mission
Build a hybrid AI/ML system that identifies exoplanets from NASA mission data (Kepler, K2, TESS) with a professional web interface for researchers and enthusiasts.

### Success Criteria
- ✅ **Recall >80%** on real planets (ACHIEVED: 87.1%)
- ✅ **Web interface** for CSV upload and predictions (Streamlit MVP complete)
- ✅ **Downloadable results** with probability scores
- ✅ **Feature importance** and explainability
- 🚧 **Production React frontend** (IN PROGRESS - your teammate)

---

## 📊 Current Status: What's Built

### ✅ Backend (Python) - COMPLETE
- **Machine Learning Model:** XGBoost classifier (trained on 9,201 Kepler samples)
- **Performance Metrics:**
  - Recall: 87.1% (exceeds 80% target)
  - Precision: 81.8%
  - ROC-AUC: 89.4%
  - Validated across 5-fold CV
- **Feature Engineering:** Robust pipeline handling column name variations
- **Scaling:** RobustScaler fitted and saved
- **Model Artifacts:** All saved to `models/` directory

### ✅ Streamlit MVP - COMPLETE
- File upload (CSV)
- Real-time predictions with adjustable threshold
- Probability visualizations
- Feature importance charts
- Clean CSV downloads
- Running at http://localhost:8502

### 🚧 Production Frontend - IN PROGRESS
- React + FastAPI architecture (recommended)
- Modern UI with D3.js visualizations
- Multi-model support (XGBoost, CNN, ensemble)
- Real-time threshold tuning

---

## 🏗️ System Architecture

### Current (MVP)
```
┌─────────────────────────────────────┐
│     Streamlit Web App (Python)      │
│  - File upload                      │
│  - Preprocessing                    │
│  - Model inference                  │
│  - Visualization                    │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│      Models & Artifacts             │
│  - xgb.pkl (XGBoost model)          │
│  - scaler.pkl (feature scaler)      │
│  - cv_predictions.csv (validation)  │
└─────────────────────────────────────┘
```

### Target (Production)
```
┌─────────────────────────────────────────────────┐
│         React Frontend (TypeScript)              │
│  - Material-UI / Tailwind components            │
│  - D3.js / Recharts visualizations              │
│  - File upload with drag-drop                   │
│  - Real-time threshold slider                   │
│  - Model selector (XGBoost / CNN / Ensemble)    │
└────────────────────┬────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────┴────────────────────────────┐
│         FastAPI Backend (Python)                │
│  - POST /api/predict                            │
│  - GET /api/models/{model}/metrics              │
│  - GET /api/models/{model}/importance           │
│  - WebSocket /ws/predict (streaming)            │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────┐
│      ML Pipeline (Python)                       │
│  - src/preprocessing.py                         │
│  - src/features.py                              │
│  - src/scaling.py                               │
│  - Model registry (XGBoost, CNN, Ensemble)      │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────┐
│      Models & Data                              │
│  - models/xgb.pkl                               │
│  - models/scaler.pkl                            │
│  - models/cnn.h5 (future)                       │
│  - data/Keppler.csv, K2.csv, TESS.csv           │
└─────────────────────────────────────────────────┘
```

---

## 📡 API Specification (Backend Contract)

### Base URL
```
Development: http://localhost:8000/api
Production:  https://api.exoplanet-hunter.space/api
```

### Endpoints

#### 1. **Predict Exoplanets**
```http
POST /api/predict
Content-Type: multipart/form-data

Body:
- file: CSV file (Kepler/K2/TESS format)
- model: string (optional, default: "xgb") ["xgb", "cnn", "ensemble"]
- threshold: float (optional, default: 0.5) [0.0 - 1.0]

Response: 200 OK
{
  "success": true,
  "model_used": "xgb",
  "threshold": 0.5,
  "total_samples": 9201,
  "predictions": [
    {
      "id": "K00752.01",
      "prediction": "PLANET",
      "probability": 0.892,
      "features": {
        "orbital_period": 2.204735,
        "planet_radius": 1.96,
        "transit_duration": 2.538
      }
    },
    ...
  ],
  "summary": {
    "predicted_planets": 4918,
    "false_positives": 4283,
    "mean_probability": 0.503,
    "high_confidence_count": 4040
  },
  "processing_time_ms": 234
}
```

#### 2. **Get Model Metrics**
```http
GET /api/models/{model_name}/metrics

Response: 200 OK
{
  "model": "xgb",
  "performance": {
    "accuracy": 0.8217,
    "precision": 0.8018,
    "recall": 0.8567,
    "f1_score": 0.8282,
    "roc_auc": 0.8937
  },
  "cross_validation": {
    "n_folds": 5,
    "mean_recall": 0.8567,
    "std_recall": 0.0187
  },
  "training_date": "2025-10-04T17:32:57Z",
  "training_samples": 9201
}
```

#### 3. **Get Feature Importance**
```http
GET /api/models/{model_name}/importance

Response: 200 OK
{
  "model": "xgb",
  "features": [
    {
      "name": "planet_radius",
      "importance": 0.532,
      "rank": 1
    },
    {
      "name": "orbital_period",
      "importance": 0.285,
      "rank": 2
    },
    {
      "name": "transit_duration",
      "importance": 0.183,
      "rank": 3
    }
  ]
}
```

#### 4. **Get Available Models**
```http
GET /api/models

Response: 200 OK
{
  "models": [
    {
      "id": "xgb",
      "name": "XGBoost Baseline",
      "type": "gradient_boosting",
      "status": "ready",
      "performance": {
        "recall": 0.8567,
        "roc_auc": 0.8937
      }
    },
    {
      "id": "cnn",
      "name": "1D CNN (Time-Series)",
      "type": "deep_learning",
      "status": "pending",
      "note": "Requires time-series flux data"
    },
    {
      "id": "ensemble",
      "name": "Ensemble (XGB + CNN)",
      "type": "ensemble",
      "status": "pending",
      "note": "Requires CNN training"
    }
  ]
}
```

#### 5. **Download Results**
```http
POST /api/export
Content-Type: application/json

Body:
{
  "predictions": [...],  // Array from /predict response
  "format": "csv",       // "csv" or "json"
  "mode": "clean"        // "clean" or "full"
}

Response: 200 OK
Content-Type: text/csv or application/json
Content-Disposition: attachment; filename="predictions.csv"

(File download)
```

#### 6. **Health Check**
```http
GET /api/health

Response: 200 OK
{
  "status": "healthy",
  "models_loaded": ["xgb"],
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

---

## 🎨 Frontend Specification

### Tech Stack (Recommended)
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS or Material-UI (MUI)
- **Charts:** Recharts or D3.js
- **State:** React Query (for API calls) + Zustand (for UI state)
- **File Upload:** react-dropzone
- **Routing:** React Router v6
- **Build:** Vite

### Pages / Routes

#### 1. **Home / Upload** (`/`)
```tsx
Features:
- Hero section with project description
- Drag-drop file upload zone
- Sample data download link
- "Get Started" CTA

Components:
<Hero />
<FileUploadZone onUpload={handleUpload} />
<SampleDataCard />
<FeaturesOverview />
```

#### 2. **Predict** (`/predict`)
```tsx
Features:
- File upload confirmation
- Model selector dropdown (XGBoost, CNN, Ensemble)
- Threshold slider (0.0 - 1.0 with real-time preview)
- "Run Prediction" button
- Loading state with progress indicator

Components:
<FilePreview file={uploadedFile} />
<ModelSelector models={availableModels} />
<ThresholdSlider value={threshold} onChange={setThreshold} />
<PredictButton loading={isPredicting} />
```

#### 3. **Results** (`/results`)
```tsx
Features:
- Summary cards (planets found, false positives, mean prob, high conf)
- Probability distribution histogram (with threshold line)
- Feature importance bar chart
- Predictions table (paginated, sortable, filterable)
- Download buttons (clean CSV, full CSV, JSON)
- "Run Another Prediction" button

Components:
<SummaryCards data={summary} />
<ProbabilityHistogram data={probabilities} threshold={threshold} />
<FeatureImportanceChart data={importance} />
<PredictionsTable data={predictions} />
<ExportButtons onExport={handleExport} />
```

#### 4. **Model Info** (`/models`)
```tsx
Features:
- List of available models with performance metrics
- Training details (date, samples, CV results)
- Model comparison table
- Download model card (PDF)

Components:
<ModelCard model={xgbModel} />
<PerformanceMetrics metrics={cvMetrics} />
<ModelComparison models={allModels} />
```

#### 5. **About** (`/about`)
```tsx
Features:
- Project description
- Team members
- NASA Space Apps context
- Dataset information (Kepler, K2, TESS)
- Links to GitHub, docs, paper (if any)

Components:
<ProjectDescription />
<TeamSection />
<DatasetInfo />
<References />
```

### Key UI Components

#### `<FileUploadZone />`
```tsx
interface FileUploadZoneProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

// Drag-drop + click to upload
// Show file preview after upload
// Validation for CSV format
```

#### `<ThresholdSlider />`
```tsx
interface ThresholdSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

// Shows recall/precision trade-off dynamically
// Color-coded zones: green (0.4-0.5), yellow (0.3-0.4, 0.5-0.6), red (<0.3, >0.6)
// Tooltip with explanation
```

#### `<ProbabilityHistogram />`
```tsx
interface ProbabilityHistogramProps {
  data: number[];  // Array of probabilities
  threshold: number;
  bins?: number;
}

// D3.js or Recharts histogram
// Vertical line showing current threshold
// Click bar to filter predictions table
```

#### `<FeatureImportanceChart />`
```tsx
interface FeatureImportanceChartProps {
  data: Array<{ name: string; importance: number }>;
  topN?: number;
}

// Horizontal bar chart
// Sorted by importance (descending)
// Tooltips with feature descriptions
```

#### `<PredictionsTable />`
```tsx
interface PredictionsTableProps {
  data: Prediction[];
  onSort?: (column: string) => void;
  onFilter?: (filters: Filters) => void;
  pageSize?: number;
}

// Columns: ID, Prediction, Probability, Key Features
// Sortable by any column
// Filterable: All / Planets / False Positives / High Confidence
// Export selected rows
```

---

## 📂 Repository Structure

```
nasa-exoplanet-detector/
├── README.md                           # Setup & usage guide
├── requirements.txt                    # Python dependencies
├── .gitignore                          # Git ignore patterns
├── LICENSE                             # MIT/Apache license
│
├── backend/                            # FastAPI backend (NEW)
│   ├── main.py                         # FastAPI app entry
│   ├── api/
│   │   ├── __init__.py
│   │   ├── predict.py                  # Prediction endpoints
│   │   ├── models.py                   # Model info endpoints
│   │   └── health.py                   # Health check
│   ├── core/
│   │   ├── config.py                   # App configuration
│   │   └── model_registry.py          # Model loading & caching
│   ├── schemas/
│   │   ├── prediction.py               # Pydantic models
│   │   └── response.py
│   └── tests/
│       └── test_api.py
│
├── frontend/                           # React frontend (NEW)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUploadZone.tsx
│   │   │   ├── ThresholdSlider.tsx
│   │   │   ├── ProbabilityHistogram.tsx
│   │   │   ├── FeatureImportanceChart.tsx
│   │   │   └── PredictionsTable.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── PredictPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── ModelsPage.tsx
│   │   │   └── AboutPage.tsx
│   │   ├── hooks/
│   │   │   ├── usePredict.ts
│   │   │   ├── useModels.ts
│   │   │   └── useExport.ts
│   │   ├── services/
│   │   │   └── api.ts                  # API client
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── src/                                # ML pipeline (EXISTING)
│   ├── preprocessing.py                # CSV loading & cleaning
│   ├── features.py                     # Feature extraction
│   ├── scaling.py                      # Feature scaling
│   ├── train_xgb.py                    # XGBoost training
│   ├── cross_validate.py               # 5-fold CV
│   ├── data_diagnostic.py              # Data quality checks
│   ├── model_diagnostic.py             # Model diagnostics
│   ├── ml_model.py                     # Classical ML utils
│   ├── cnn_model.py                    # CNN architecture (future)
│   └── ensemble.py                     # Ensemble logic (future)
│
├── models/                             # Trained models (EXISTING)
│   ├── xgb.pkl                         # XGBoost model
│   ├── scaler.pkl                      # RobustScaler
│   ├── cv_fold_metrics.csv             # CV results
│   └── cv_predictions.csv              # CV predictions
│
├── data/                               # Datasets (EXISTING)
│   ├── Keppler.csv                     # Kepler catalog (9,564 rows)
│   ├── K2.csv                          # K2 mission data
│   └── TESS.csv                        # TESS mission data
│
├── notebooks/                          # Jupyter notebooks (optional)
│   ├── EDA.ipynb                       # Exploratory data analysis
│   └── Model_Experiments.ipynb         # Model tuning experiments
│
├── docs/                               # Documentation
│   ├── PROJECT_SPEC.md                 # This file
│   ├── API_DOCS.md                     # API reference
│   ├── DEPLOYMENT.md                   # Deployment guide
│   ├── IMPLEMENTATION_SUMMARY.md       # Progress summary
│   ├── PREPROCESSING_ASSESSMENT.md     # Data quality report
│   ├── QUICK_REFERENCE.md              # Quick start
│   └── IMPROVEMENTS.md                 # Future improvements
│
├── app.py                              # Streamlit MVP (legacy)
├── app_enhanced.py                     # Enhanced Streamlit (current)
│
└── scripts/                            # Utility scripts
    ├── setup.sh                        # Initial setup
    ├── train.sh                        # Train all models
    └── deploy.sh                       # Deploy to production
```

---

## 🚀 Current Progress Summary

### ✅ Phase 1: MVP Backend (COMPLETE)
- [x] Data preprocessing pipeline
- [x] Feature engineering with robust column mapping
- [x] XGBoost baseline model training
- [x] 5-fold cross-validation (87.1% recall)
- [x] Feature scaling (RobustScaler)
- [x] Model diagnostics and evaluation
- [x] Model artifacts saved (xgb.pkl, scaler.pkl)

### ✅ Phase 2: Streamlit Demo (COMPLETE)
- [x] File upload interface
- [x] Real-time predictions
- [x] Threshold slider
- [x] Probability visualizations
- [x] Feature importance charts
- [x] Clean CSV downloads
- [x] Contextual help messages

### 🚧 Phase 3: Production Backend (IN PROGRESS)
- [ ] FastAPI server setup
- [ ] REST API endpoints
- [ ] Model registry & caching
- [ ] Request validation (Pydantic)
- [ ] Error handling & logging
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Docker containerization

### 🚧 Phase 4: React Frontend (IN PROGRESS - YOUR TEAMMATE)
- [ ] Project scaffolding (Vite + React + TS)
- [ ] Component library setup (MUI/Tailwind)
- [ ] API client integration
- [ ] File upload flow
- [ ] Prediction workflow
- [ ] Results visualization
- [ ] Model comparison page
- [ ] Responsive design
- [ ] E2E tests (Playwright/Cypress)

### 📋 Phase 5: Integration & Deployment (PENDING)
- [ ] Connect frontend ↔ backend
- [ ] Environment configuration
- [ ] CORS setup
- [ ] SSL/HTTPS
- [ ] Deploy backend (AWS/GCP/Azure)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring & logging

---

## 🔧 Development Setup

### Backend Prerequisites
```bash
# Python 3.10+
python --version

# Install dependencies
pip install -r requirements.txt

# Verify models are present
ls models/
# Should see: xgb.pkl, scaler.pkl

# Test current Streamlit MVP
streamlit run app_enhanced.py
# Opens at http://localhost:8502
```

### Backend FastAPI (NEW - to implement)
```bash
# Install FastAPI dependencies
pip install fastapi uvicorn python-multipart

# Run development server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# API docs at http://localhost:8000/docs
```

### Frontend Setup (NEW - your teammate)
```bash
# Node.js 18+
node --version

# Create React project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install
npm install @tanstack/react-query zustand react-router-dom
npm install recharts  # or d3
npm install react-dropzone
npm install axios

# Material-UI (optional)
npm install @mui/material @emotion/react @emotion/styled

# Tailwind (optional)
npm install -D tailwindcss postcss autoprefixer

# Run development server
npm run dev
# Opens at http://localhost:5173
```

---

## 🧪 Testing Strategy

### Backend Tests
```python
# tests/test_predict.py
def test_predict_endpoint():
    response = client.post("/api/predict", files={"file": kepler_csv})
    assert response.status_code == 200
    assert "predictions" in response.json()
    assert response.json()["summary"]["predicted_planets"] > 0

def test_model_metrics():
    response = client.get("/api/models/xgb/metrics")
    assert response.json()["performance"]["recall"] > 0.8
```

### Frontend Tests
```typescript
// components/__tests__/FileUploadZone.test.tsx
describe("FileUploadZone", () => {
  it("accepts CSV files", () => {
    render(<FileUploadZone onUpload={mockUpload} />);
    const file = new File(["data"], "test.csv", { type: "text/csv" });
    // ... test drag-drop
  });
});
```

---

## 📦 Deployment Checklist

### Backend
- [ ] Environment variables configured (API keys, DB URLs)
- [ ] Models uploaded to cloud storage or bundled
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Logging & monitoring setup (Sentry, Datadog)
- [ ] Health check endpoint active
- [ ] SSL certificate installed

### Frontend
- [ ] Environment variables for API base URL
- [ ] Production build optimized (`npm run build`)
- [ ] Assets compressed (images, bundles)
- [ ] CDN configured for static assets
- [ ] Analytics installed (Google Analytics, Plausible)
- [ ] Error tracking (Sentry)
- [ ] SEO meta tags configured

---

## 🎯 Key Metrics to Track

### Model Performance
- Recall (target: >80%, current: 87.1%)
- Precision (current: 81.8%)
- ROC-AUC (current: 89.4%)
- Inference time (<500ms per 1000 samples)

### API Performance
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate (<1%)
- Uptime (>99.9%)

### User Experience
- Time to first prediction (<5 seconds)
- File upload success rate (>95%)
- Visualization load time (<2 seconds)
- Mobile responsiveness (all breakpoints)

---

## 📚 Resources for Your Teammate

### Design Inspiration
- **NASA Open Data Portal:** https://data.nasa.gov/
- **Kepler Mission Site:** https://www.nasa.gov/kepler
- **Exoplanet Archive:** https://exoplanetarchive.ipac.caltech.edu/

### Similar UIs (for inspiration)
- NASA Eyes: https://eyes.nasa.gov/
- TensorFlow Playground: https://playground.tensorflow.org/
- Kaggle Notebooks: https://www.kaggle.com/notebooks

### Tech Stack Docs
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- React Query: https://tanstack.com/query
- Recharts: https://recharts.org/
- Material-UI: https://mui.com/

---

## 🤝 Collaboration Workflow

### Git Workflow
```bash
# Main branch: stable releases
main

# Development branch: active work
develop

# Feature branches: individual features
feature/api-predict-endpoint
feature/ui-file-upload
feature/ui-results-page

# Your teammate should:
git checkout develop
git pull origin develop
git checkout -feature/ui-homepage
# ... make changes
git add .
git commit -m "feat(ui): add homepage hero section"
git push origin feature/ui-homepage
# Create PR to develop
```

### Communication
- **API Contract:** Use this spec as the contract between frontend/backend
- **Mock Data:** I'll provide sample API responses for frontend development
- **Issues:** Use GitHub Issues for bugs/features
- **PRs:** Review each other's code before merging

---

## 🚦 Next Steps

### For You (Backend)
1. Push current code to GitHub
2. Create FastAPI skeleton in `backend/`
3. Implement `/api/predict` endpoint
4. Test with Postman/curl
5. Share API docs with teammate

### For Your Teammate (Frontend)
1. Clone repo after push
2. Set up React project in `frontend/`
3. Build HomePage with file upload
4. Mock API responses for development
5. Integrate with real API once ready

### Together
1. Agree on API contract (this spec)
2. Set up CORS for local development
3. Test end-to-end flow
4. Deploy to staging
5. Present at NASA Space Apps!

---

## 📞 Support & Questions

If your teammate has questions:
1. Refer to this spec first
2. Check `QUICK_REFERENCE.md` for commands
3. See `API_DOCS.md` for detailed endpoint docs
4. Review Streamlit code (`app_enhanced.py`) for logic reference

**The Streamlit app is a working reference implementation!**  
Your teammate can see how all the pieces fit together by running it.

---

**Ready to build something amazing!** 🚀🪐

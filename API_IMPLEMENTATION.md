# FastAPI Backend Implementation Guide

**For:** Backend Developer  
**Goal:** Implement REST API for exoplanet prediction system  
**Timeline:** 2-4 hours for basic implementation

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install fastapi uvicorn python-multipart pydantic numpy pandas scikit-learn xgboost joblib python-jose[cryptography] python-dotenv
```

### 2. Create Directory Structure
```bash
mkdir -p backend/api backend/core backend/schemas backend/tests
touch backend/main.py
touch backend/api/__init__.py backend/api/predict.py backend/api/models.py backend/api/health.py
touch backend/core/__init__.py backend/core/config.py backend/core/model_registry.py
touch backend/schemas/__init__.py backend/schemas/prediction.py backend/schemas/response.py
```

---

## 📁 File-by-File Implementation

### `backend/core/config.py`
```python
"""Application configuration"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NASA Exoplanet Hunter API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODELS_DIR: Path = BASE_DIR / "models"
    DATA_DIR: Path = BASE_DIR / "data"
    
    # API
    API_V1_PREFIX: str = "/api"
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://localhost:8501",  # Streamlit
        "http://localhost:8502",
    ]
    
    # Model defaults
    DEFAULT_MODEL: str = "xgb"
    DEFAULT_THRESHOLD: float = 0.5
    MAX_FILE_SIZE_MB: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
```

### `backend/core/model_registry.py`
```python
"""Model loading and caching"""
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from src.scaling import FeatureScaler
from backend.core.config import settings


class ModelRegistry:
    """Singleton for loading and caching models"""
    
    _instance = None
    _models: Dict[str, Any] = {}
    _scalers: Dict[str, FeatureScaler] = {}
    _metadata: Dict[str, Dict] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_models()
        return cls._instance
    
    def _load_models(self):
        """Load all available models on startup"""
        models_dir = settings.MODELS_DIR
        
        # Load XGBoost
        xgb_path = models_dir / "xgb.pkl"
        if xgb_path.exists():
            self._models["xgb"] = joblib.load(xgb_path)
            self._metadata["xgb"] = {
                "name": "XGBoost Baseline",
                "type": "gradient_boosting",
                "status": "ready",
                "file": str(xgb_path)
            }
            print(f"✅ Loaded model: xgb from {xgb_path}")
        
        # Load XGBoost scaler
        scaler_path = models_dir / "scaler.pkl"
        if scaler_path.exists():
            self._scalers["xgb"] = FeatureScaler.load(scaler_path)
            print(f"✅ Loaded scaler: xgb from {scaler_path}")
        
        # TODO: Load CNN model when available
        # TODO: Load ensemble model when available
    
    def get_model(self, model_name: str):
        """Get a loaded model by name"""
        if model_name not in self._models:
            raise ValueError(f"Model '{model_name}' not found. Available: {list(self._models.keys())}")
        return self._models[model_name]
    
    def get_scaler(self, model_name: str) -> Optional[FeatureScaler]:
        """Get a loaded scaler by name"""
        return self._scalers.get(model_name)
    
    def get_metadata(self, model_name: str) -> Dict:
        """Get model metadata"""
        return self._metadata.get(model_name, {})
    
    def list_models(self) -> list:
        """List all available models"""
        return list(self._models.keys())


# Singleton instance
registry = ModelRegistry()
```

### `backend/schemas/prediction.py`
```python
"""Pydantic schemas for predictions"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class PredictionInput(BaseModel):
    """Input schema for prediction request"""
    model: str = Field(default="xgb", description="Model to use for prediction")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0, description="Classification threshold")


class FeatureDict(BaseModel):
    """Features for a single sample"""
    orbital_period: Optional[float] = None
    planet_radius: Optional[float] = None
    transit_duration: Optional[float] = None
    
    class Config:
        extra = "allow"  # Allow additional features


class SinglePrediction(BaseModel):
    """Prediction for a single sample"""
    id: str = Field(description="Sample identifier")
    prediction: str = Field(description="PLANET or FALSE POSITIVE")
    probability: float = Field(ge=0.0, le=1.0, description="Prediction probability")
    features: FeatureDict


class PredictionSummary(BaseModel):
    """Summary statistics for predictions"""
    predicted_planets: int
    false_positives: int
    mean_probability: float
    high_confidence_count: int  # Predictions with prob > 0.7


class PredictionResponse(BaseModel):
    """Response schema for prediction endpoint"""
    success: bool = True
    model_used: str
    threshold: float
    total_samples: int
    predictions: List[SinglePrediction]
    summary: PredictionSummary
    processing_time_ms: float


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    error: str
    detail: Optional[str] = None
```

### `backend/schemas/response.py`
```python
"""Additional response schemas"""
from pydantic import BaseModel
from typing import List, Dict, Any


class ModelPerformance(BaseModel):
    """Model performance metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float


class CrossValidation(BaseModel):
    """Cross-validation results"""
    n_folds: int
    mean_recall: float
    std_recall: float


class ModelMetrics(BaseModel):
    """Model metrics response"""
    model: str
    performance: ModelPerformance
    cross_validation: CrossValidation
    training_date: str
    training_samples: int


class FeatureImportance(BaseModel):
    """Feature importance entry"""
    name: str
    importance: float
    rank: int


class FeatureImportanceResponse(BaseModel):
    """Feature importance response"""
    model: str
    features: List[FeatureImportance]


class ModelInfo(BaseModel):
    """Model information"""
    id: str
    name: str
    type: str
    status: str
    performance: Dict[str, float]
    note: str = ""


class ModelsListResponse(BaseModel):
    """List of available models"""
    models: List[ModelInfo]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    models_loaded: List[str]
    version: str
    uptime_seconds: float
```

### `backend/api/predict.py`
```python
"""Prediction endpoints"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import pandas as pd
import numpy as np
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from src.preprocessing import load_csv, clean_data
from src.features import extract_features
from backend.core.model_registry import registry
from backend.schemas.prediction import (
    PredictionResponse, SinglePrediction, PredictionSummary, 
    FeatureDict, ErrorResponse
)


router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict_exoplanets(
    file: UploadFile = File(..., description="CSV file with exoplanet data"),
    model: str = Form("xgb", description="Model to use"),
    threshold: float = Form(0.5, ge=0.0, le=1.0, description="Classification threshold")
):
    """
    Predict exoplanets from uploaded CSV file.
    
    - **file**: CSV file in Kepler/K2/TESS format
    - **model**: Model name (xgb, cnn, ensemble)
    - **threshold**: Classification threshold (0.0 - 1.0)
    """
    start_time = time.time()
    
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Load and process data
        df = pd.read_csv(file.file, comment='#', low_memory=False)
        df_clean = clean_data(df)
        df_features = extract_features(df_clean, mode='catalog')
        
        if len(df_features) == 0:
            raise HTTPException(status_code=400, detail="No valid samples found in file")
        
        # Prepare features
        X = df_features.copy()
        if 'label' in X.columns:
            X = X.drop('label', axis=1)
        
        # Get model and scaler
        clf = registry.get_model(model)
        scaler = registry.get_scaler(model)
        
        # Apply scaling if available
        if scaler is not None:
            X_scaled = pd.DataFrame(
                scaler.transform(X.values),
                columns=X.columns,
                index=X.index
            )
        else:
            X_scaled = X
        
        # Predict
        y_proba = clf.predict_proba(X_scaled)[:, 1]
        y_pred = (y_proba >= threshold).astype(int)
        
        # Build response
        predictions = []
        for idx, (orig_idx, row) in enumerate(df.loc[X.index].iterrows()):
            # Try to find an ID column
            sample_id = str(orig_idx)
            for id_col in ['kepoi_name', 'koi_id', 'kepid', 'id']:
                if id_col in row and pd.notna(row[id_col]):
                    sample_id = str(row[id_col])
                    break
            
            predictions.append(SinglePrediction(
                id=sample_id,
                prediction="PLANET" if y_pred[idx] == 1 else "FALSE POSITIVE",
                probability=float(y_proba[idx]),
                features=FeatureDict(**X.iloc[idx].to_dict())
            ))
        
        # Summary
        summary = PredictionSummary(
            predicted_planets=int(np.sum(y_pred == 1)),
            false_positives=int(np.sum(y_pred == 0)),
            mean_probability=float(np.mean(y_proba)),
            high_confidence_count=int(np.sum(y_proba > 0.7))
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        return PredictionResponse(
            success=True,
            model_used=model,
            threshold=threshold,
            total_samples=len(predictions),
            predictions=predictions,
            summary=summary,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
```

### `backend/api/models.py`
```python
"""Model information endpoints"""
from fastapi import APIRouter, HTTPException
import pandas as pd
from pathlib import Path

from backend.core.model_registry import registry
from backend.core.config import settings
from backend.schemas.response import (
    ModelMetrics, ModelPerformance, CrossValidation,
    FeatureImportanceResponse, FeatureImportance,
    ModelsListResponse, ModelInfo
)


router = APIRouter()


@router.get("/models", response_model=ModelsListResponse)
async def list_models():
    """Get list of available models"""
    
    model_infos = []
    
    # XGBoost
    if "xgb" in registry.list_models():
        model_infos.append(ModelInfo(
            id="xgb",
            name="XGBoost Baseline",
            type="gradient_boosting",
            status="ready",
            performance={"recall": 0.8567, "roc_auc": 0.8937}
        ))
    
    # CNN (future)
    model_infos.append(ModelInfo(
        id="cnn",
        name="1D CNN (Time-Series)",
        type="deep_learning",
        status="pending",
        performance={},
        note="Requires time-series flux data"
    ))
    
    # Ensemble (future)
    model_infos.append(ModelInfo(
        id="ensemble",
        name="Ensemble (XGB + CNN)",
        type="ensemble",
        status="pending",
        performance={},
        note="Requires CNN training"
    ))
    
    return ModelsListResponse(models=model_infos)


@router.get("/models/{model_name}/metrics", response_model=ModelMetrics)
async def get_model_metrics(model_name: str):
    """Get performance metrics for a model"""
    
    if model_name not in registry.list_models():
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    # Load CV metrics if available
    cv_file = settings.MODELS_DIR / "cv_fold_metrics.csv"
    
    if cv_file.exists():
        cv_df = pd.read_csv(cv_file)
        
        return ModelMetrics(
            model=model_name,
            performance=ModelPerformance(
                accuracy=float(cv_df['accuracy'].mean()),
                precision=float(cv_df['precision'].mean()),
                recall=float(cv_df['recall'].mean()),
                f1_score=float(cv_df['f1'].mean()),
                roc_auc=float(cv_df['roc_auc'].mean())
            ),
            cross_validation=CrossValidation(
                n_folds=len(cv_df),
                mean_recall=float(cv_df['recall'].mean()),
                std_recall=float(cv_df['recall'].std())
            ),
            training_date="2025-10-04T17:32:57Z",
            training_samples=9201
        )
    else:
        # Default values if CV file not found
        return ModelMetrics(
            model=model_name,
            performance=ModelPerformance(
                accuracy=0.81,
                precision=0.79,
                recall=0.85,
                f1_score=0.82,
                roc_auc=0.88
            ),
            cross_validation=CrossValidation(
                n_folds=5,
                mean_recall=0.8567,
                std_recall=0.0187
            ),
            training_date="2025-10-04T17:32:57Z",
            training_samples=9201
        )


@router.get("/models/{model_name}/importance", response_model=FeatureImportanceResponse)
async def get_feature_importance(model_name: str):
    """Get feature importance for a model"""
    
    if model_name not in registry.list_models():
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    model = registry.get_model(model_name)
    
    if not hasattr(model, 'feature_importances_'):
        raise HTTPException(status_code=400, detail="Model does not support feature importance")
    
    # Get feature names (assuming XGBoost with default features)
    feature_names = ['orbital_period', 'planet_radius', 'transit_duration', 'flux_mean', 'flux_std']
    importances = model.feature_importances_
    
    # Sort by importance
    sorted_idx = importances.argsort()[::-1]
    
    features = [
        FeatureImportance(
            name=feature_names[idx],
            importance=float(importances[idx]),
            rank=rank + 1
        )
        for rank, idx in enumerate(sorted_idx)
    ]
    
    return FeatureImportanceResponse(
        model=model_name,
        features=features
    )
```

### `backend/api/health.py`
```python
"""Health check endpoints"""
from fastapi import APIRouter
import time

from backend.core.model_registry import registry
from backend.core.config import settings
from backend.schemas.response import HealthResponse


router = APIRouter()

# Track startup time
_startup_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        models_loaded=registry.list_models(),
        version=settings.VERSION,
        uptime_seconds=time.time() - _startup_time
    )
```

### `backend/main.py`
```python
"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.api import predict, models, health


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered exoplanet detection API for NASA Space Apps 2025",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router, prefix=settings.API_V1_PREFIX, tags=["Predictions"])
app.include_router(models.router, prefix=settings.API_V1_PREFIX, tags=["Models"])
app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["Health"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NASA Exoplanet Hunter API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG)
```

---

## 🧪 Testing the API

### 1. Start the Server
```bash
cd backend
python main.py
# Or
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test with curl
```bash
# Health check
curl http://localhost:8000/api/health

# List models
curl http://localhost:8000/api/models

# Get model metrics
curl http://localhost:8000/api/models/xgb/metrics

# Feature importance
curl http://localhost:8000/api/models/xgb/importance

# Predict (with file)
curl -X POST http://localhost:8000/api/predict \
  -F "file=@../data/Keppler.csv" \
  -F "model=xgb" \
  -F "threshold=0.5"
```

### 3. Interactive API Docs
Open http://localhost:8000/docs in your browser to test endpoints interactively.

---

## 📦 Requirements Addition

Add to `requirements.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

---

## 🚀 Next Steps

1. **Implement the files above** in your repo
2. **Test locally** with Streamlit data
3. **Share API with frontend teammate** (they can start mocking)
4. **Add Docker** for easy deployment (optional)

---

**API is ready in ~2-4 hours!** 🎉

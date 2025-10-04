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

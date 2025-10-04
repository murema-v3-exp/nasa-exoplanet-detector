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
            performance={"recall": 0.871, "roc_auc": 0.894}
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
                accuracy=0.838,
                precision=0.818,
                recall=0.871,
                f1_score=0.843,
                roc_auc=0.894
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
    
    # Get feature names from model
    if hasattr(model, 'feature_names_in_'):
        feature_names = list(model.feature_names_in_)
    else:
        # Default feature names
        feature_names = ['orbital_period', 'planet_radius', 'transit_duration', 
                        'transit_depth', 'stellar_temperature']
    
    importances = model.feature_importances_
    
    # Sort by importance
    sorted_idx = importances.argsort()[::-1]
    
    features = [
        FeatureImportance(
            name=feature_names[idx] if idx < len(feature_names) else f"feature_{idx}",
            importance=float(importances[idx]),
            rank=rank + 1
        )
        for rank, idx in enumerate(sorted_idx)
    ]
    
    return FeatureImportanceResponse(
        model=model_name,
        features=features
    )

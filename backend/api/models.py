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
    
    # XGBoost (Kepler only)
    if "xgb" in registry.list_models():
        model_infos.append(ModelInfo(
            id="xgb",
            name="XGBoost Baseline (Kepler)",
            type="gradient_boosting",
            status="ready",
            performance={"recall": 0.871, "roc_auc": 0.894, "samples": 9201}
        ))
    
    # XGBoost Multi-Dataset
    if "xgb_multi" in registry.list_models():
        model_infos.append(ModelInfo(
            id="xgb_multi",
            name="XGBoost Multi-Dataset (Kepler+K2+TESS)",
            type="gradient_boosting",
            status="ready",
            performance={"recall": 0.889, "precision": 0.932, "roc_auc": 0.921, "samples": 19418}
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


@router.get("/models/{model_name}/statistics")
async def get_model_statistics(model_name: str):
    """
    Get comprehensive statistics for a model including:
    - Model information
    - Test set performance
    - Cross-validation results
    - Training information
    - Dataset breakdown
    - Feature importance with descriptions
    """
    
    if model_name not in registry.list_models():
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    model = registry.get_model(model_name)
    metadata = registry.get_metadata(model_name)
    
    # Load metrics for this model
    if model_name == "xgb_multi":
        metrics_file = settings.MODELS_DIR / "metrics_multi.json"
    else:
        metrics_file = settings.MODELS_DIR / "metrics.json"
    
    if metrics_file.exists():
        import json
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
    else:
        # Fallback default metrics
        metrics = {
            "test": {
                "accuracy": 0.838,
                "precision": 0.818,
                "recall": 0.871,
                "f1": 0.843,
                "roc_auc": 0.894
            },
            "cv": {
                "recall": {"mean": 0.857, "std": 0.019},
                "precision": {"mean": 0.825, "std": 0.025},
                "f1": {"mean": 0.840, "std": 0.020}
            }
        }
    
    # Get feature importance
    if hasattr(model, 'feature_importances_'):
        if hasattr(model, 'feature_names_in_'):
            feature_names = list(model.feature_names_in_)
        else:
            feature_names = ['orbital_period', 'planet_radius', 'transit_duration', 
                            'transit_depth', 'stellar_temperature']
        
        importances = model.feature_importances_
        sorted_idx = importances.argsort()[::-1]
        
        feature_importance = [
            {
                "name": feature_names[idx] if idx < len(feature_names) else f"feature_{idx}",
                "importance": round(float(importances[idx]) * 100, 2),
                "rank": rank + 1,
                "description": _get_feature_description(feature_names[idx] if idx < len(feature_names) else f"feature_{idx}")
            }
            for rank, idx in enumerate(sorted_idx)
        ]
    else:
        feature_importance = []
    
    # Dataset information based on model
    if model_name == "xgb_multi":
        dataset_info = {
            "total_samples": 19418,
            "datasets": ["Kepler", "K2", "TESS"],
            "dataset_breakdown": {
                "Kepler": {"samples": 9201, "planets": 4619, "false_positives": 4582},
                "K2": {"samples": 3127, "planets": 3127, "false_positives": 0},
                "TESS": {"samples": 7090, "planets": 7090, "false_positives": 0}
            },
            "training_date": "2025-10-04",
            "features_count": 5
        }
        dataset_stats = {
            "total_planets": 14836,
            "total_false_positives": 4582,
            "planet_percentage": round(14836 / 19418 * 100, 1),
            "missions_used": 3,
            "date_range": "2009-2024"
        }
    else:
        dataset_info = {
            "total_samples": 9201,
            "datasets": ["Kepler"],
            "dataset_breakdown": {
                "Kepler": {"samples": 9201, "planets": 4619, "false_positives": 4582}
            },
            "training_date": "2025-10-04",
            "features_count": 5
        }
        dataset_stats = {
            "total_planets": 4619,
            "total_false_positives": 4582,
            "planet_percentage": round(4619 / 9201 * 100, 1),
            "missions_used": 1,
            "date_range": "2009-2013"
        }
    
    return {
        "model": {
            "id": model_name,
            "name": metadata.get("name", model_name),
            "type": metadata.get("type", "unknown"),
            "dataset": metadata.get("dataset", "unknown"),
            "status": metadata.get("status", "ready")
        },
        "performance": {
            "test": {
                "accuracy": round(metrics["test"]["accuracy"] * 100, 1),
                "precision": round(metrics["test"]["precision"] * 100, 1),
                "recall": round(metrics["test"]["recall"] * 100, 1),
                "f1_score": round(metrics["test"]["f1"] * 100, 1),
                "roc_auc": round(metrics["test"]["roc_auc"] * 100, 1)
            },
            "cross_validation": {
                "mean_accuracy": round(metrics["cv"]["accuracy"]["mean"] * 100, 1) if "accuracy" in metrics["cv"] else None,
                "mean_precision": round(metrics["cv"]["precision"]["mean"] * 100, 1) if "precision" in metrics["cv"] else None,
                "mean_recall": round(metrics["cv"]["recall"]["mean"] * 100, 1),
                "mean_f1": round(metrics["cv"]["f1"]["mean"] * 100, 1) if "f1" in metrics["cv"] else None,
                "mean_roc_auc": round(metrics["cv"]["roc_auc"]["mean"] * 100, 1) if "roc_auc" in metrics["cv"] else None,
                "std_recall": round(metrics["cv"]["recall"]["std"] * 100, 1)
            }
        },
        "training_info": dataset_info,
        "feature_importance": feature_importance,
        "dataset_stats": dataset_stats
    }


def _get_feature_description(feature_name: str) -> str:
    """Get human-readable description for a feature"""
    descriptions = {
        "orbital_period": "Time for planet to complete one orbit (days)",
        "planet_radius": "Size of planet relative to Earth radii",
        "transit_duration": "How long the planet blocks the star's light (hours)",
        "transit_depth": "How much the star dims during transit (ppm)",
        "stellar_temperature": "Temperature of the host star (Kelvin)"
    }
    return descriptions.get(feature_name, feature_name)

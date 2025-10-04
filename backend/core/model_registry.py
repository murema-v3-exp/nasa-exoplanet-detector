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

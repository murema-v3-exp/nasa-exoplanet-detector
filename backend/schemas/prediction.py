"""Pydantic schemas for predictions"""
from pydantic import BaseModel, Field
from typing import Optional, List


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
    telescope: str
    threshold: float
    total_samples: int
    predictions: List[SinglePrediction]
    summary: PredictionSummary
    processing_time_ms: float
    
    model_config = {"protected_namespaces": ()}


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    error: str
    detail: Optional[str] = None

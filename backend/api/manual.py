"""
Manual prediction endpoint for single exoplanet parameter input
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.core.model_registry import registry

router = APIRouter()


class ManualPredictionInput(BaseModel):
    """Single exoplanet parameters for manual entry"""
    orbital_period: float = Field(..., gt=0, description="Orbital period in days")
    planet_radius: float = Field(..., gt=0, description="Planet radius in Earth radii")
    transit_duration: float = Field(..., gt=0, description="Transit duration in hours")
    transit_depth: Optional[float] = Field(None, gt=0, description="Transit depth in ppm")
    stellar_temp: Optional[float] = Field(None, gt=0, description="Stellar temperature in Kelvin")
    model: str = Field("xgb_multi", description="Model to use for prediction")
    
    class Config:
        json_schema_extra = {
            "example": {
                "orbital_period": 10.5,
                "planet_radius": 2.3,
                "transit_duration": 3.2,
                "transit_depth": 1000.0,
                "stellar_temp": 5778,
                "model": "xgb_multi"
            }
        }


class ManualPredictionResponse(BaseModel):
    """Response for manual prediction"""
    success: bool
    prediction: str  # "PLANET" or "FALSE POSITIVE"
    probability: float
    confidence: str  # "HIGH", "MEDIUM", "LOW"
    model_used: str
    features_used: dict
    interpretation: str
    
    model_config = {"protected_namespaces": ()}


@router.post("/manual-predict", response_model=ManualPredictionResponse)
async def predict_single(input_data: ManualPredictionInput):
    """
    Predict if manually entered parameters represent a planet or false positive
    
    This endpoint allows users to manually enter exoplanet parameters instead of uploading a CSV.
    Perfect for:
    - Testing individual cases
    - Educational demonstrations
    - Quick hypothesis testing
    - Interactive exploration
    """
    try:
        # Get model and scaler
        model = registry.get_model(input_data.model)
        scaler = registry.get_scaler(input_data.model)
        
        if model is None:
            raise HTTPException(status_code=404, detail=f"Model '{input_data.model}' not found")
        
        # Build feature vector (matching training feature order)
        features = [
            input_data.orbital_period,
            input_data.planet_radius,
            input_data.transit_duration,
            input_data.transit_depth if input_data.transit_depth else 0.0,
            input_data.stellar_temp if input_data.stellar_temp else 0.0
        ]
        
        features_array = np.array([features])
        
        # Scale features
        if scaler is not None:
            features_scaled = scaler.transform(features_array)
        else:
            features_scaled = features_array
        
        # Predict
        probability = model.predict_proba(features_scaled)[0, 1]
        prediction = "PLANET" if probability >= 0.5 else "FALSE POSITIVE"
        
        # Determine confidence
        if probability > 0.7 or probability < 0.3:
            confidence = "HIGH"
        elif probability > 0.6 or probability < 0.4:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"
        
        # Generate interpretation
        if prediction == "PLANET":
            if probability > 0.9:
                interpretation = f"Very strong planet signal! {probability*100:.1f}% confidence. This is likely a genuine exoplanet."
            elif probability > 0.7:
                interpretation = f"Strong planet signal. {probability*100:.1f}% probability. Good candidate for follow-up observation."
            else:
                interpretation = f"Weak planet signal. {probability*100:.1f}% probability. Borderline case, needs additional data."
        else:
            if probability < 0.1:
                interpretation = f"Very likely a false positive. Only {probability*100:.1f}% chance of being a planet."
            elif probability < 0.3:
                interpretation = f"Probably a false positive. {probability*100:.1f}% planet probability is below threshold."
            else:
                interpretation = f"Uncertain classification. {probability*100:.1f}% planet probability is borderline."
        
        return ManualPredictionResponse(
            success=True,
            prediction=prediction,
            probability=float(probability),
            confidence=confidence,
            model_used=input_data.model,
            features_used={
                "orbital_period": input_data.orbital_period,
                "planet_radius": input_data.planet_radius,
                "transit_duration": input_data.transit_duration,
                "transit_depth": input_data.transit_depth or 0.0,
                "stellar_temp": input_data.stellar_temp or 0.0
            },
            interpretation=interpretation
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/parameter-ranges")
async def get_parameter_ranges():
    """
    Get typical ranges for exoplanet parameters to help users with manual entry
    
    Returns min/max/typical values for each parameter based on known exoplanets
    """
    return {
        "orbital_period": {
            "min": 0.1,
            "max": 1000.0,
            "typical_range": [1, 365],
            "unit": "days",
            "description": "Time for planet to complete one orbit",
            "examples": {
                "Earth-like": 365,
                "Hot Jupiter": 3.5,
                "Super-Earth": 50
            }
        },
        "planet_radius": {
            "min": 0.1,
            "max": 30.0,
            "typical_range": [0.5, 20],
            "unit": "Earth radii (R⊕)",
            "description": "Size of planet compared to Earth",
            "examples": {
                "Earth-like": 1.0,
                "Hot Jupiter": 11.0,
                "Super-Earth": 1.8,
                "Neptune-like": 3.9
            }
        },
        "transit_duration": {
            "min": 0.1,
            "max": 24.0,
            "typical_range": [1, 12],
            "unit": "hours",
            "description": "How long the planet blocks the star's light",
            "examples": {
                "Earth-like": 13.0,
                "Hot Jupiter": 4.0,
                "Super-Earth": 6.0
            }
        },
        "transit_depth": {
            "min": 1.0,
            "max": 100000.0,
            "typical_range": [10, 10000],
            "unit": "parts per million (ppm)",
            "description": "How much the star dims during transit",
            "examples": {
                "Earth-like": 84,
                "Hot Jupiter": 10000,
                "Super-Earth": 200
            }
        },
        "stellar_temp": {
            "min": 2000,
            "max": 10000,
            "typical_range": [4000, 7000],
            "unit": "Kelvin (K)",
            "description": "Temperature of the host star",
            "examples": {
                "Sun-like": 5778,
                "Hot star": 7000,
                "Cool star": 4000
            }
        }
    }


@router.get("/example-planets")
async def get_example_planets():
    """
    Get example exoplanet parameters for common planet types
    
    Perfect for:
    - Demo/tutorial mode
    - Testing the manual entry form
    - Educational purposes
    """
    return {
        "examples": [
            {
                "name": "Earth-like Planet",
                "description": "Planet similar to Earth in size and orbit",
                "parameters": {
                    "orbital_period": 365.0,
                    "planet_radius": 1.0,
                    "transit_duration": 13.0,
                    "transit_depth": 84.0,
                    "stellar_temp": 5778
                },
                "expected_result": "High probability of being a planet"
            },
            {
                "name": "Hot Jupiter",
                "description": "Large gas giant in close orbit",
                "parameters": {
                    "orbital_period": 3.5,
                    "planet_radius": 11.0,
                    "transit_duration": 4.0,
                    "transit_depth": 10000.0,
                    "stellar_temp": 6000
                },
                "expected_result": "Very high probability of being a planet"
            },
            {
                "name": "Super-Earth",
                "description": "Rocky planet larger than Earth",
                "parameters": {
                    "orbital_period": 50.0,
                    "planet_radius": 1.8,
                    "transit_duration": 6.0,
                    "transit_depth": 200.0,
                    "stellar_temp": 5500
                },
                "expected_result": "High probability of being a planet"
            },
            {
                "name": "Neptune-like",
                "description": "Ice giant similar to Neptune",
                "parameters": {
                    "orbital_period": 120.0,
                    "planet_radius": 3.9,
                    "transit_duration": 8.0,
                    "transit_depth": 1500.0,
                    "stellar_temp": 5200
                },
                "expected_result": "High probability of being a planet"
            },
            {
                "name": "Suspicious Signal",
                "description": "Parameters that might indicate false positive",
                "parameters": {
                    "orbital_period": 0.5,
                    "planet_radius": 0.2,
                    "transit_duration": 0.3,
                    "transit_depth": 10.0,
                    "stellar_temp": 9000
                },
                "expected_result": "Likely a false positive"
            }
        ]
    }

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

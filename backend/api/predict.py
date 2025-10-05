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
    telescope: str = Form(..., description="Telescope name (kepler, k2, tess)"),
    model: str = Form("xgb", description="Model to use"),
    threshold: float = Form(0.5, ge=0.0, le=1.0, description="Classification threshold")
):
    """
    Predict exoplanets from uploaded CSV file.
    
    - **file**: CSV file in telescope-specific format
    - **telescope**: Telescope name (kepler, k2, tess)
    - **model**: Model name (xgb, cnn, ensemble)
    - **threshold**: Classification threshold (0.0 - 1.0)
    """
    start_time = time.time()
    
    print(f"BACKEND: Received prediction request")
    print(f"File: {file.filename}")
    print(f"Telescope: {telescope}")
    print(f"Model: {model}")
    print(f"Threshold: {threshold}")
    print(f"Start time: {start_time}")
    
    try:
        # Validate telescope
        telescope_lower = telescope.lower()
        valid_telescopes = ['kepler', 'keppler', 'k2', 'tess']
        if telescope_lower not in valid_telescopes:
            print(f"BACKEND: Invalid telescope: {telescope}")
            raise HTTPException(status_code=400, detail=f"Telescope must be one of: {valid_telescopes}")
        
        # Validate file type
        if not file.filename or not file.filename.endswith('.csv'):
            print(f"BACKEND: Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Load telescope-specific column information
        telescope_name = telescope_lower.capitalize() if telescope_lower != 'kepler' else 'Keppler'
        if telescope_lower == 'kepler':
            telescope_name = 'Keppler'
        elif telescope_lower == 'keppler':
            telescope_name = 'Keppler'
        
        column_info_path = Path(__file__).resolve().parent.parent.parent / "data" / f"{telescope_name}_column_data.txt"
        print(f"BACKEND: Using telescope config: {telescope_name}")
        print(f"BACKEND: Column info path: {column_info_path}")
        
        # Load and process data
        print(f"BACKEND: Loading CSV file for {telescope_name}...")
        df = pd.read_csv(file.file, comment='#', low_memory=False)
        print(f"BACKEND: Raw data shape: {df.shape}")
        print(f"BACKEND: Columns available: {list(df.columns)}")
        
        print(f"BACKEND: Cleaning data for {telescope_name}...")
        df_clean = clean_data(df)
        print(f"BACKEND: Clean data shape: {df_clean.shape}")
        
        print(f"BACKEND: Extracting features for {telescope_name}...")
        df_features = extract_features(df_clean, mode='catalog')
        print(f"BACKEND: Features shape: {df_features.shape}")
        
        if len(df_features) == 0:
            print(f"BACKEND: No valid samples after processing")
            raise HTTPException(status_code=400, detail="No valid samples found in file")
        
        # Prepare features
        X = df_features.copy()
        if 'label' in X.columns:
            X = X.drop('label', axis=1)
        
        # Get model and scaler
        print(f"BACKEND: Loading model '{model}'...")
        clf = registry.get_model(model)
        scaler = registry.get_scaler(model)
        print(f"BACKEND: Model loaded: {type(clf).__name__}")
        print(f"BACKEND: Scaler loaded: {type(scaler).__name__ if scaler else 'None'}")
        
        # Apply scaling if available
        if scaler is not None:
            print(f"BACKEND: Applying feature scaling...")
            X_scaled = pd.DataFrame(
                scaler.transform(X.values),
                columns=X.columns,
                index=X.index
            )
        else:
            X_scaled = X
        
        # Predict
        print(f"BACKEND: Making predictions with threshold {threshold}...")
        y_proba = clf.predict_proba(X_scaled)[:, 1]
        y_pred = (y_proba >= threshold).astype(int)
        print(f"BACKEND: Found {np.sum(y_pred == 1)} planets out of {len(y_pred)} samples")
        
        # Build response
        predictions = []
        for idx, (orig_idx, row) in enumerate(df.loc[X.index].iterrows()):
            # Try to find an ID column
            sample_id = str(orig_idx)
            for id_col in ['kepoi_name', 'koi_id', 'kepid', 'id']:
                if id_col in row and pd.notna(row[id_col]):
                    sample_id = str(row[id_col])
                    break
            
            # Convert feature dict and handle NaN values
            feature_dict = X.iloc[idx].to_dict()
            # Convert NaN/NAType values to None for Pydantic compatibility
            clean_features = {}
            for key, value in feature_dict.items():
                if pd.isna(value):
                    clean_features[key] = None
                else:
                    clean_features[key] = float(value)
            
            predictions.append(SinglePrediction(
                id=sample_id,
                prediction="PLANET" if y_pred[idx] == 1 else "FALSE POSITIVE",
                probability=float(y_proba[idx]),
                features=FeatureDict(**clean_features)
            ))
        
        # Summary
        summary = PredictionSummary(
            predicted_planets=int(np.sum(y_pred == 1)),
            false_positives=int(np.sum(y_pred == 0)),
            mean_probability=float(np.mean(y_proba)),
            high_confidence_count=int(np.sum(y_proba > 0.7))
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        print(f"BACKEND: Prediction completed successfully!")
        print(f"BACKEND: Total samples: {len(predictions)}")
        print(f"BACKEND: Planets found: {summary.predicted_planets}")
        print(f"BACKEND: Processing time: {processing_time:.2f}ms")
        
        return PredictionResponse(
            success=True,
            model_used=model,
            telescope=telescope_name,
            threshold=threshold,
            total_samples=len(predictions),
            predictions=predictions,
            summary=summary,
            processing_time_ms=processing_time
        )
        
    except Exception as e:
        print(f"BACKEND: Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

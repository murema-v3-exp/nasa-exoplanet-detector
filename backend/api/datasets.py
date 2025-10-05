"""
Dataset endpoints for serving sample data from Kepler, TESS, and K2 datasets
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import pandas as pd
import numpy as np
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.core.config import settings
from src.preprocessing import load_csv, clean_data
from src.features import extract_features

router = APIRouter()

class DatasetService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        self._cached_datasets = {}
    
    def get_dataset_info(self):
        """Get information about available datasets"""
        datasets = []
        
        # Check which datasets exist
        kepler_file = self.data_dir / "Keppler.csv"  # Note: typo in original filename
        k2_file = self.data_dir / "K2.csv"
        tess_file = self.data_dir / "TESS.csv"
        
        if kepler_file.exists():
            datasets.append({
                "name": "Kepler",
                "file": "Keppler.csv",
                "description": "NASA Kepler mission exoplanet candidates",
                "source": "NASA Exoplanet Archive"
            })
        
        if k2_file.exists():
            datasets.append({
                "name": "K2", 
                "file": "K2.csv",
                "description": "NASA K2 mission exoplanet candidates",
                "source": "NASA Exoplanet Archive"
            })
        
        if tess_file.exists():
            datasets.append({
                "name": "TESS",
                "file": "TESS.csv", 
                "description": "NASA TESS mission exoplanet candidates",
                "source": "NASA Exoplanet Archive"
            })
        
        return datasets
    
    def load_sample_data(self, dataset_name: str, limit: int = 100):
        """Load sample data from specified dataset"""
        
        # Map dataset names to files
        dataset_files = {
            "kepler": "Keppler.csv",
            "k2": "K2.csv", 
            "tess": "TESS.csv"
        }
        
        dataset_name_lower = dataset_name.lower()
        if dataset_name_lower not in dataset_files:
            raise ValueError(f"Dataset '{dataset_name}' not found. Available: {list(dataset_files.keys())}")
        
        file_path = self.data_dir / dataset_files[dataset_name_lower]
        if not file_path.exists():
            raise FileNotFoundError(f"Dataset file not found: {file_path}")
        
        try:
            # Load with comment handling for NASA archive format
            df = pd.read_csv(file_path, comment='#', low_memory=False)
            
            # Sample random rows for diversity
            if len(df) > limit:
                df_sample = df.sample(n=limit, random_state=42)
            else:
                df_sample = df
            
            # Clean and extract features for consistent format
            df_clean = clean_data(df_sample)
            df_features = extract_features(df_clean, mode='catalog')
            
            # Convert to visualization format
            exoplanets = []
            for idx, row in df_clean.iterrows():
                
                # Extract common fields with fallbacks
                sample_id = self._get_field_value(row, ['kepid', 'tid', 'toi', 'id'], str(idx))
                name = self._get_field_value(row, ['kepler_name', 'pl_name', 'kepoi_name', 'toi'], f"{dataset_name}-{sample_id}")
                host_star = self._get_field_value(row, ['kepid', 'tid', 'host_name'], f"Star-{sample_id}")
                
                # Orbital and physical parameters
                orbital_period = self._get_field_value(row, ['koi_period', 'pl_orbper', 'orbital_period'], np.random.uniform(1, 365))
                planet_radius = self._get_field_value(row, ['koi_prad', 'pl_rade', 'planet_radius'], np.random.uniform(0.5, 10))
                stellar_radius = self._get_field_value(row, ['koi_srad', 'st_rad', 'stellar_radius'], np.random.uniform(0.5, 3))
                
                # Temperature
                equilibrium_temp = self._get_field_value(row, ['koi_teq', 'pl_eqt', 'equilibrium_temperature'], np.random.uniform(200, 2000))
                
                exoplanet_data = {
                    "id": str(sample_id),
                    "name": str(name),
                    "host_star": str(host_star), 
                    "orbital_period": float(orbital_period),
                    "planet_radius": float(planet_radius),
                    "stellar_radius": float(stellar_radius),
                    "distance_from_earth": float(np.random.uniform(10, 1000)),  # Random distance for visualization
                    "discovery_method": "Transit",
                    "discovery_year": int(np.random.choice([2009, 2014, 2018, 2020, 2022])), # Mission years
                    "equilibrium_temperature": float(equilibrium_temp),
                    "dataset_source": dataset_name.upper()
                }
                
                exoplanets.append(exoplanet_data)
            
            return {
                "dataset": dataset_name.upper(),
                "total_samples": len(df),
                "returned_samples": len(exoplanets), 
                "exoplanets": exoplanets
            }
            
        except Exception as e:
            raise RuntimeError(f"Error processing dataset {dataset_name}: {str(e)}")
    
    def _get_field_value(self, row, field_names: List[str], default_value):
        """Get value from row using list of possible field names"""
        for field in field_names:
            if field in row and pd.notna(row[field]):
                return row[field]
        return default_value

# Global service instance
dataset_service = DatasetService()


@router.get("/datasets")
async def list_datasets():
    """Get list of available datasets"""
    try:
        datasets = dataset_service.get_dataset_info()
        return {
            "success": True,
            "datasets": datasets,
            "total_count": len(datasets)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading datasets: {str(e)}")


@router.get("/datasets/combined/sample")
async def get_combined_sample_data(
    limit_per_dataset: int = Query(50, ge=1, le=200, description="Number of samples per dataset")
):
    """Get combined sample data from all available datasets"""
    try:
        datasets = dataset_service.get_dataset_info()
        all_exoplanets = []
        
        for dataset_info in datasets:
            dataset_name = dataset_info["name"]
            try:
                result = dataset_service.load_sample_data(dataset_name, limit_per_dataset)
                all_exoplanets.extend(result["exoplanets"])
            except Exception as e:
                # Log error but continue with other datasets
                print(f"Warning: Could not load {dataset_name}: {e}")
                continue
        
        # Shuffle for mixed visualization
        np.random.seed(42)
        np.random.shuffle(all_exoplanets)
        
        return {
            "success": True,
            "datasets": [d["name"] for d in datasets],
            "total_samples": len(all_exoplanets),
            "exoplanets": all_exoplanets
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading combined data: {str(e)}")


@router.get("/datasets/{dataset_name}/sample")
async def get_sample_data(
    dataset_name: str,
    limit: int = Query(100, ge=1, le=500, description="Number of samples to return")
):
    """Get sample data from specified dataset for visualization"""
    try:
        result = dataset_service.load_sample_data(dataset_name, limit)
        return {
            "success": True,
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading sample data: {str(e)}")
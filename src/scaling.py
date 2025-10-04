"""
Feature scaling utilities for exoplanet detection.
Designed to be model-agnostic and reusable across different ML backends.
"""
import joblib
import numpy as np
from pathlib import Path
from sklearn.preprocessing import RobustScaler, StandardScaler


class FeatureScaler:
    """
    Wrapper for feature scaling with save/load capability.
    Uses RobustScaler by default (better for outliers).
    """
    
    def __init__(self, method='robust'):
        """
        Initialize scaler.
        
        Args:
            method: 'robust' (default, good for outliers) or 'standard' (z-score)
        """
        self.method = method
        if method == 'robust':
            self.scaler = RobustScaler()
        elif method == 'standard':
            self.scaler = StandardScaler()
        else:
            raise ValueError(f"Unknown scaling method: {method}")
        
        self.feature_names = None
        self.is_fitted = False
    
    def fit(self, X, feature_names=None):
        """Fit scaler to training data."""
        self.scaler.fit(X)
        self.feature_names = feature_names
        self.is_fitted = True
        return self
    
    def transform(self, X):
        """Transform features using fitted scaler."""
        if not self.is_fitted:
            raise ValueError("Scaler must be fitted before transform")
        return self.scaler.transform(X)
    
    def fit_transform(self, X, feature_names=None):
        """Fit and transform in one step."""
        self.fit(X, feature_names)
        return self.transform(X)
    
    def inverse_transform(self, X):
        """Reverse scaling (useful for interpretation)."""
        return self.scaler.inverse_transform(X)
    
    def save(self, path):
        """Save fitted scaler to disk."""
        save_path = Path(path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        
        state = {
            'method': self.method,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'is_fitted': self.is_fitted
        }
        joblib.dump(state, save_path)
        return save_path
    
    @classmethod
    def load(cls, path):
        """Load fitted scaler from disk."""
        state = joblib.load(path)
        instance = cls(method=state['method'])
        instance.scaler = state['scaler']
        instance.feature_names = state['feature_names']
        instance.is_fitted = state['is_fitted']
        return instance
    
    def get_stats(self):
        """Get scaling statistics (for debugging/logging)."""
        if not self.is_fitted:
            return None
        
        stats = {}
        if self.method == 'robust':
            stats['center'] = self.scaler.center_
            stats['scale'] = self.scaler.scale_
        elif self.method == 'standard':
            stats['mean'] = self.scaler.mean_
            stats['std'] = self.scaler.scale_
        
        if self.feature_names:
            stats['features'] = self.feature_names
        
        return stats


def apply_scaling(df, feature_cols=None, scaler=None, fit=True):
    """
    Convenience function to scale a dataframe.
    
    Args:
        df: pandas DataFrame with features
        feature_cols: list of columns to scale (if None, scales all numeric except 'label')
        scaler: existing FeatureScaler instance (if None, creates new one)
        fit: whether to fit the scaler (True for train, False for test/inference)
    
    Returns:
        scaled_df, fitted_scaler
    """
    import pandas as pd
    
    df_copy = df.copy()
    
    if feature_cols is None:
        # Auto-detect numeric columns, exclude label
        feature_cols = df_copy.select_dtypes(include=[np.number]).columns.tolist()
        if 'label' in feature_cols:
            feature_cols.remove('label')
    
    if scaler is None:
        scaler = FeatureScaler(method='robust')
    
    if fit:
        scaled_values = scaler.fit_transform(df_copy[feature_cols].values, feature_names=feature_cols)
    else:
        scaled_values = scaler.transform(df_copy[feature_cols].values)
    
    df_copy[feature_cols] = scaled_values
    
    return df_copy, scaler

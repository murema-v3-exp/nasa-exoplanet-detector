import pandas as pd


def extract_features(df, mode='catalog'):
    """Extract a small, robust set of features for catalog-style rows.

    mode: 'catalog' expects per-row scalar columns (period, radius, duration)
    and will map common column-name variants from Kepler/K2/TESS.
    
    Preserves the label/disposition column if present for supervised learning.
    """
    # Column mapping: try several common names used across datasets
    col_map = {
        'orbital_period': ['orbital_period', 'koi_period', 'pl_orbper', 'pl_orbper'],
        'planet_radius': ['planet_radius', 'koi_prad', 'pl_rade', 'pl_radius'],
        'transit_duration': ['transit_duration', 'koi_duration', 'pl_trandurh', 'pl_trandur']
    }

    mapped = {}
    for target, candidates in col_map.items():
        for c in candidates:
            if c in df.columns:
                mapped[target] = c
                break
        if target not in mapped:
            # Use NaN column if missing; downstream code should handle or drop
            mapped[target] = None

    # Build features DataFrame with safe conversions
    features = {}
    for tgt in ['orbital_period', 'planet_radius', 'transit_duration']:
        col = mapped.get(tgt)
        if col is not None:
            features[tgt] = pd.to_numeric(df[col], errors='coerce')
        else:
            features[tgt] = pd.Series([pd.NA] * len(df), index=df.index)

    # Add simple statistics if a flux column exists (not required for catalog mode)
    flux_col = None
    for candidate in ['flux', 'sap_flux', 'pdcsap_flux']:
        if candidate in df.columns:
            flux_col = candidate
            break

    if flux_col is not None:
        features['flux_mean'] = pd.to_numeric(df[flux_col], errors='coerce').fillna(0)
        features['flux_std'] = pd.to_numeric(df[flux_col], errors='coerce').fillna(0)
    else:
        # default numeric placeholders
        features['flux_mean'] = pd.Series([0.0] * len(df), index=df.index)
        features['flux_std'] = pd.Series([0.0] * len(df), index=df.index)

    # Compose DataFrame
    feats_df = pd.DataFrame(features, index=df.index)
    
    # Preserve label column if present (for supervised learning)
    label_cols = ['koi_disposition', 'pl_disposition', 'tfopwg_disp', 'label']
    for label_col in label_cols:
        if label_col in df.columns:
            feats_df['label'] = df[label_col]
            break
    
    # Minimal cleaning: drop rows lacking the core numeric features
    feats_df = feats_df.dropna(subset=['orbital_period', 'planet_radius'], how='any')
    return feats_df

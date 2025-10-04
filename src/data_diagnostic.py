"""
Data quality diagnostic tool for exoplanet datasets.
Checks missing values, outliers, distributions, and preprocessing quality.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.preprocessing import load_csv, clean_data
from src.features import extract_features


def analyze_raw_data(csv_path):
    """Analyze raw data quality before preprocessing."""
    print("\n" + "="*80)
    print(f"RAW DATA ANALYSIS: {csv_path.name}")
    print("="*80)
    
    df = pd.read_csv(csv_path, comment='#', low_memory=False)
    
    print(f"\n📊 Dataset shape: {df.shape[0]} rows × {df.shape[1]} columns")
    
    # Check target distribution if present
    target_cols = ['koi_disposition', 'pl_disposition', 'tfopwg_disp']
    found_target = None
    for col in target_cols:
        if col in df.columns:
            found_target = col
            break
    
    if found_target:
        print(f"\n🎯 Target column: '{found_target}'")
        print(df[found_target].value_counts())
        print(f"Missing in target: {df[found_target].isna().sum()}")
    else:
        print("\n⚠️  No target column found")
    
    # Missing value analysis
    print("\n🔍 Missing Values Analysis:")
    missing = df.isnull().sum()
    missing_pct = (missing / len(df)) * 100
    missing_df = pd.DataFrame({
        'column': missing.index,
        'missing_count': missing.values,
        'missing_pct': missing_pct.values
    })
    missing_df = missing_df[missing_df['missing_count'] > 0].sort_values('missing_pct', ascending=False)
    
    if len(missing_df) > 0:
        print(f"Columns with missing values: {len(missing_df)}")
        print("\nTop 15 columns by missing %:")
        print(missing_df.head(15).to_string(index=False))
    else:
        print("✅ No missing values found")
    
    # Key feature columns analysis
    key_features = [
        'koi_period', 'pl_orbper', 'orbital_period',
        'koi_prad', 'pl_rade', 'planet_radius',
        'koi_duration', 'pl_trandurh', 'transit_duration',
        'koi_depth', 'pl_trandep',
        'koi_teq', 'pl_eqt'
    ]
    
    available_features = [f for f in key_features if f in df.columns]
    print(f"\n📌 Key feature columns available: {len(available_features)}/{len(key_features)}")
    
    for feat in available_features[:10]:  # Show first 10
        col_data = df[feat]
        if pd.api.types.is_numeric_dtype(col_data):
            valid = col_data.dropna()
            if len(valid) > 0:
                print(f"  {feat:20s}: {len(valid):5d} valid | "
                      f"range [{valid.min():.2e}, {valid.max():.2e}] | "
                      f"missing {col_data.isna().sum()}")
    
    return df


def analyze_preprocessed_data(df_raw):
    """Analyze data after preprocessing."""
    print("\n" + "="*80)
    print("PREPROCESSED DATA ANALYSIS")
    print("="*80)
    
    df_clean = clean_data(df_raw.copy())
    print(f"\n📊 After clean_data: {df_clean.shape[0]} rows × {df_clean.shape[1]} columns")
    print(f"   Rows dropped: {len(df_raw) - len(df_clean)} ({100*(len(df_raw)-len(df_clean))/len(df_raw):.1f}%)")
    
    return df_clean


def analyze_feature_extraction(df_clean):
    """Analyze feature extraction quality."""
    print("\n" + "="*80)
    print("FEATURE EXTRACTION ANALYSIS")
    print("="*80)
    
    try:
        df_features = extract_features(df_clean.copy(), mode='catalog')
        print(f"\n📊 After feature extraction: {df_features.shape[0]} rows × {df_features.shape[1]} columns")
        print(f"   Rows dropped: {len(df_clean) - len(df_features)} ({100*(len(df_clean)-len(df_features))/len(df_clean):.1f}%)")
        
        print("\n📋 Extracted features:")
        for col in df_features.columns:
            if col != 'label':
                col_data = df_features[col]
                if pd.api.types.is_numeric_dtype(col_data):
                    print(f"  {col:20s}: mean={col_data.mean():10.2e} | "
                          f"std={col_data.std():10.2e} | "
                          f"missing={col_data.isna().sum()}")
        
        # Check for extreme values / outliers
        print("\n🔍 Outlier Detection (values > 3 std from mean):")
        numeric_cols = df_features.select_dtypes(include=[np.number]).columns
        numeric_cols = [c for c in numeric_cols if c != 'label']
        
        for col in numeric_cols:
            mean = df_features[col].mean()
            std = df_features[col].std()
            outliers = ((df_features[col] - mean).abs() > 3 * std).sum()
            if outliers > 0:
                pct = 100 * outliers / len(df_features)
                print(f"  {col:20s}: {outliers:4d} outliers ({pct:.1f}%)")
        
        # Check for constant or near-constant features
        print("\n⚠️  Low-variance features (std < 0.01 * mean):")
        low_var_count = 0
        for col in numeric_cols:
            mean = df_features[col].mean()
            std = df_features[col].std()
            if mean != 0 and std < 0.01 * abs(mean):
                low_var_count += 1
                print(f"  {col:20s}: mean={mean:.2e}, std={std:.2e}")
        
        if low_var_count == 0:
            print("  ✅ All features have sufficient variance")
        
        return df_features
        
    except Exception as e:
        print(f"\n❌ Feature extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def check_label_mapping(df_features):
    """Check label distribution after mapping."""
    if df_features is None or 'label' not in df_features.columns:
        print("\n⚠️  No label column found in features")
        return
    
    print("\n" + "="*80)
    print("LABEL DISTRIBUTION ANALYSIS")
    print("="*80)
    
    label_dist = df_features['label'].value_counts()
    print("\n🎯 Label distribution after mapping:")
    print(label_dist)
    
    total = len(df_features)
    for label, count in label_dist.items():
        print(f"  Class {label}: {count:5d} ({100*count/total:.1f}%)")
    
    # Check class balance
    if len(label_dist) == 2:
        minority = label_dist.min()
        majority = label_dist.max()
        imbalance_ratio = majority / minority
        print(f"\n⚖️  Class imbalance ratio: {imbalance_ratio:.2f}:1")
        if imbalance_ratio > 3:
            print("  ⚠️  Significant class imbalance - consider class weighting or SMOTE")
        else:
            print("  ✅ Class balance is acceptable")


def main():
    """Run comprehensive data diagnostics."""
    data_dir = Path(__file__).resolve().parent.parent / 'data'
    kepler_path = data_dir / 'Keppler.csv'
    
    if not kepler_path.exists():
        print(f"❌ Kepler dataset not found at {kepler_path}")
        return
    
    print("\n" + "="*80)
    print("EXOPLANET DATA QUALITY DIAGNOSTIC")
    print("="*80)
    
    # Step 1: Analyze raw data
    df_raw = analyze_raw_data(kepler_path)
    
    # Step 2: Analyze after preprocessing
    df_clean = analyze_preprocessed_data(df_raw)
    
    # Step 3: Analyze feature extraction
    df_features = analyze_feature_extraction(df_clean)
    
    # Step 4: Check label mapping
    check_label_mapping(df_features)
    
    # Summary recommendations
    print("\n" + "="*80)
    print("RECOMMENDATIONS")
    print("="*80)
    
    if df_features is not None:
        retention_rate = 100 * len(df_features) / len(df_raw)
        print(f"\n📈 Overall data retention: {retention_rate:.1f}%")
        
        if retention_rate < 50:
            print("  ⚠️  Low retention - consider less aggressive cleaning")
        elif retention_rate < 80:
            print("  ℹ️  Moderate retention - acceptable for ML")
        else:
            print("  ✅ High retention - preprocessing is conservative")
        
        print("\n💡 Next steps:")
        print("  1. Review outlier handling strategy")
        print("  2. Consider feature scaling/normalization")
        print("  3. Run 5-fold CV to validate model stability")
        print("  4. Add feature importance analysis")


if __name__ == '__main__':
    main()

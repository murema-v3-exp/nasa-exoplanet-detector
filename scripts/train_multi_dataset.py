"""
Multi-Dataset Training Script
Combines Kepler, K2, and TESS data for comprehensive model training
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import sys
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.preprocessing import load_csv, clean_data
from src.features import extract_features
from src.scaling import FeatureScaler

def load_all_datasets():
    """Load and preprocess all three NASA mission datasets
    
    NOTE: Kepler has labels (CANDIDATE/FALSE POSITIVE), but K2 and TESS
    contain only CONFIRMED planets. We'll use Kepler for training and
    augment with confirmed planets from K2/TESS.
    """
    print("=" * 70)
    print("MULTI-DATASET TRAINING: Kepler + K2 + TESS")
    print("=" * 70)
    
    datasets = []
    dataset_info = []
    
    # Kepler - Has labels
    print("\n📡 Loading Kepler dataset (labeled)...")
    kepler_path = Path('data/Keppler.csv')  # Note: typo in filename
    if kepler_path.exists():
        df_kepler = load_csv(kepler_path)
        df_kepler_clean = clean_data(df_kepler)
        df_kepler_features = extract_features(df_kepler_clean, mode='catalog')
        
        # Map Kepler labels to binary
        if 'label' in df_kepler_features.columns:
            # Handle various label formats
            label_mapping = {
                'CONFIRMED': 1,
                'CANDIDATE': 1, 
                'FALSE POSITIVE': 0,
                'NOT DISPOSITIONED': 0
            }
            df_kepler_features['label'] = df_kepler_features['label'].str.upper().map(label_mapping)
            df_kepler_features = df_kepler_features.dropna(subset=['label'])
            df_kepler_features['label'] = df_kepler_features['label'].astype(int)
        
        df_kepler_features['dataset'] = 'Kepler'
        datasets.append(df_kepler_features)
        
        planets = (df_kepler_features['label'] == 1).sum() if 'label' in df_kepler_features.columns else 0
        dataset_info.append({
            'name': 'Kepler',
            'raw': len(df_kepler),
            'cleaned': len(df_kepler_clean),
            'final': len(df_kepler_features),
            'planets': planets,
            'false_positives': len(df_kepler_features) - planets
        })
        print(f"   ✓ Loaded {len(df_kepler_features):,} samples ({planets:,} planets)")
    else:
        raise ValueError(f"Kepler data not found at {kepler_path}. Need labeled data for training!")
    
    # K2 - Confirmed planets only
    print("\n📡 Loading K2 dataset (confirmed planets)...")
    k2_path = Path('data/K2.csv')
    if k2_path.exists():
        df_k2 = load_csv(k2_path)
        df_k2_clean = clean_data(df_k2)
        df_k2_features = extract_features(df_k2_clean, mode='catalog')
        
        # K2 contains confirmed planets - label them as positive class
        df_k2_features['label'] = 1
        df_k2_features['dataset'] = 'K2'
        datasets.append(df_k2_features)
        
        dataset_info.append({
            'name': 'K2',
            'raw': len(df_k2),
            'cleaned': len(df_k2_clean),
            'final': len(df_k2_features),
            'planets': len(df_k2_features),
            'false_positives': 0
        })
        print(f"   ✓ Loaded {len(df_k2_features):,} confirmed planets")
    else:
        print(f"   ⚠️ K2 data not found at {k2_path} (optional)")
    
    # TESS - Confirmed planets only
    print("\n📡 Loading TESS dataset (confirmed planets)...")
    tess_path = Path('data/TESS.csv')
    if tess_path.exists():
        df_tess = load_csv(tess_path)
        df_tess_clean = clean_data(df_tess)
        df_tess_features = extract_features(df_tess_clean, mode='catalog')
        
        # TESS contains confirmed planets - label them as positive class
        df_tess_features['label'] = 1
        df_tess_features['dataset'] = 'TESS'
        datasets.append(df_tess_features)
        
        dataset_info.append({
            'name': 'TESS',
            'raw': len(df_tess),
            'cleaned': len(df_tess_clean),
            'final': len(df_tess_features),
            'planets': len(df_tess_features),
            'false_positives': 0
        })
        print(f"   ✓ Loaded {len(df_tess_features):,} confirmed planets")
    else:
        print(f"   ⚠️ TESS data not found at {tess_path} (optional)")
    
    if not datasets:
        raise ValueError("No datasets found! Check data directory.")
    
    # Combine datasets
    print("\n🔗 Combining datasets...")
    df_combined = pd.concat(datasets, ignore_index=True)
    
    print("\n" + "=" * 70)
    print("DATASET SUMMARY")
    print("=" * 70)
    for info in dataset_info:
        print(f"{info['name']:10s} | Raw: {info['raw']:6,} | Final: {info['final']:6,} | Planets: {info['planets']:5,} | FP: {info['false_positives']:5,}")
    print("-" * 70)
    total_planets = sum(info['planets'] for info in dataset_info)
    total_fp = sum(info['false_positives'] for info in dataset_info)
    print(f"{'TOTAL':10s} | Combined: {len(df_combined):,} | Planets: {total_planets:,} | FP: {total_fp:,}")
    print("=" * 70)
    
    return df_combined, dataset_info

def train_model(df, model_params=None):
    """Train XGBoost model on combined dataset"""
    
    # Separate features and labels
    X = df.drop(['label', 'dataset'], axis=1)
    y = df['label']
    dataset_labels = df['dataset']
    
    print(f"\n📊 Dataset Distribution:")
    print(f"   Features: {X.shape[1]} columns")
    print(f"   Samples: {len(X):,}")
    print(f"   Planets: {(y == 1).sum():,} ({(y == 1).sum() / len(y) * 100:.1f}%)")
    print(f"   False Positives: {(y == 0).sum():,} ({(y == 0).sum() / len(y) * 100:.1f}%)")
    
    print(f"\n📊 By Dataset:")
    for dataset in dataset_labels.unique():
        mask = dataset_labels == dataset
        print(f"   {dataset}: {mask.sum():,} samples ({(y[mask] == 1).sum():,} planets)")
    
    # Scale features
    print("\n⚙️ Scaling features...")
    scaler = FeatureScaler()
    X_scaled = scaler.fit_transform(X.values)
    X_scaled = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
    
    # Train-test split (stratified by both label and dataset)
    print("\n✂️ Splitting data (80/20)...")
    X_train, X_test, y_train, y_test, ds_train, ds_test = train_test_split(
        X_scaled, y, dataset_labels,
        test_size=0.2,
        random_state=42,
        stratify=y  # Stratify by label
    )
    
    print(f"   Training: {len(X_train):,} samples")
    print(f"   Testing: {len(X_test):,} samples")
    
    # Default XGBoost parameters optimized for imbalanced data
    if model_params is None:
        model_params = {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 1,
            'gamma': 0,
            'scale_pos_weight': (y == 0).sum() / (y == 1).sum(),  # Handle imbalance
            'random_state': 42,
            'n_jobs': -1,
            'eval_metric': 'logloss'
        }
    
    print("\n🤖 Training XGBoost model...")
    print(f"   Parameters: {model_params}")
    
    model = XGBClassifier(**model_params)
    model.fit(X_train, y_train)
    
    print("   ✓ Training complete!")
    
    # Predictions
    print("\n🔮 Generating predictions...")
    y_train_pred = model.predict(X_train)
    y_train_proba = model.predict_proba(X_train)[:, 1]
    
    y_test_pred = model.predict(X_test)
    y_test_proba = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    print("\n" + "=" * 70)
    print("TRAINING SET PERFORMANCE")
    print("=" * 70)
    print(f"Accuracy:  {accuracy_score(y_train, y_train_pred):.4f}")
    print(f"Precision: {precision_score(y_train, y_train_pred):.4f}")
    print(f"Recall:    {recall_score(y_train, y_train_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_train, y_train_pred):.4f}")
    print(f"ROC-AUC:   {roc_auc_score(y_train, y_train_proba):.4f}")
    
    print("\n" + "=" * 70)
    print("TEST SET PERFORMANCE")
    print("=" * 70)
    print(f"Accuracy:  {accuracy_score(y_test, y_test_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_test_pred):.4f}")
    print(f"Recall:    {recall_score(y_test, y_test_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_test_pred):.4f}")
    print(f"ROC-AUC:   {roc_auc_score(y_test, y_test_proba):.4f}")
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)
    print("\n📊 Confusion Matrix:")
    print(f"   TN: {cm[0, 0]:4d}  |  FP: {cm[0, 1]:4d}")
    print(f"   FN: {cm[1, 0]:4d}  |  TP: {cm[1, 1]:4d}")
    
    # Per-dataset performance
    print("\n" + "=" * 70)
    print("PER-DATASET PERFORMANCE (Test Set)")
    print("=" * 70)
    for dataset in ds_test.unique():
        mask = ds_test == dataset
        if mask.sum() > 0:
            y_true_ds = y_test[mask]
            y_pred_ds = y_test_pred[mask]
            y_proba_ds = y_test_proba[mask]
            
            print(f"\n{dataset}:")
            print(f"   Samples: {mask.sum()}")
            print(f"   Accuracy:  {accuracy_score(y_true_ds, y_pred_ds):.4f}")
            print(f"   Precision: {precision_score(y_true_ds, y_pred_ds, zero_division=0):.4f}")
            print(f"   Recall:    {recall_score(y_true_ds, y_pred_ds, zero_division=0):.4f}")
            print(f"   F1 Score:  {f1_score(y_true_ds, y_pred_ds, zero_division=0):.4f}")
            
            # Only calculate ROC-AUC if both classes present
            if len(np.unique(y_true_ds)) > 1:
                print(f"   ROC-AUC:   {roc_auc_score(y_true_ds, y_proba_ds):.4f}")
            else:
                print(f"   ROC-AUC:   N/A (only class {y_true_ds.iloc[0]} in test set)")
    
    # Feature importance
    print("\n" + "=" * 70)
    print("FEATURE IMPORTANCE")
    print("=" * 70)
    feature_importance = pd.DataFrame({
        'Feature': X.columns,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    for idx, row in feature_importance.iterrows():
        print(f"   {row['Feature']:25s} {row['Importance']:.4f}")
    
    # Cross-validation
    print("\n" + "=" * 70)
    print("5-FOLD CROSS-VALIDATION")
    print("=" * 70)
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    cv_scores = {
        'accuracy': cross_val_score(model, X_scaled, y, cv=cv, scoring='accuracy', n_jobs=-1),
        'precision': cross_val_score(model, X_scaled, y, cv=cv, scoring='precision', n_jobs=-1),
        'recall': cross_val_score(model, X_scaled, y, cv=cv, scoring='recall', n_jobs=-1),
        'f1': cross_val_score(model, X_scaled, y, cv=cv, scoring='f1', n_jobs=-1),
        'roc_auc': cross_val_score(model, X_scaled, y, cv=cv, scoring='roc_auc', n_jobs=-1)
    }
    
    for metric, scores in cv_scores.items():
        print(f"{metric:10s}: {scores.mean():.4f} ± {scores.std():.4f}")
    
    return model, scaler, feature_importance, {
        'train': {
            'accuracy': accuracy_score(y_train, y_train_pred),
            'precision': precision_score(y_train, y_train_pred),
            'recall': recall_score(y_train, y_train_pred),
            'f1': f1_score(y_train, y_train_pred),
            'roc_auc': roc_auc_score(y_train, y_train_proba)
        },
        'test': {
            'accuracy': accuracy_score(y_test, y_test_pred),
            'precision': precision_score(y_test, y_test_pred),
            'recall': recall_score(y_test, y_test_pred),
            'f1': f1_score(y_test, y_test_pred),
            'roc_auc': roc_auc_score(y_test, y_test_proba)
        },
        'cv': {metric: {'mean': scores.mean(), 'std': scores.std()} 
               for metric, scores in cv_scores.items()}
    }

def save_artifacts(model, scaler, feature_importance, metrics):
    """Save trained model and metadata"""
    models_dir = Path('models')
    models_dir.mkdir(exist_ok=True)
    
    print("\n" + "=" * 70)
    print("SAVING MODEL ARTIFACTS")
    print("=" * 70)
    
    # Save model
    model_path = models_dir / 'xgb_multi.pkl'
    joblib.dump(model, model_path)
    print(f"✓ Model saved: {model_path}")
    
    # Save scaler
    scaler_path = models_dir / 'scaler_multi.pkl'
    scaler.save(scaler_path)
    print(f"✓ Scaler saved: {scaler_path}")
    
    # Save feature importance
    fi_path = models_dir / 'feature_importance_multi.csv'
    feature_importance.to_csv(fi_path, index=False)
    print(f"✓ Feature importance saved: {fi_path}")
    
    # Save metrics
    metrics_path = models_dir / 'metrics_multi.json'
    import json
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"✓ Metrics saved: {metrics_path}")
    
    print("\n✅ All artifacts saved successfully!")

def main():
    """Main training pipeline"""
    try:
        # Load datasets
        df_combined, dataset_info = load_all_datasets()
        
        # Train model
        model, scaler, feature_importance, metrics = train_model(df_combined)
        
        # Save artifacts
        save_artifacts(model, scaler, feature_importance, metrics)
        
        print("\n" + "=" * 70)
        print("🎉 MULTI-DATASET TRAINING COMPLETE!")
        print("=" * 70)
        print("\nModel trained on combined Kepler + K2 + TESS data")
        print(f"Total samples: {len(df_combined):,}")
        print(f"Test Recall: {metrics['test']['recall']:.1%}")
        print(f"Test Precision: {metrics['test']['precision']:.1%}")
        print(f"CV Recall: {metrics['cv']['recall']['mean']:.1%} ± {metrics['cv']['recall']['std']:.1%}")
        print("\nReady for production deployment! 🚀")
        
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

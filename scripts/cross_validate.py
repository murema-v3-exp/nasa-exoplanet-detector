"""
Cross-validation script for exoplanet detection model.
Validates model stability across multiple folds and reports comprehensive metrics.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.preprocessing import load_csv, clean_data
from src.features import extract_features
from src.scaling import apply_scaling

from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    classification_report, 
    roc_auc_score, 
    confusion_matrix,
    precision_recall_curve,
    auc
)
from xgboost import XGBClassifier


def map_labels_option_b(disposition):
    """Map Kepler disposition to binary labels (Option B)."""
    if disposition in ['CONFIRMED', 'CANDIDATE']:
        return 1  # Positive (planet)
    elif disposition == 'FALSE POSITIVE':
        return 0  # Negative
    else:
        return np.nan


def run_cv(n_folds=5, use_scaling=True, save_results=True):
    """
    Run stratified k-fold cross-validation on Kepler data.
    
    Args:
        n_folds: number of CV folds
        use_scaling: whether to apply feature scaling
        save_results: whether to save fold predictions and metrics
    
    Returns:
        dict with CV results
    """
    print("\n" + "="*80)
    print(f"STRATIFIED {n_folds}-FOLD CROSS-VALIDATION")
    print("="*80)
    
    # Load and preprocess data
    data_path = Path(__file__).resolve().parent.parent / 'data' / 'Keppler.csv'
    print(f"\n📂 Loading: {data_path.name}")
    
    df_raw = load_csv(data_path)
    df_clean = clean_data(df_raw)
    df_features = extract_features(df_clean, mode='catalog')
    
    print(f"   Loaded {len(df_features)} samples")
    
    # Map labels (Option B)
    df_features['label'] = df_features['label'].apply(map_labels_option_b)
    df_features = df_features.dropna(subset=['label'])
    
    # Prepare X, y
    feature_cols = [c for c in df_features.columns if c != 'label']
    X = df_features[feature_cols].values
    y = df_features['label'].values.astype(int)
    
    print(f"   Features: {feature_cols}")
    print(f"   Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")
    
    # Initialize CV
    skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)
    
    # Storage for results
    fold_results = []
    all_y_true = []
    all_y_pred = []
    all_y_proba = []
    all_fold_indices = []
    
    print(f"\n🔄 Running {n_folds}-fold cross-validation...")
    print("="*80)
    
    for fold_idx, (train_idx, test_idx) in enumerate(skf.split(X, y), 1):
        print(f"\n📊 Fold {fold_idx}/{n_folds}")
        print("-" * 40)
        
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
        
        # Apply scaling if enabled
        if use_scaling:
            X_train_df = pd.DataFrame(X_train, columns=feature_cols)
            X_test_df = pd.DataFrame(X_test, columns=feature_cols)
            
            X_train_df, scaler = apply_scaling(X_train_df, feature_cols=feature_cols, fit=True)
            X_test_df, _ = apply_scaling(X_test_df, feature_cols=feature_cols, scaler=scaler, fit=False)
            
            X_train = X_train_df.values
            X_test = X_test_df.values
        
        # Train model
        model = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42 + fold_idx,
            eval_metric='logloss'
        )
        
        model.fit(X_train, y_train, verbose=False)
        
        # Predict
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1]
        
        # Compute metrics
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        accuracy = (tp + tn) / (tp + tn + fp + fn)
        
        roc_auc = roc_auc_score(y_test, y_proba)
        
        # PR-AUC (useful for imbalanced data)
        prec_curve, rec_curve, _ = precision_recall_curve(y_test, y_proba)
        pr_auc = auc(rec_curve, prec_curve)
        
        fold_result = {
            'fold': fold_idx,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'roc_auc': roc_auc,
            'pr_auc': pr_auc,
            'tp': int(tp),
            'fp': int(fp),
            'tn': int(tn),
            'fn': int(fn),
            'n_test': len(y_test)
        }
        
        fold_results.append(fold_result)
        
        # Store for global metrics
        all_y_true.extend(y_test)
        all_y_pred.extend(y_pred)
        all_y_proba.extend(y_proba)
        all_fold_indices.extend([fold_idx] * len(y_test))
        
        # Print fold results
        print(f"  Accuracy:  {accuracy:.4f}")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall:    {recall:.4f} ⭐")
        print(f"  F1:        {f1:.4f}")
        print(f"  ROC-AUC:   {roc_auc:.4f}")
        print(f"  PR-AUC:    {pr_auc:.4f}")
        print(f"  Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    
    # Aggregate statistics
    print("\n" + "="*80)
    print("CROSS-VALIDATION SUMMARY")
    print("="*80)
    
    df_results = pd.DataFrame(fold_results)
    
    metrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc', 'pr_auc']
    
    print("\n📈 Per-Metric Statistics:")
    print("-" * 60)
    for metric in metrics:
        mean_val = df_results[metric].mean()
        std_val = df_results[metric].std()
        min_val = df_results[metric].min()
        max_val = df_results[metric].max()
        
        star = " ⭐" if metric == 'recall' else ""
        print(f"{metric.upper():12s}: {mean_val:.4f} ± {std_val:.4f}  "
              f"[{min_val:.4f}, {max_val:.4f}]{star}")
    
    # Global confusion matrix
    global_cm = confusion_matrix(all_y_true, all_y_pred)
    global_tn, global_fp, global_fn, global_tp = global_cm.ravel()
    
    print(f"\n🎯 Overall Confusion Matrix (all folds combined):")
    print(f"   True Negatives:  {global_tn}")
    print(f"   False Positives: {global_fp}")
    print(f"   False Negatives: {global_fn}")
    print(f"   True Positives:  {global_tp}")
    
    global_recall = global_tp / (global_tp + global_fn)
    global_precision = global_tp / (global_tp + global_fp)
    
    print(f"\n   Overall Recall:    {global_recall:.4f} ⭐")
    print(f"   Overall Precision: {global_precision:.4f}")
    
    # Threshold analysis for higher recall
    print("\n" + "="*80)
    print("THRESHOLD ANALYSIS (for recall optimization)")
    print("="*80)
    
    thresholds_to_test = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6]
    print("\n🎚️  Recall vs Precision at different thresholds:")
    print("-" * 60)
    
    for thresh in thresholds_to_test:
        y_pred_thresh = (np.array(all_y_proba) >= thresh).astype(int)
        cm_thresh = confusion_matrix(all_y_true, y_pred_thresh)
        tn_t, fp_t, fn_t, tp_t = cm_thresh.ravel()
        
        recall_t = tp_t / (tp_t + fn_t)
        precision_t = tp_t / (tp_t + fp_t) if (tp_t + fp_t) > 0 else 0
        
        print(f"  Threshold {thresh:.2f}: Recall={recall_t:.4f}, Precision={precision_t:.4f}")
    
    # Save results if requested
    if save_results:
        results_dir = Path(__file__).resolve().parent.parent / 'models'
        results_dir.mkdir(exist_ok=True)
        
        # Save fold metrics
        df_results.to_csv(results_dir / 'cv_fold_metrics.csv', index=False)
        
        # Save predictions
        pred_df = pd.DataFrame({
            'fold': all_fold_indices,
            'y_true': all_y_true,
            'y_pred': all_y_pred,
            'y_proba': all_y_proba
        })
        pred_df.to_csv(results_dir / 'cv_predictions.csv', index=False)
        
        print(f"\n💾 Results saved to {results_dir}/")
    
    # Return summary
    summary = {
        'n_folds': n_folds,
        'mean_recall': df_results['recall'].mean(),
        'std_recall': df_results['recall'].std(),
        'mean_roc_auc': df_results['roc_auc'].mean(),
        'std_roc_auc': df_results['roc_auc'].std(),
        'global_recall': global_recall,
        'global_precision': global_precision,
        'fold_results': fold_results,
        'use_scaling': use_scaling
    }
    
    return summary


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Run cross-validation for exoplanet model')
    parser.add_argument('--folds', type=int, default=5, help='Number of CV folds')
    parser.add_argument('--no-scaling', action='store_true', help='Disable feature scaling')
    parser.add_argument('--no-save', action='store_true', help='Do not save results')
    
    args = parser.parse_args()
    
    summary = run_cv(
        n_folds=args.folds,
        use_scaling=not args.no_scaling,
        save_results=not args.no_save
    )
    
    print("\n" + "="*80)
    print("✅ CROSS-VALIDATION COMPLETE")
    print("="*80)
    print(f"\n🎯 Mean Recall: {summary['mean_recall']:.4f} ± {summary['std_recall']:.4f}")
    print(f"🎯 Global Recall: {summary['global_recall']:.4f}")
    
    if summary['mean_recall'] >= 0.80:
        print("\n✅ SUCCESS: Mean recall >= 80% target!")
    else:
        print(f"\n⚠️  Mean recall below 80% target (current: {summary['mean_recall']:.2%})")

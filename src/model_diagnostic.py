"""
Quick model diagnostic - check if model is behaving well
"""
import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.preprocessing import load_csv, clean_data
from src.features import extract_features
from src.scaling import FeatureScaler


def diagnose_model():
    """Check model behavior on training data"""
    
    print("\n" + "="*80)
    print("MODEL DIAGNOSTIC")
    print("="*80)
    
    # Load data
    data_path = Path(__file__).resolve().parent.parent / 'data' / 'Keppler.csv'
    df_raw = load_csv(data_path)
    df_clean = clean_data(df_raw)
    df_features = extract_features(df_clean, mode='catalog')
    
    # Map labels
    def map_label(x):
        if x in ['CONFIRMED', 'CANDIDATE']:
            return 1
        else:
            return 0
    
    if 'label' in df_features.columns:
        y_true = df_features['label'].apply(map_label).values
        X = df_features.drop('label', axis=1)
    else:
        print("❌ No labels found")
        return
    
    # Load model and scaler
    models_dir = Path(__file__).resolve().parent.parent / 'models'
    model = joblib.load(models_dir / 'xgb.pkl')
    
    scaler = None
    if (models_dir / 'scaler.pkl').exists():
        scaler = FeatureScaler.load(models_dir / 'scaler.pkl')
        X_scaled = pd.DataFrame(
            scaler.transform(X.values),
            columns=X.columns,
            index=X.index
        )
    else:
        X_scaled = X
    
    # Predict
    y_pred = model.predict(X_scaled)
    y_proba = model.predict_proba(X_scaled)[:, 1]
    
    print(f"\n📊 Predictions on full dataset ({len(y_true)} samples)")
    print("="*80)
    
    # Basic metrics
    from sklearn.metrics import confusion_matrix, classification_report
    
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    print(f"\n🎯 Confusion Matrix:")
    print(f"   True Negatives:  {tn:5d}")
    print(f"   False Positives: {fp:5d}")
    print(f"   False Negatives: {fn:5d}")
    print(f"   True Positives:  {tp:5d}")
    
    recall = tp / (tp + fn)
    precision = tp / (tp + fp)
    
    print(f"\n   Recall:    {recall:.4f} ({recall*100:.1f}%)")
    print(f"   Precision: {precision:.4f} ({precision*100:.1f}%)")
    
    # Probability distribution
    print(f"\n📈 Probability Distribution:")
    print(f"   Mean:   {y_proba.mean():.3f}")
    print(f"   Median: {np.median(y_proba):.3f}")
    print(f"   Std:    {y_proba.std():.3f}")
    print(f"   Min:    {y_proba.min():.3f}")
    print(f"   Max:    {y_proba.max():.3f}")
    
    # Check for issues
    print("\n🔍 Potential Issues:")
    issues = []
    
    if y_proba.std() < 0.15:
        issues.append("⚠️  Low probability variance - model may be underconfident")
    
    if (y_proba > 0.45).sum() < len(y_proba) * 0.3:
        issues.append("⚠️  Very few high-probability predictions - model may be too conservative")
    
    if recall < 0.80:
        issues.append(f"⚠️  Recall below 80% target ({recall:.2%})")
    
    if precision < 0.70:
        issues.append(f"⚠️  Precision below 70% ({precision:.2%})")
    
    # Check probability buckets
    buckets = [
        ("Very Low (0.0-0.2)", (y_proba < 0.2).sum()),
        ("Low (0.2-0.4)", ((y_proba >= 0.2) & (y_proba < 0.4)).sum()),
        ("Medium (0.4-0.6)", ((y_proba >= 0.4) & (y_proba < 0.6)).sum()),
        ("High (0.6-0.8)", ((y_proba >= 0.6) & (y_proba < 0.8)).sum()),
        ("Very High (0.8-1.0)", (y_proba >= 0.8).sum()),
    ]
    
    print("\n📊 Probability Buckets:")
    for name, count in buckets:
        pct = 100 * count / len(y_proba)
        print(f"   {name:20s}: {count:5d} ({pct:5.1f}%)")
    
    if len(issues) == 0:
        print("\n✅ No major issues detected - model looks good!")
    else:
        for issue in issues:
            print(f"   {issue}")
    
    # Compare confirmed vs candidate predictions
    print("\n🔬 Breakdown by True Label:")
    
    for label, name in [(0, "FALSE POSITIVE"), (1, "PLANET (Confirmed+Candidate)")]:
        mask = (y_true == label)
        probs = y_proba[mask]
        preds = y_pred[mask]
        
        correct = (preds == label).sum()
        total = mask.sum()
        
        print(f"\n   {name}:")
        print(f"      Total:         {total}")
        print(f"      Correct:       {correct} ({100*correct/total:.1f}%)")
        print(f"      Mean prob:     {probs.mean():.3f}")
        print(f"      High conf (>0.7): {(probs > 0.7).sum()}")
    
    # Feature importance
    print("\n📊 Top 5 Most Important Features:")
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        feature_names = X.columns
        
        indices = np.argsort(importances)[::-1][:5]
        
        for i, idx in enumerate(indices, 1):
            print(f"   {i}. {feature_names[idx]:20s}: {importances[idx]:.3f}")
    
    print("\n" + "="*80)
    
    # Suggestions
    print("\n💡 Suggestions:")
    
    if recall < 0.85:
        print("   • Lower threshold to 0.40 or 0.35 to increase recall")
        print("   • Add class_weight='balanced' to XGBClassifier")
        print("   • Increase model complexity (more estimators, deeper trees)")
    
    if precision < 0.75:
        print("   • Raise threshold to 0.55 or 0.60 to increase precision")
        print("   • Add more discriminative features (transit depth, stellar properties)")
    
    if y_proba.std() < 0.15:
        print("   • Model is underconfident - try:")
        print("     - Increase learning_rate (current: 0.05 → try 0.1)")
        print("     - Reduce regularization (increase max_depth)")
    
    print("\n✅ Diagnostic complete")


if __name__ == '__main__':
    diagnose_model()

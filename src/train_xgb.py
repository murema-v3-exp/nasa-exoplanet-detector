"""Train an XGBoost classifier on the Kepler catalog (catalog-mode).

Label mapping (option B): CONFIRMED and CANDIDATE => 1, FALSE POSITIVE => 0.

This script trains with a simple train/test split with optional feature scaling.
It saves the model and scaler to models/xgb.pkl and models/scaler.pkl
"""
import pandas as pd
import numpy as np
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score

try:
    import xgboost as xgb
except Exception as e:
    raise ImportError('xgboost is required. Install with `pip install xgboost`.')

from src.features import extract_features
from src.scaling import apply_scaling


def load_kepler(path: Path):
    # Kepler CSV contains many leading comment lines beginning with '#'
    df = pd.read_csv(path, comment='#')
    return df


def map_label_disposition(series: pd.Series):
    # Option B mapping: treat CANDIDATE as positive
    positive = series.str.upper().isin(['CONFIRMED', 'CANDIDATE'])
    return positive.astype(int)


def main(use_scaling=True):
    repo_root = Path(__file__).resolve().parents[1]
    data_path = repo_root / 'data' / 'Keppler.csv'
    if not data_path.exists():
        raise FileNotFoundError(f'Kepler CSV not found at {data_path}')

    print('Loading Kepler catalog...', data_path)
    df = load_kepler(data_path)

    # The Kepler catalog uses 'koi_disposition' for label
    if 'koi_disposition' not in df.columns:
        raise KeyError('Expected column koi_disposition in Kepler file')

    # Map labels first
    df['label'] = map_label_disposition(df['koi_disposition'].astype(str))
    print('Class balance:', df['label'].value_counts().to_dict())

    # Extract features (this will preserve the label column)
    X_df = extract_features(df, mode='catalog')
    
    # Now extract y from the preserved label and map it again (in case it's string)
    if 'label' in X_df.columns:
        y = X_df['label']
        # If label is still string, remap it
        if y.dtype == 'object':
            y = y.apply(lambda x: 1 if x in ['CONFIRMED', 'CANDIDATE'] else 0)
        y = y.astype(int)
        X_df = X_df.drop('label', axis=1)
    else:
        raise ValueError("Label column not found after feature extraction")

    # Simple train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_df, y, stratify=y, test_size=0.2, random_state=42
    )

    # Apply scaling if enabled
    scaler = None
    if use_scaling:
        print('Applying RobustScaler to features...')
        X_train, scaler = apply_scaling(X_train, fit=True)
        X_test, _ = apply_scaling(X_test, scaler=scaler, fit=False)

    # Train a small XGBoost classifier
    clf = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42
    )

    print('Training XGBoost...')
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)[:, 1]
    print('Test classification report:')
    print(classification_report(y_test, preds))
    try:
        print('ROC AUC:', roc_auc_score(y_test, probs))
    except Exception:
        pass

    models_dir = repo_root / 'models'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    out_path = models_dir / 'xgb.pkl'
    joblib.dump(clf, out_path)
    print('Saved XGBoost model to', out_path)
    
    if scaler is not None:
        scaler_path = models_dir / 'scaler.pkl'
        scaler.save(scaler_path)
        print('Saved scaler to', scaler_path)


if __name__ == '__main__':
    main()

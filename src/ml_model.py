from sklearn.ensemble import RandomForestClassifier
import joblib
from pathlib import Path


def _models_dir():
    # repo root -> parent of src/
    return Path(__file__).resolve().parents[1] / 'models'


def train_rf(X_train, y_train, out_name='ml_model.pkl'):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    out_path = _models_dir() / out_name
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, str(out_path))
    return model


def load_rf_model(model_name='ml_model.pkl'):
    path = _models_dir() / model_name
    return joblib.load(str(path))

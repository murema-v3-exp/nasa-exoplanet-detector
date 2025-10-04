import streamlit as st
import pandas as pd
from src.preprocessing import load_csv, clean_data, normalize_flux
from src.features import extract_features
import numpy as np
from src.ensemble import ensemble_predict
from pathlib import Path
import joblib


st.title("Exoplanet Hunter")

# Mode selector: catalog (fast) vs lightcurve (CNN)
mode = st.selectbox('Select input type', ['catalog (Kepler/K2/TESS rows)', 'lightcurve (time-series flux)'])

uploaded_file = st.file_uploader("Upload a CSV", type="csv")

if uploaded_file is not None:
    df = load_csv(uploaded_file)
    st.write("Preview of your data:")
    st.dataframe(df.head())

    if mode.startswith('catalog'):
        # Catalog mode: extract scalar features and use XGBoost model if present
        X_features = extract_features(df, mode='catalog')
        st.write('Extracted features for prediction:')
        st.dataframe(X_features.head())

        # repo root is the directory containing this app.py
        repo_root = Path(__file__).resolve().parent
        model_path = repo_root / 'models' / 'xgb.pkl'
        if model_path.exists():
            clf = joblib.load(model_path)
            probs = clf.predict_proba(X_features)[:, 1]
            labels = clf.predict(X_features)
            out = df.loc[X_features.index].copy()
            out['pred_prob'] = probs
            out['pred_label'] = labels
            st.write('Predictions (first 20 rows):')
            st.dataframe(out[['pred_label', 'pred_prob']].head(20))
            st.bar_chart(out['pred_prob'].fillna(0).head(50))
        else:
            st.warning(f'No XGBoost model found at {model_path}. Run src/train_xgb.py to train and save models/xgb.pkl')

    else:
        # Lightcurve path: reuse existing workflow but guard on missing artifacts
        df = clean_data(df)
        df = normalize_flux(df)
        X_features = extract_features(df)

        # Attempt to load RF and CNN models if present
        models_dir = Path(__file__).resolve().parent / 'models'
        rf_path = models_dir / 'ml_model.pkl'
        cnn_path = models_dir / 'cnn_model.h5'

        ml_model = None
        cnn_model = None
        if rf_path.exists():
            ml_model = joblib.load(rf_path)
        if cnn_path.exists():
            # lazy import tensorflow so the app can start even if TF is not installed
            try:
                from tensorflow.keras.models import load_model as tf_load_model
                cnn_model = tf_load_model(str(cnn_path))
            except Exception as e:
                st.error(f'Error loading CNN model (TensorFlow may be missing): {e}')

        if ml_model is None and cnn_model is None:
            st.warning('No RF or CNN models found in models/. Please train or add models before using lightcurve mode.')
        else:
            ml_pred = None
            cnn_pred = None
            if ml_model is not None:
                try:
                    ml_pred = ml_model.predict_proba(X_features)
                except Exception as e:
                    st.error(f'Error running classical model: {e}')

            if cnn_model is not None:
                try:
                    cnn_input = np.expand_dims(df['flux'].values[:100], axis=(0,2))
                    cnn_pred = cnn_model.predict(cnn_input)
                except Exception as e:
                    st.error(f'Error running CNN model: {e}')

            if cnn_pred is not None and ml_pred is not None:
                final_class = ensemble_predict(cnn_pred, ml_pred)
                st.write('Ensembled prediction:', final_class)
            elif ml_pred is not None:
                st.write('Classical model prediction (argmax):', ml_pred.argmax(axis=1))
            elif cnn_pred is not None:
                st.write('CNN prediction (argmax):', cnn_pred.argmax(axis=1))

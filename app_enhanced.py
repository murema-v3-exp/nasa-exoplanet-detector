import streamlit as st
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go

from src.preprocessing import load_csv, clean_data, normalize_flux
from src.features import extract_features
from src.scaling import FeatureScaler


# Page config
st.set_page_config(
    page_title="NASA Exoplanet Hunter",
    page_icon="🪐",
    layout="wide"
)

st.title("NASA Exoplanet Hunter")
st.markdown("*AI-powered exoplanet detection using NASA Kepler, K2, and TESS data*")

# Sidebar for settings
with st.sidebar:
    st.header("⚙️ Settings")
    
    # Mode selector
    mode = st.selectbox(
        'Input Type',
        ['catalog (Kepler/K2/TESS rows)', 'lightcurve (time-series flux)'],
        help="Catalog mode: fast XGBoost on catalog features. Lightcurve: CNN+ensemble on time-series."
    )
    
    # Threshold control (for catalog mode)
    if mode.startswith('catalog'):
        st.markdown("---")
        st.subheader("🎚️ Prediction Threshold")
        threshold = st.slider(
            "Classification threshold",
            min_value=0.0,
            max_value=1.0,
            value=0.5,
            step=0.05,
            help="Lower threshold = higher recall (find more planets, more false positives). Higher threshold = higher precision (fewer false alarms, might miss planets)."
        )
        
        st.markdown(f"""
        **Current: {threshold:.2f}**
        - < 0.4: Very high recall (aggressive)
        - 0.4-0.5: Balanced
        - > 0.5: High precision (conservative)
        """)
    
    st.markdown("---")
    st.subheader("ℹ️ About")
    st.markdown("""
    This tool uses machine learning to identify exoplanets from NASA mission data.
    
    **Model:** XGBoost baseline  
    **Dataset:** Kepler (KOI)  
    **Target Recall:** >80%
    """)

# Main content
uploaded_file = st.file_uploader(
    "📤 Upload a CSV file (Kepler/K2/TESS format)",
    type="csv",
    help="Upload a catalog CSV with columns like koi_period, koi_prad, koi_duration, etc."
)

if uploaded_file is not None:
    
    # Load data
    with st.spinner("Loading data..."):
        df = load_csv(uploaded_file)
    
    st.success(f"✅ Loaded {len(df)} rows × {len(df.columns)} columns")
    
    # Show preview
    with st.expander("📋 Data Preview", expanded=False):
        st.dataframe(df.head(20), use_container_width=True)
    
    if mode.startswith('catalog'):
        # ============ CATALOG MODE ============
        
        # Extract features
        with st.spinner("Extracting features..."):
            X_features = extract_features(df, mode='catalog')
        
        st.success(f"✅ Extracted features for {len(X_features)} valid rows")
        
        # Show extracted features
        with st.expander("🔬 Extracted Features", expanded=False):
            st.dataframe(X_features.head(20), use_container_width=True)
            
            # Feature statistics
            st.subheader("Feature Statistics")
            col1, col2, col3 = st.columns(3)
            
            feature_cols = [c for c in X_features.columns if c != 'label']
            for idx, col in enumerate(feature_cols):
                if col in X_features.columns:
                    with [col1, col2, col3][idx % 3]:
                        st.metric(
                            col,
                            f"{X_features[col].mean():.2e}",
                            delta=f"σ={X_features[col].std():.2e}"
                        )
        
        # Load model and scaler
        repo_root = Path(__file__).resolve().parent
        model_path = repo_root / 'models' / 'xgb.pkl'
        scaler_path = repo_root / 'models' / 'scaler.pkl'
        
        if not model_path.exists():
            st.error(f"❌ No XGBoost model found at `{model_path}`")
            st.info("Run `python -m src.train_xgb` to train a model first.")
            st.stop()
        
        # Load model
        with st.spinner("Loading model..."):
            clf = joblib.load(model_path)
            
            # Load scaler if exists
            scaler = None
            if scaler_path.exists():
                scaler = FeatureScaler.load(scaler_path)
        
        # Prepare features for prediction
        X_pred = X_features.copy()
        if 'label' in X_pred.columns:
            X_pred = X_pred.drop('label', axis=1)
        
        # Apply scaling if scaler exists
        if scaler is not None:
            X_pred_scaled = pd.DataFrame(
                scaler.transform(X_pred.values),
                columns=X_pred.columns,
                index=X_pred.index
            )
        else:
            X_pred_scaled = X_pred
        
        # Make predictions
        with st.spinner("Running predictions..."):
            probs = clf.predict_proba(X_pred_scaled)[:, 1]
            labels_default = clf.predict(X_pred_scaled)
            labels_custom = (probs >= threshold).astype(int)
        
        # Build results dataframe
        results = df.loc[X_pred.index].copy()
        results['probability'] = probs
        results['prediction'] = labels_custom
        results['prediction_str'] = results['prediction'].map({0: 'FALSE POSITIVE', 1: 'PLANET'})
        
        # ============ RESULTS DISPLAY ============
        st.markdown("---")
        st.header("🎯 Prediction Results")
        
        # Summary metrics
        col1, col2, col3, col4 = st.columns(4)
        
        n_planets = (labels_custom == 1).sum()
        n_false_pos = (labels_custom == 0).sum()
        mean_prob = probs.mean()
        high_conf = (probs >= 0.7).sum()
        planet_pct = 100 * n_planets / len(labels_custom)
        
        col1.metric("🪐 Predicted Planets", f"{n_planets}", delta=f"{planet_pct:.1f}% of dataset")
        col2.metric("❌ False Positives", f"{n_false_pos}", delta=f"{100-planet_pct:.1f}% of dataset")
        col3.metric("📊 Mean Probability", f"{mean_prob:.3f}")
        col4.metric("⭐ High Confidence (>0.7)", f"{high_conf}", delta=f"{100*high_conf/len(probs):.1f}% of total")
        
        # Add context about results
        if abs(planet_pct - 50) < 5:
            st.info("""
            ℹ️ **Why ~50/50 split?** The Kepler dataset has balanced classes (half planets, half false positives). 
            This means the model correctly maintains that balance. Adjust the threshold slider to be more/less aggressive.
            """)
        elif planet_pct < 30:
            st.warning(f"""
            ⚠️ Only {planet_pct:.1f}% predicted as planets. Your threshold ({threshold:.2f}) might be too high.
            Try lowering it to 0.40 or 0.35 to find more planet candidates.
            """)
        elif planet_pct > 70:
            st.warning(f"""
            ⚠️ {planet_pct:.1f}% predicted as planets. Your threshold ({threshold:.2f}) might be too low.
            Try raising it to 0.55 or 0.60 to reduce false positives.
            """)
        
        # Probability distribution
        st.subheader("📈 Probability Distribution")
        
        fig = go.Figure()
        fig.add_trace(go.Histogram(
            x=probs,
            nbinsx=50,
            name="Predictions",
            marker_color='steelblue'
        ))
        fig.add_vline(
            x=threshold,
            line_dash="dash",
            line_color="red",
            annotation_text=f"Threshold={threshold:.2f}"
        )
        fig.update_layout(
            xaxis_title="Prediction Probability",
            yaxis_title="Count",
            showlegend=True,
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Feature importance (if available)
        if hasattr(clf, 'feature_importances_'):
            st.subheader("🔍 Feature Importance")
            
            importance_df = pd.DataFrame({
                'feature': X_pred.columns,
                'importance': clf.feature_importances_
            }).sort_values('importance', ascending=False)
            
            fig_imp = px.bar(
                importance_df,
                x='importance',
                y='feature',
                orientation='h',
                title="Which features drive predictions?"
            )
            fig_imp.update_layout(height=300)
            st.plotly_chart(fig_imp, use_container_width=True)
        
        # Results table
        st.subheader("📋 Detailed Results")
        
        # Filter options
        col1, col2 = st.columns(2)
        with col1:
            show_filter = st.selectbox(
                "Filter results",
                ["All", "Planets only", "False positives only", "High confidence (>0.7)"]
            )
        
        # Apply filter
        if show_filter == "Planets only":
            display_df = results[results['prediction'] == 1]
        elif show_filter == "False positives only":
            display_df = results[results['prediction'] == 0]
        elif show_filter == "High confidence (>0.7)":
            display_df = results[results['probability'] >= 0.7]
        else:
            display_df = results
        
        # Show table
        display_cols = ['prediction_str', 'probability'] + [c for c in display_df.columns if c not in ['prediction_str', 'probability', 'prediction']]
        st.dataframe(
            display_df[display_cols].head(100),
            use_container_width=True
        )
        
        # Download button
        st.subheader("💾 Download Results")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Clean CSV: only essential columns + predictions
            essential_cols = []
            
            # Add KOI ID if exists
            for id_col in ['kepoi_name', 'koi_id', 'kepid']:
                if id_col in results.columns:
                    essential_cols.append(id_col)
                    break
            
            # Add key observable features
            for col in ['koi_period', 'koi_prad', 'koi_duration', 'koi_depth', 'koi_teq']:
                if col in results.columns:
                    essential_cols.append(col)
            
            # Add disposition if present (for validation)
            if 'koi_disposition' in results.columns:
                essential_cols.append('koi_disposition')
            
            # Add predictions
            essential_cols.extend(['prediction_str', 'probability'])
            
            # Create clean export
            clean_results = results[essential_cols].copy()
            clean_results.columns = [c.replace('koi_', '').replace('_', ' ').title() for c in clean_results.columns]
            
            csv_clean = clean_results.to_csv(index=False).encode('utf-8')
            
            st.download_button(
                label="📥 Download Clean Predictions",
                data=csv_clean,
                file_name=f"exoplanet_predictions_clean_t{threshold:.2f}.csv",
                mime="text/csv",
                help="Minimal CSV with ID, key features, and predictions only"
            )
        
        with col2:
            # Full CSV: everything
            csv_full = results.to_csv(index=False).encode('utf-8')
            
            st.download_button(
                label="📥 Download Full Data",
                data=csv_full,
                file_name=f"exoplanet_predictions_full_t{threshold:.2f}.csv",
                mime="text/csv",
                help="Complete CSV with all original columns + predictions"
            )
        
        # Performance tip
        if 'label' in X_features.columns or 'koi_disposition' in df.columns:
            st.info("""
            💡 **Tip:** Your data contains labels. You can run cross-validation 
            to assess model performance: `python -m src.cross_validate`
            """)
    
    else:
        # ============ LIGHTCURVE MODE ============
        st.warning("⚠️ Lightcurve mode requires time-series data and trained CNN model (work in progress)")
        
        df = clean_data(df)
        df = normalize_flux(df)
        X_features = extract_features(df)

        # Attempt to load RF and CNN models
        models_dir = Path(__file__).resolve().parent / 'models'
        rf_path = models_dir / 'ml_model.pkl'
        cnn_path = models_dir / 'cnn_model.h5'

        ml_model = None
        cnn_model = None
        if rf_path.exists():
            ml_model = joblib.load(rf_path)
        if cnn_path.exists():
            try:
                from tensorflow.keras.models import load_model as tf_load_model
                cnn_model = tf_load_model(str(cnn_path))
            except Exception as e:
                st.error(f'Error loading CNN model: {e}')

        if ml_model is None and cnn_model is None:
            st.warning('No RF or CNN models found. Please train models first.')
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
                # Simple ensemble: average predictions
                final_pred = (cnn_pred + ml_pred) / 2
                st.write('Ensembled prediction:', final_pred.argmax(axis=1))
            elif ml_pred is not None:
                st.write('Classical model prediction:', ml_pred.argmax(axis=1))
            elif cnn_pred is not None:
                st.write('CNN prediction:', cnn_pred.argmax(axis=1))

else:
    # Landing page
    st.info("👆 Upload a CSV file to get started")
    
    st.markdown("---")
    st.subheader("📖 How to use")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        **For Catalog Data (Recommended):**
        1. Upload a Kepler/K2/TESS catalog CSV
        2. Adjust the prediction threshold (sidebar)
        3. Review predictions and download results
        
        **Expected columns:**
        - `koi_period` or `pl_orbper` (orbital period)
        - `koi_prad` or `pl_rade` (planet radius)
        - `koi_duration` or `pl_trandurh` (transit duration)
        """)
    
    with col2:
        st.markdown("""
        **Model Info:**
        - **Algorithm:** XGBoost (gradient boosted trees)
        - **Features:** Orbital period, planet radius, transit duration
        - **Training data:** Kepler mission (9,201 samples)
        - **Performance:** ~85% recall, ~88% ROC-AUC
        
        *Lower threshold = find more planets (but more false positives)*
        """)
    
    st.markdown("---")
    st.markdown("*Built for NASA Space Apps Challenge 2025 | 🚀 Exoplanet Detection Team*")

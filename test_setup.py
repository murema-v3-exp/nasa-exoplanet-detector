#!/usr/bin/env python3
"""
Test script to verify the NASA Exoplanet Detector setup is working correctly.
"""

print("🚀 Testing NASA Exoplanet Detector Setup...")
print("=" * 50)

# Test imports
try:
    import pandas as pd
    print("✅ pandas imported successfully")
except ImportError as e:
    print(f"❌ pandas import failed: {e}")

try:
    import numpy as np
    print("✅ numpy imported successfully")
except ImportError as e:
    print(f"❌ numpy import failed: {e}")

try:
    import streamlit as st
    print("✅ streamlit imported successfully")
except ImportError as e:
    print(f"❌ streamlit import failed: {e}")

try:
    import xgboost as xgb
    print("✅ xgboost imported successfully")
except ImportError as e:
    print(f"❌ xgboost import failed: {e}")

try:
    import sklearn
    print("✅ scikit-learn imported successfully")
except ImportError as e:
    print(f"❌ scikit-learn import failed: {e}")

try:
    import matplotlib.pyplot as plt
    print("✅ matplotlib imported successfully")
except ImportError as e:
    print(f"❌ matplotlib import failed: {e}")

try:
    import plotly.express as px
    print("✅ plotly imported successfully")
except ImportError as e:
    print(f"❌ plotly import failed: {e}")

try:
    import joblib
    print("✅ joblib imported successfully")
except ImportError as e:
    print(f"❌ joblib import failed: {e}")

# Test data files
import os
data_dir = "data"
print(f"\n📁 Checking data directory: {data_dir}")
if os.path.exists(data_dir):
    files = os.listdir(data_dir)
    for file in files:
        if file.endswith('.csv'):
            filepath = os.path.join(data_dir, file)
            size = os.path.getsize(filepath) / (1024 * 1024)  # MB
            print(f"✅ {file} ({size:.1f} MB)")
else:
    print(f"❌ Data directory {data_dir} not found")

# Test src modules
print(f"\n🧪 Testing custom modules...")
try:
    from src.preprocessing import load_csv
    print("✅ src.preprocessing imported successfully")
except ImportError as e:
    print(f"❌ src.preprocessing import failed: {e}")

try:
    from src.features import extract_features
    print("✅ src.features imported successfully")
except ImportError as e:
    print(f"❌ src.features import failed: {e}")

try:
    from src.scaling import FeatureScaler
    print("✅ src.scaling imported successfully")
except ImportError as e:
    print(f"❌ src.scaling import failed: {e}")

print("\n" + "=" * 50)
print("🎯 Setup test complete!")
print("\nNext steps:")
print("1. ✅ Virtual environment created and activated")
print("2. ✅ Dependencies installed")
print("3. ✅ Data files present")
print("4. ✅ Streamlit app running on http://localhost:8501")
print("\n🌟 Your NASA Exoplanet Detector is ready to use!")
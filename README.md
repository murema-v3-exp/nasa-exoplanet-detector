# NASA Exoplanet Hunter 🌌🔭# NASA Exoplanet Hunte---



[![NASA Space Apps 2025](https://img.shields.io/badge/NASA%20Space%20Apps-2025-blue)](https://www.spaceappschallenge.org/)## 🚀 Quick Start

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)### Prerequisites

- Python 3.12+

### NASA Space Apps Challenge 2025- pip

- (Optional) Node.js 18+ for React frontend

**AI-powered exoplanet detection system** built by **Murema Manganyi**, **Thando**, and **Hlali**.

### Installation

🎯 **Goal:** Help astronomers prioritize follow-up observations by identifying the most promising exoplanet candidates from Kepler/K2/TESS mission data using AI and machine learning.```bash

# Clone the repository

**Current Status:** ✅ **MVP Complete** - Working Streamlit app with 87% recall, now preparing production React + FastAPI architecture.git clone https://github.com/YOUR_USERNAME/nasa-exoplanet-detector.git

cd nasa-exoplanet-detector

---

# Create virtual environment

## 🚀 Quick Startpython -m venv venv

source venv/bin/activate  # On Windows: venv\Scripts\activate

### Prerequisites

- Python 3.12+# Install dependencies

- pippip install -r requirements.txt

- (Optional) Node.js 18+ for React frontend```



### Installation### Run Streamlit MVP (Current)

```bash```bash

# Clone the repositorystreamlit run app_enhanced.py

git clone https://github.com/YOUR_USERNAME/nasa-exoplanet-detector.git```

cd nasa-exoplanet-detector� Open http://localhost:8501 in your browser



# Create virtual environment### Run FastAPI Backend (In Development)

python -m venv venv```bash

venv\Scripts\activate  # Windows# Start API server

cd backend

# Install dependenciespython main.py

pip install -r requirements.txt# Or

```uvicorn backend.main:app --reload --port 8000

```

### Run Streamlit MVP📚 API Docs: http://localhost:8000/docs

```bash

streamlit run app_enhanced.py---

```

🌐 Open http://localhost:8501 in your browser## ✨ Features



---### Current (Streamlit MVP)

- ✅ **CSV Upload**: Drag-and-drop Kepler/K2/TESS format data

## ✨ Features- ✅ **Instant Predictions**: XGBoost model with 87% recall

- ✅ **Interactive Threshold**: Adjust confidence slider (0.0-1.0)

### Current (Streamlit MVP) ✅- ✅ **Visualizations**:

- **CSV Upload**: Drag-and-drop Kepler/K2/TESS format data  - Probability histogram with threshold line

- **Instant Predictions**: XGBoost model with 87.1% recall  - Feature importance chart

- **Interactive Threshold**: Adjust confidence slider (0.0-1.0)- ✅ **Export Options**:

- **Visualizations**: Probability histogram + feature importance chart  - Clean CSV (9 essential columns)

- **Export Options**: Clean CSV (9 columns) or Full CSV (82 columns)  - Full CSV (all 82 columns)

- **Filtering**: View all/planets/false positives/high confidence- ✅ **Filtering**: View all/planets/false positives/high confidence

- **Performance**: Processes 9,000+ samples in ~2 seconds- ✅ **Performance**: Processes 9,000+ samples in ~2 seconds



### Coming Soon (React + FastAPI) 🔄### Coming Soon (React + FastAPI)

- Multi-model support (XGBoost, CNN, Ensemble)- 🔄 Multi-model support (XGBoost, CNN, Ensemble)

- Real-time collaboration- 🔄 Real-time collaboration

- Batch processing API- 🔄 Batch processing API

- Cloud deployment (AWS/GCP/Azure)- 🔄 Cloud deployment (AWS/GCP/Azure)

- Advanced visualizations (D3.js)- 🔄 Advanced visualizations (D3.js)

- 🔄 User authentication

---

---

## 📊 Model Performance

## 📊 Model Performance

| Metric | Score | Target |

|--------|-------|--------|| Metric | Score | Target |

| **Recall** | 87.1% | >80% ✅ ||--------|-------|--------|

| **Precision** | 81.8% | - || **Recall** | 87.1% | >80% ✅ |

| **ROC-AUC** | 89.4% | - || **Precision** | 81.8% | - |

| **F1 Score** | 84.3% | - || **ROC-AUC** | 89.4% | - |

| **F1 Score** | 84.3% | - |

**Cross-Validation (5-Fold Stratified):**

- Mean Recall: 85.67% ± 1.87%**Cross-Validation (5-Fold Stratified):**

- All folds >83%- Mean Recall: 85.67% ± 1.87%

- ROC-AUC: 89.37% ± 0.41%- All folds >83%

- ROC-AUC: 89.37% ± 0.41%

**Training Data:** 9,201 Kepler samples (4,610 planets, 4,591 false positives)

**Training Data:** 9,201 Kepler samples (4,610 planets, 4,591 false positives)

---

---

## 🗂️ Project Structure

## 🗂️ Project Structure

```

nasa-exoplanet-detector/```

├── app_enhanced.py            # Enhanced Streamlit app (recommended)nasa-exoplanet-detector/

├── requirements.txt           # Python dependencies├── app.py                      # Original Streamlit app

├── PROJECT_SPEC.md           # Full technical specification├── app_enhanced.py            # Enhanced Streamlit app (recommended)

├── API_IMPLEMENTATION.md     # Backend implementation guide├── requirements.txt           # Python dependencies

│├── PROJECT_SPEC.md           # Full technical specification

├── data/                     # Raw astronomical data├── API_IMPLEMENTATION.md     # Backend implementation guide

│   ├── Keppler.csv          # Kepler mission (9,564 samples)│

│   ├── K2.csv               # K2 mission├── data/                     # Raw astronomical data

│   └── TESS.csv             # TESS mission│   ├── Keppler.csv          # Kepler mission (9,564 samples)

││   ├── K2.csv               # K2 mission

├── models/                   # Trained model artifacts│   └── TESS.csv             # TESS mission

│   ├── xgb.pkl              # XGBoost model│

│   ├── scaler.pkl           # Feature scaler├── models/                   # Trained model artifacts

│   ├── cv_fold_metrics.csv  # Cross-validation results│   ├── xgb.pkl              # XGBoost model

│   └── cv_predictions.csv   # Validation predictions│   ├── scaler.pkl           # Feature scaler

││   ├── cv_fold_metrics.csv  # Cross-validation results

├── src/                      # Core ML pipeline│   └── cv_predictions.csv   # Validation predictions

│   ├── preprocessing.py     # Data loading and cleaning│

│   ├── features.py          # Feature extraction├── src/                      # Core ML pipeline

│   ├── scaling.py           # Feature scaling utilities│   ├── preprocessing.py     # Data loading and cleaning

│   ├── train_xgb.py         # Training script│   ├── features.py          # Feature extraction

│   ├── cross_validate.py    # 5-fold CV script│   ├── scaling.py           # Feature scaling utilities

│   ├── data_diagnostic.py   # Data quality analysis│   ├── ml_model.py          # XGBoost training

│   └── model_diagnostic.py  # Model behavior analysis│   ├── cnn_model.py         # CNN architecture (future)

││   ├── ensemble.py          # Ensemble logic (future)

└── backend/                  # FastAPI application (in development)│   ├── train_xgb.py         # Training script

    └── (see API_IMPLEMENTATION.md)│   ├── cross_validate.py    # 5-fold CV script

```│   ├── data_diagnostic.py   # Data quality analysis

│   └── model_diagnostic.py  # Model behavior analysis

---│

├── notebooks/                # Jupyter notebooks

## 🔧 Usage Examples│   └── (exploratory analysis)

│

### Streamlit App├── backend/                  # FastAPI application (in development)

```bash│   ├── main.py              # FastAPI app

streamlit run app_enhanced.py│   ├── core/

# Upload CSV in browser → Adjust threshold → Download results│   │   ├── config.py        # Configuration

```│   │   └── model_registry.py # Model loading

│   ├── api/

### Python API (Direct)│   │   ├── predict.py       # Prediction endpoints

```python│   │   ├── models.py        # Model info endpoints

from src.preprocessing import load_csv, clean_data│   │   └── health.py        # Health check

from src.features import extract_features│   └── schemas/

from src.scaling import FeatureScaler│       ├── prediction.py    # Request/response schemas

import joblib│       └── response.py      # Additional schemas

│

# Load data└── frontend/                 # React application (teammate's work)

df = load_csv('data/Keppler.csv')    └── (coming soon)

df_clean = clean_data(df)```

df_features = extract_features(df_clean, mode='catalog')

---

# Load model

model = joblib.load('models/xgb.pkl')## � Usage Examples

scaler = FeatureScaler.load('models/scaler.pkl')

### Streamlit App

# Predict```bash

X = df_features.drop('label', axis=1)# Start app

X_scaled = scaler.transform(X)streamlit run app_enhanced.py

probabilities = model.predict_proba(X_scaled)[:, 1]

predictions = (probabilities >= 0.5).astype(int)# Upload CSV in browser

```# Adjust threshold slider

# View predictions and charts

---# Download results

```

## 📚 Documentation

### API (When Backend is Ready)

- **[PROJECT_SPEC.md](PROJECT_SPEC.md)** - Complete technical specification (frontend + backend)```bash

- **[API_IMPLEMENTATION.md](API_IMPLEMENTATION.md)** - Step-by-step backend guide# Predict exoplanets

- **[task.txt](task.txt)** - Original NASA challenge requirementscurl -X POST http://localhost:8000/api/predict \

  -F "file=@data/Keppler.csv" \

---  -F "model=xgb" \

  -F "threshold=0.5"

## 📂 Datasets & Research

# Get model metrics

### NASA Data Sourcescurl http://localhost:8000/api/models/xgb/metrics

- **[Kepler Objects of Interest (KOI)](https://exoplanetarchive.ipac.caltech.edu/docs/API_kepobjects.html)** - Confirmed planets, candidates, and false positives

- **[TESS Objects of Interest (TOI)](https://tess.mit.edu/science/toi/)** - TESS mission data# Feature importance

- **[K2 Planets and Candidates](https://exoplanetarchive.ipac.caltech.edu/docs/K2_objects.html)** - K2 mission datacurl http://localhost:8000/api/models/xgb/importance

```

### Research Articles

- **[Exoplanet Detection Using Machine Learning](https://arxiv.org/abs/2007.14348)** - Survey of ML approaches### Python API (Direct)

- **[Ensemble-Based ML for Exoplanet ID](https://arxiv.org/abs/2102.06730)** - Preprocessing and ensemble methods```python

from src.preprocessing import load_csv, clean_data

---from src.features import extract_features

from src.scaling import FeatureScaler

## 🧪 Developmentimport joblib



### Training Models# Load data

```bashdf = load_csv('data/Keppler.csv')

# Cross-validationdf_clean = clean_data(df)

python src/cross_validate.pydf_features = extract_features(df_clean, mode='catalog')



# Train and save model# Load model

python src/train_xgb.pymodel = joblib.load('models/xgb.pkl')

scaler = FeatureScaler.load('models/scaler.pkl')

# Run diagnostics

python src/model_diagnostic.py# Predict

```X = df_features.drop('label', axis=1)

X_scaled = scaler.transform(X)

---probabilities = model.predict_proba(X_scaled)[:, 1]

predictions = (probabilities >= 0.5).astype(int)

## 🌟 Key Technologies```[NASA Space Apps 2025](https://img.shields.io/badge/NASA%20Space%20Apps-2025-blue)](https://www.spaceappschallenge.org/)

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)

**Machine Learning:** XGBoost, scikit-learn, pandas, numpy  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Current Stack:** Streamlit, Plotly  

**Target Stack:** React 18 + TypeScript, FastAPI, Vite, TanStack Query, Recharts/D3.js### NASA Space Apps Challenge 2025



---**AI-powered exoplanet detection system** built by **Murema Manganyi**, **Thando**, and **Hlali**.



## 📈 Roadmap🎯 **Goal:** Help astronomers prioritize follow-up observations by identifying the most promising exoplanet candidates from Kepler/K2/TESS mission data using AI and machine learning.



### Phase 1: MVP ✅ (Complete)**Current Status:** ✅ **MVP Complete** - Working Streamlit app with 87% recall, now preparing production React + FastAPI architecture. Away: Hunting for Exoplanets with AI 🌌

- [x] XGBoost baseline model (87% recall)

- [x] Feature engineering pipeline### NASA Space Apps Challenge 2025

- [x] Streamlit UI with threshold slider

- [x] Cross-validation (85.67% ± 1.87%)This project was built for the 2025 NASA Space Apps Challenge by **Murema Manganyi**, **Thando**, and **Hlali**.

- [x] Clean CSV exports

Our goal is to explore how artificial intelligence and machine learning can be used to **automatically identify exoplanets** from space mission data — something that has mostly been done manually in the past.

### Phase 2: Backend 🔄 (In Progress)

- [ ] FastAPI REST APIWe’ll be using open datasets from **NASA’s Kepler, K2, and TESS missions**, and focusing on building a model that can classify data points as **confirmed exoplanets, planetary candidates, or false positives**.

- [ ] Model registry

- [ ] Batch processing---



### Phase 3: Advanced ML 🔜## 🧠 Project Overview

- [ ] 1D CNN for time-series

- [ ] Ensemble model (XGB + CNN)The challenge asks us to train a machine learning model on NASA’s open exoplanet datasets and design a **web interface** that makes it easier for scientists or enthusiasts to interact with the data.



### Phase 4: Production 🔜Our plan:

- [ ] React frontend

- [ ] Cloud deployment- Start with the **Kepler Objects of Interest (KOI)** dataset for initial model training.

- [ ] CI/CD pipeline- Experiment with supervised learning methods to classify new data points.

- Integrate a simple, interactive web interface that allows users to input new data and get predictions.

---- Evaluate accuracy and see how preprocessing choices affect model performance.



## 🤝 Contributing---



1. Fork the repository## 📂 Datasets & Resources

2. Create a feature branch (`git checkout -b feature/amazing-feature`)

3. Commit your changes (`git commit -m 'Add amazing feature'`)Below are the main resources we’re using to guide and inform our work.

4. Push to the branch (`git push origin feature/amazing-feature`)

5. Open a Pull Request### NASA Data & Resources



---- **Kepler Objects of Interest (KOI)**  

  Comprehensive list of confirmed exoplanets, planetary candidates, and false positives from the Kepler mission.  

## 📝 License  The `Disposition Using Kepler Data` column is used for classification.  

  [Download KOI dataset](https://exoplanetarchive.ipac.caltech.edu/docs/API_kepobjects.html)

This project is licensed under the MIT License.

- **TESS Objects of Interest (TOI)**  

---  Dataset containing confirmed exoplanets (KP), planetary candidates (PC), false positives (FP), and ambiguous planetary candidates (APC) from the TESS mission.  

  See the `TFOPWG Disposition` column for classification.  

## 🙏 Acknowledgments  [Download TOI dataset](https://tess.mit.edu/science/toi/)



- **NASA Exoplanet Archive** for datasets- **K2 Planets and Candidates**  

- **NASA Space Apps Challenge** for the opportunity  Covers all confirmed exoplanets, planetary candidates, and false positives captured by the K2 mission.  

- **scikit-learn & XGBoost teams** for ML libraries  The `Archive Disposition` column provides classification labels.  

- **Streamlit** for rapid prototyping  [Download K2 dataset](https://exoplanetarchive.ipac.caltech.edu/docs/K2_objects.html)



---### Research Articles



## 📧 Contact- **Exoplanet Detection Using Machine Learning**  

  Overview of exoplanetary detection methods and a survey of machine learning approaches used in the field up to 2021.  

**Team:** Murema Manganyi, Thando, Hlali    [Read Article](https://arxiv.org/abs/2007.14348)

**Challenge:** NASA Space Apps 2025 - Exoplanet Detection

- **Assessment of Ensemble-Based Machine Learning Algorithms for Exoplanet Identification**  

---  Discusses preprocessing and ensemble methods that have achieved strong results with the NASA exoplanet datasets.  

  [Read Article](https://arxiv.org/abs/2102.06730)

<div align="center">

---

**Built with ❤️ for NASA Space Apps 2025**

## 🚀 Tech Stack

*"Finding new worlds, one prediction at a time."* 🌍✨

- Python (pandas, scikit-learn, TensorFlow / PyTorch)  

</div>- Flask or Streamlit for the web interface  

- NASA Exoplanet Archive datasets  
- Jupyter Notebook for exploration and model testing

---

## 🪐 Goals

- Build a working ML model that can classify exoplanet data with good accuracy.  
- Make the model accessible through a clean, simple web interface.  
- Highlight how AI can accelerate exoplanet discovery using real NASA data.

---

## 🏁 Getting Started

Follow these steps to set up the project locally:

1. **Clone this repository**
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # macOS/Linux
   venv\Scripts\activate     # Windows
3. **Install dependencies**
    ```bash
    pip install -r requirements.txt
4. **Download Datasets
   - KOI (Kepler Objects of Interest): [Download here](https://exoplanetarchive.ipac.caltech.edu/docs/API_kepobjects.html)
  - TOI (TESS Objects of Interest): [Download here](https://tess.mit.edu/science/toi/)
  - K2 Planets and Candidates: [Download here](https://exoplanetarchive.ipac.caltech.edu/docs/K2_objects.html)
5. 


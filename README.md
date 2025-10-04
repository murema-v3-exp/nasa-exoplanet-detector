# A World Away: Hunting for Exoplanets with AI 🌌

### NASA Space Apps Challenge 2025

This project was built for the 2025 NASA Space Apps Challenge by **Murema Manganyi**, **Thando**, and **Hlali**.

Our goal is to explore how artificial intelligence and machine learning can be used to **automatically identify exoplanets** from space mission data — something that has mostly been done manually in the past.

We’ll be using open datasets from **NASA’s Kepler, K2, and TESS missions**, and focusing on building a model that can classify data points as **confirmed exoplanets, planetary candidates, or false positives**.

---

## 🧠 Project Overview

The challenge asks us to train a machine learning model on NASA’s open exoplanet datasets and design a **web interface** that makes it easier for scientists or enthusiasts to interact with the data.

Our plan:

- Start with the **Kepler Objects of Interest (KOI)** dataset for initial model training.
- Experiment with supervised learning methods to classify new data points.
- Integrate a simple, interactive web interface that allows users to input new data and get predictions.
- Evaluate accuracy and see how preprocessing choices affect model performance.

---

## 📂 Datasets & Resources

Below are the main resources we’re using to guide and inform our work.

### NASA Data & Resources

- **Kepler Objects of Interest (KOI)**  
  Comprehensive list of confirmed exoplanets, planetary candidates, and false positives from the Kepler mission.  
  The `Disposition Using Kepler Data` column is used for classification.  
  [Download KOI dataset](https://exoplanetarchive.ipac.caltech.edu/docs/API_kepobjects.html)

- **TESS Objects of Interest (TOI)**  
  Dataset containing confirmed exoplanets (KP), planetary candidates (PC), false positives (FP), and ambiguous planetary candidates (APC) from the TESS mission.  
  See the `TFOPWG Disposition` column for classification.  
  [Download TOI dataset](https://tess.mit.edu/science/toi/)

- **K2 Planets and Candidates**  
  Covers all confirmed exoplanets, planetary candidates, and false positives captured by the K2 mission.  
  The `Archive Disposition` column provides classification labels.  
  [Download K2 dataset](https://exoplanetarchive.ipac.caltech.edu/docs/K2_objects.html)

### Research Articles

- **Exoplanet Detection Using Machine Learning**  
  Overview of exoplanetary detection methods and a survey of machine learning approaches used in the field up to 2021.  
  [Read Article](https://arxiv.org/abs/2007.14348)

- **Assessment of Ensemble-Based Machine Learning Algorithms for Exoplanet Identification**  
  Discusses preprocessing and ensemble methods that have achieved strong results with the NASA exoplanet datasets.  
  [Read Article](https://arxiv.org/abs/2102.06730)

---

## 🚀 Tech Stack

- Python (pandas, scikit-learn, TensorFlow / PyTorch)  
- Flask or Streamlit for the web interface  
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


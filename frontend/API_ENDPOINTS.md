# NASA Exoplanet Hunter API Endpoints

**Base URL:** `http://localhost:8000`  
**API Version:** `v1`  
**API Prefix:** `/api`

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Prediction Endpoints](#prediction-endpoints)
5. [Model Information](#model-information)
6. [Health & Status](#health--status)
7. [Error Handling](#error-handling)
8. [Frontend Integration Examples](#frontend-integration-examples)

---

## Quick Start

```bash
# Start the API server
cd /Volumes/T_DRV/development/NASA_APP_CHALLENGE/nasa-exoplanet-detector
./venv/bin/python backend/main.py

# API will be available at:
# - Swagger UI: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
```

## Authentication

**No authentication required** - This is an open research API.

## Core Endpoints

### 1. Root Information

```http
GET /
```

**Response:**

```json
{
    "message": "NASA Exoplanet Hunter API",
    "version": "1.0.0",
    "docs": "/docs",
    "health": "/api/health"
}
```

---

## Prediction Endpoints

### 2. Predict Exoplanets from CSV

```http
POST /api/predict
Content-Type: multipart/form-data
```

**Parameters:**

-   `file` (required): CSV file with exoplanet data
-   `model` (optional): Model name (default: "xgb")
    -   `"xgb"` - XGBoost baseline model ✅
    -   `"cnn"` - 1D CNN model (future)
    -   `"ensemble"` - Ensemble model (future)
-   `threshold` (optional): Classification threshold 0.0-1.0 (default: 0.5)

**Example Request (JavaScript):**

```javascript
const formData = new FormData();
formData.append("file", csvFile);
formData.append("model", "xgb");
formData.append("threshold", "0.7");

const response = await fetch("/api/predict", {
    method: "POST",
    body: formData,
});
```

**Response (200 OK):**

```json
{
    "success": true,
    "model_used": "xgb",
    "threshold": 0.7,
    "total_samples": 1500,
    "predictions": [
        {
            "id": "K00001.01",
            "prediction": "PLANET",
            "probability": 0.89,
            "features": {
                "orbital_period": 3.52,
                "planet_radius": 1.2,
                "transit_duration": 2.4
            }
        }
    ],
    "summary": {
        "predicted_planets": 142,
        "false_positives": 1358,
        "mean_probability": 0.34,
        "high_confidence_count": 89
    },
    "processing_time_ms": 1847.3
}
```

**CSV File Requirements:**

-   Kepler/K2/TESS format with standard columns
-   Comments starting with `#` are ignored
-   Must contain required features for classification

---

## Model Information

### 3. List Available Models

```http
GET /api/models
```

**Response:**

```json
{
    "models": [
        {
            "id": "xgb",
            "name": "XGBoost Baseline",
            "type": "gradient_boosting",
            "status": "ready",
            "performance": {
                "recall": 0.871,
                "roc_auc": 0.894
            },
            "note": ""
        },
        {
            "id": "cnn",
            "name": "1D CNN (Time-Series)",
            "type": "deep_learning",
            "status": "pending",
            "performance": {},
            "note": "Requires time-series flux data"
        },
        {
            "id": "ensemble",
            "name": "Ensemble (XGB + CNN)",
            "type": "ensemble",
            "status": "pending",
            "performance": {},
            "note": "Coming in Phase 3"
        }
    ]
}
```

### 4. Get Model Performance Metrics

```http
GET /api/models/{model_id}/metrics
```

**Example:** `GET /api/models/xgb/metrics`

**Response:**

```json
{
    "model": "xgb",
    "performance": {
        "accuracy": 0.843,
        "precision": 0.818,
        "recall": 0.871,
        "f1_score": 0.843,
        "roc_auc": 0.894
    },
    "cross_validation": {
        "n_folds": 5,
        "mean_recall": 0.8567,
        "std_recall": 0.0187
    },
    "training_date": "2025-10-04",
    "training_samples": 9201
}
```

### 5. Get Feature Importance

```http
GET /api/models/{model_id}/importance
```

**Example:** `GET /api/models/xgb/importance`

**Response:**

```json
{
    "model": "xgb",
    "features": [
        {
            "name": "koi_period",
            "importance": 0.247,
            "rank": 1
        },
        {
            "name": "koi_prad",
            "importance": 0.198,
            "rank": 2
        },
        {
            "name": "koi_duration",
            "importance": 0.156,
            "rank": 3
        }
    ]
}
```

---

## Health & Status

### 6. Health Check

```http
GET /api/health
```

**Response:**

```json
{
    "status": "healthy",
    "models_loaded": ["xgb"],
    "version": "1.0.0",
    "uptime_seconds": 3847.2
}
```

---

## Error Handling

### HTTP Status Codes

-   `200` - Success
-   `400` - Bad Request (invalid file, parameters)
-   `404` - Not Found (model doesn't exist)
-   `422` - Validation Error
-   `500` - Internal Server Error

### Error Response Format

```json
{
    "success": false,
    "error": "File must be a CSV",
    "detail": "Uploaded file has extension .txt, expected .csv"
}
```

### Common Errors

1. **Invalid File Type**

```json
{
    "success": false,
    "error": "File must be a CSV"
}
```

2. **Model Not Found**

```json
{
    "success": false,
    "error": "Model 'invalid_model' not found",
    "detail": "Available models: ['xgb']"
}
```

3. **Invalid Threshold**

```json
{
    "success": false,
    "error": "Threshold must be between 0.0 and 1.0"
}
```

4. **No Valid Samples**

```json
{
    "success": false,
    "error": "No valid samples found in file",
    "detail": "Check CSV format and required columns"
}
```

---

## Frontend Integration Examples

### React/TypeScript Integration

```typescript
// types/api.ts
interface PredictionResponse {
    success: boolean;
    model_used: string;
    threshold: number;
    total_samples: number;
    predictions: Prediction[];
    summary: PredictionSummary;
    processing_time_ms: number;
}

interface Prediction {
    id: string;
    prediction: "PLANET" | "FALSE POSITIVE";
    probability: number;
    features: Record<string, number>;
}

// services/api.ts
class ExoplanetAPI {
    private baseUrl = "http://localhost:8000";

    async predictExoplanets(
        file: File,
        model: string = "xgb",
        threshold: number = 0.5
    ): Promise<PredictionResponse> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", model);
        formData.append("threshold", threshold.toString());

        const response = await fetch(`${this.baseUrl}/api/predict`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    }

    async getModels() {
        const response = await fetch(`${this.baseUrl}/api/models`);
        return response.json();
    }

    async getModelMetrics(modelId: string) {
        const response = await fetch(
            `${this.baseUrl}/api/models/${modelId}/metrics`
        );
        return response.json();
    }

    async getHealth() {
        const response = await fetch(`${this.baseUrl}/api/health`);
        return response.json();
    }
}
```

### Vue.js Integration

```javascript
// composables/useAPI.js
export function useExoplanetAPI() {
    const baseUrl = "http://localhost:8000";

    const predictExoplanets = async (file, options = {}) => {
        const { model = "xgb", threshold = 0.5 } = options;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", model);
        formData.append("threshold", threshold);

        const response = await $fetch("/api/predict", {
            method: "POST",
            body: formData,
            baseURL: baseUrl,
        });

        return response;
    };

    return {
        predictExoplanets,
        getModels: () => $fetch("/api/models", { baseURL: baseUrl }),
        getHealth: () => $fetch("/api/health", { baseURL: baseUrl }),
    };
}
```

### Python Client Integration

```python
import requests
import json

class ExoplanetClient:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url

    def predict(self, csv_file_path, model='xgb', threshold=0.5):
        """Predict exoplanets from CSV file"""
        with open(csv_file_path, 'rb') as f:
            files = {'file': f}
            data = {'model': model, 'threshold': threshold}

            response = requests.post(
                f'{self.base_url}/api/predict',
                files=files,
                data=data
            )

        return response.json()

    def get_models(self):
        """Get available models"""
        response = requests.get(f'{self.base_url}/api/models')
        return response.json()

    def get_health(self):
        """Health check"""
        response = requests.get(f'{self.base_url}/api/health')
        return response.json()

# Usage
client = ExoplanetClient()
result = client.predict('data/test_sample.csv', model='xgb', threshold=0.7)
print(f"Found {result['summary']['predicted_planets']} potential planets!")
```

---

## Configuration

### CORS Settings

The API allows requests from:

-   `http://localhost:3000` (React dev server)
-   `http://localhost:5173` (Vite dev server)
-   `http://localhost:8501` (Streamlit)
-   `http://localhost:8502` (Additional)

### File Upload Limits

-   **Max file size:** 50 MB
-   **Supported formats:** CSV only
-   **Encoding:** UTF-8 recommended

### Performance Notes

-   **Small files** (<1000 rows): ~100ms processing time
-   **Medium files** (1000-10000 rows): ~1-3s processing time
-   **Large files** (>10000 rows): ~3-10s processing time

---

## Development & Testing

### Start API Server

```bash
cd /Volumes/T_DRV/development/NASA_APP_CHALLENGE/nasa-exoplanet-detector
./venv/bin/python backend/main.py
```

### Test with curl

```bash
# Health check
curl http://localhost:8000/api/health

# Upload test file
curl -X POST \
  -F "file=@data/Keppler.csv" \
  -F "model=xgb" \
  -F "threshold=0.7" \
  http://localhost:8000/api/predict
```

### Interactive Documentation

-   **Swagger UI:** http://localhost:8000/docs
-   **ReDoc:** http://localhost:8000/redoc

---

## Next Steps for Frontend Development

1. **Choose Framework:** React, Vue, or vanilla JavaScript
2. **Set up project structure** with the API client
3. **Create components:**
    - File upload component
    - Model selection dropdown
    - Threshold slider
    - Results visualization (charts, tables)
    - Loading states and error handling
4. **Implement real-time features:**
    - Progress indicators
    - Websocket for large file processing (future)
5. **Add data visualization:**
    - Prediction probability histograms
    - Feature importance charts
    - Interactive sample explorer

🚀 **Ready to build an amazing exoplanet discovery UI!** 🌌

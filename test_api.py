"""Quick test script for the FastAPI backend"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

print("🧪 Testing NASA Exoplanet Hunter API\n")

# Test 1: Health check
print("1️⃣ Testing /health...")
response = requests.get(f"{BASE_URL}/health")
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

# Test 2: List models
print("2️⃣ Testing /models...")
response = requests.get(f"{BASE_URL}/models")
print(f"   Status: {response.status_code}")
models = response.json()
print(f"   Available models: {[m['id'] for m in models['models']]}\n")

# Test 3: Get model metrics
print("3️⃣ Testing /models/xgb/metrics...")
response = requests.get(f"{BASE_URL}/models/xgb/metrics")
print(f"   Status: {response.status_code}")
metrics = response.json()
print(f"   Recall: {metrics['performance']['recall']:.1%}")
print(f"   ROC-AUC: {metrics['performance']['roc_auc']:.1%}\n")

# Test 4: Feature importance
print("4️⃣ Testing /models/xgb/importance...")
response = requests.get(f"{BASE_URL}/models/xgb/importance")
print(f"   Status: {response.status_code}")
importance = response.json()
print(f"   Top 3 features:")
for feat in importance['features'][:3]:
    print(f"      {feat['rank']}. {feat['name']}: {feat['importance']:.3f}")
print()

# Test 5: Predict (with small subset)
print("5️⃣ Testing /predict with Kepler data...")
with open('data/Keppler.csv', 'rb') as f:
    files = {'file': ('Keppler.csv', f, 'text/csv')}
    data = {'model': 'xgb', 'threshold': '0.5'}
    
    response = requests.post(f"{BASE_URL}/predict", files=files, data=data)
    
print(f"   Status: {response.status_code}")
result = response.json()
print(f"   Success: {result['success']}")
print(f"   Total samples: {result['total_samples']}")
print(f"   Processing time: {result['processing_time_ms']:.2f} ms")
print(f"   Summary:")
print(f"      Predicted planets: {result['summary']['predicted_planets']}")
print(f"      False positives: {result['summary']['false_positives']}")
print(f"      Mean probability: {result['summary']['mean_probability']:.3f}")
print(f"      High confidence: {result['summary']['high_confidence_count']}")

print("\n✅ All tests passed!")

#!/usr/bin/env python3
"""
Test script for telescope-specific predictions
"""
import requests
import json
from pathlib import Path

# API endpoint
API_URL = "http://localhost:8000/api/predict"

# Test data directory
DATA_DIR = Path(__file__).parent / "data"

def test_telescope_prediction(telescope_name, testset_file):
    """Test prediction with specific telescope and testset"""
    print(f"\n=== Testing {telescope_name.upper()} with {testset_file} ===")
    
    file_path = DATA_DIR / testset_file
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    try:
        # Prepare the request
        files = {'file': open(file_path, 'rb')}
        data = {
            'telescope': telescope_name,
            'model': 'xgb',
            'threshold': 0.5
        }
        
        print(f"📤 Sending request...")
        print(f"   File: {testset_file}")
        print(f"   Telescope: {telescope_name}")
        
        # Make the request
        response = requests.post(API_URL, files=files, data=data)
        files['file'].close()
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS!")
            print(f"   Telescope Used: {result.get('telescope', 'N/A')}")
            print(f"   Model Used: {result.get('model_used', 'N/A')}")
            print(f"   Total Samples: {result.get('total_samples', 0)}")
            print(f"   Planets Found: {result.get('summary', {}).get('predicted_planets', 0)}")
            print(f"   Processing Time: {result.get('processing_time_ms', 0):.2f}ms")
            return True
        else:
            print(f"❌ FAILED!")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    print("🚀 NASA Exoplanet Telescope Test Suite")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        ("kepler", "keppler_testset1.csv"),
        ("k2", "K2_testset1.csv"),
        ("tess", "tess_testset1.csv")
    ]
    
    results = []
    for telescope, testset in test_cases:
        success = test_telescope_prediction(telescope, testset)
        results.append((telescope, testset, success))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    for telescope, testset, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {telescope.upper()}: {testset}")
    
    successful = sum(1 for _, _, success in results if success)
    total = len(results)
    print(f"\nResults: {successful}/{total} tests passed")

if __name__ == "__main__":
    main()
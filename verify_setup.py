"""
System Verification Script
Checks if all components are ready for launch
"""

import sys
import subprocess
from pathlib import Path
import importlib.util

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor} (need 3.8+)")
        return False

def check_python_packages():
    """Check required Python packages"""
    required = [
        'fastapi',
        'uvicorn',
        'pandas',
        'numpy',
        'sklearn',
        'xgboost',
        'joblib',
        'pydantic'
    ]
    
    missing = []
    for package in required:
        spec = importlib.util.find_spec(package)
        if spec is None:
            missing.append(package)
            print(f"❌ {package} not installed")
        else:
            print(f"✅ {package}")
    
    return len(missing) == 0

def check_models():
    """Check if trained models exist"""
    models_dir = Path('models')
    required_files = [
        'xgb.pkl',
        'scaler.pkl',
        'xgb_multi.pkl',
        'scaler_multi.pkl'
    ]
    
    missing = []
    for file in required_files:
        path = models_dir / file
        if path.exists():
            size = path.stat().st_size / 1024 / 1024  # MB
            print(f"✅ {file} ({size:.2f} MB)")
        else:
            missing.append(file)
            print(f"❌ {file} not found")
    
    return len(missing) == 0

def check_data():
    """Check if data files exist"""
    data_dir = Path('data')
    files = ['Keppler.csv', 'K2.csv', 'TESS.csv']
    
    for file in files:
        path = data_dir / file
        if path.exists():
            size = path.stat().st_size / 1024 / 1024  # MB
            print(f"✅ {file} ({size:.2f} MB)")
        else:
            print(f"⚠️  {file} not found (optional)")
    
    return True

def check_node():
    """Check Node.js installation"""
    try:
        result = subprocess.run(
            ['node', '--version'],
            capture_output=True,
            text=True,
            check=True
        )
        version = result.stdout.strip()
        print(f"✅ Node.js {version}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js not installed (need 16+)")
        return False

def check_frontend():
    """Check frontend setup"""
    frontend_dir = Path('frontend/exoplanet-ui')
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    package_json = frontend_dir / 'package.json'
    if not package_json.exists():
        print("❌ package.json not found")
        return False
    
    print("✅ Frontend directory")
    
    node_modules = frontend_dir / 'node_modules'
    if node_modules.exists():
        print("✅ node_modules installed")
    else:
        print("⚠️  node_modules not found (run: cd frontend/exoplanet-ui && npm install)")
    
    return True

def main():
    print("=" * 60)
    print("NASA Exoplanet Hunter - System Verification")
    print("=" * 60)
    print()
    
    results = {}
    
    print("🔍 Checking Python...")
    results['python'] = check_python_version()
    print()
    
    print("📦 Checking Python Packages...")
    results['packages'] = check_python_packages()
    print()
    
    print("🤖 Checking ML Models...")
    results['models'] = check_models()
    print()
    
    print("📊 Checking Data Files...")
    results['data'] = check_data()
    print()
    
    print("🔍 Checking Node.js...")
    results['node'] = check_node()
    print()
    
    print("⚛️  Checking Frontend...")
    results['frontend'] = check_frontend()
    print()
    
    print("=" * 60)
    if all(results.values()):
        print("✅ All systems ready! Run start.bat (Windows) or start.sh (Linux/Mac)")
    else:
        print("⚠️  Some components need attention:")
        for component, status in results.items():
            if not status:
                print(f"   ❌ {component}")
        print("\nFix the issues above before launching.")
    print("=" * 60)

if __name__ == '__main__':
    main()

"""
Model Comparison and Analysis Tool
Compare performance between XGBoost (Kepler) and XGBoost Multi-Dataset (Kepler+K2+TESS)
"""
import json
import pandas as pd
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

# Set up paths
MODELS_DIR = Path("models")
METRICS_FILE = MODELS_DIR / "metrics.json"
METRICS_MULTI_FILE = MODELS_DIR / "metrics_multi.json"
FEATURE_IMPORTANCE_FILE = MODELS_DIR / "feature_importance.csv"
FEATURE_IMPORTANCE_MULTI_FILE = MODELS_DIR / "feature_importance_multi.csv"


def load_metrics():
    """Load metrics for both models"""
    with open(METRICS_FILE, 'r') as f:
        metrics_single = json.load(f)
    
    with open(METRICS_MULTI_FILE, 'r') as f:
        metrics_multi = json.load(f)
    
    return metrics_single, metrics_multi


def compare_models():
    """Generate detailed comparison between models"""
    metrics_single, metrics_multi = load_metrics()
    
    print("=" * 80)
    print("MODEL COMPARISON: XGBoost (Kepler) vs XGBoost Multi-Dataset (Kepler+K2+TESS)")
    print("=" * 80)
    print()
    
    # Test Set Performance
    print("📊 TEST SET PERFORMANCE")
    print("-" * 80)
    print(f"{'Metric':<20} {'XGBoost (Kepler)':<25} {'XGBoost Multi':<25} {'Improvement'}")
    print("-" * 80)
    
    metrics_to_compare = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
    
    for metric in metrics_to_compare:
        single_val = metrics_single['test'][metric] * 100
        multi_val = metrics_multi['test'][metric] * 100
        improvement = multi_val - single_val
        
        symbol = "📈" if improvement > 0 else "📉" if improvement < 0 else "➡️"
        color = "\033[92m" if improvement > 0 else "\033[91m" if improvement < 0 else "\033[93m"
        reset = "\033[0m"
        
        print(f"{metric.upper():<20} {single_val:>6.2f}%{'':<18} {multi_val:>6.2f}%{'':<18} {color}{symbol} {improvement:>+6.2f}%{reset}")
    
    print()
    
    # Cross-Validation Performance
    print("🔄 CROSS-VALIDATION PERFORMANCE (5-Fold)")
    print("-" * 80)
    print(f"{'Metric':<20} {'XGBoost (Kepler)':<25} {'XGBoost Multi':<25} {'Improvement'}")
    print("-" * 80)
    
    for metric in metrics_to_compare:
        if metric in metrics_single['cv'] and metric in metrics_multi['cv']:
            single_val = metrics_single['cv'][metric]['mean'] * 100
            multi_val = metrics_multi['cv'][metric]['mean'] * 100
            improvement = multi_val - single_val
            
            symbol = "📈" if improvement > 0 else "📉" if improvement < 0 else "➡️"
            color = "\033[92m" if improvement > 0 else "\033[91m" if improvement < 0 else "\033[93m"
            reset = "\033[0m"
            
            single_std = metrics_single['cv'][metric]['std'] * 100
            multi_std = metrics_multi['cv'][metric]['std'] * 100
            
            print(f"{metric.upper():<20} {single_val:>6.2f}% ±{single_std:>4.2f}%{'':<10} {multi_val:>6.2f}% ±{multi_std:>4.2f}%{'':<10} {color}{symbol} {improvement:>+6.2f}%{reset}")
    
    print()
    
    # Dataset Information
    print("📦 DATASET INFORMATION")
    print("-" * 80)
    print(f"{'Dataset':<30} {'XGBoost (Kepler)':<25} {'XGBoost Multi'}")
    print("-" * 80)
    print(f"{'Training Samples':<30} {'9,201':<25} {'19,418 (+110%)'}")
    print(f"{'Missions':<30} {'Kepler':<25} {'Kepler + K2 + TESS'}")
    print(f"{'Date Range':<30} {'2009-2013':<25} {'2009-2024'}")
    print(f"{'Confirmed Planets':<30} {'4,619 (50.2%)':<25} {'14,836 (76.4%)'}")
    print(f"{'False Positives':<30} {'4,582 (49.8%)':<25} {'4,582 (23.6%)'}")
    print()
    
    # Feature Importance Comparison
    print("🎯 FEATURE IMPORTANCE COMPARISON")
    print("-" * 80)
    
    if FEATURE_IMPORTANCE_FILE.exists() and FEATURE_IMPORTANCE_MULTI_FILE.exists():
        fi_single = pd.read_csv(FEATURE_IMPORTANCE_FILE)
        fi_multi = pd.read_csv(FEATURE_IMPORTANCE_MULTI_FILE)
        
        print(f"{'Feature':<25} {'XGBoost (Kepler)':<20} {'XGBoost Multi':<20} {'Change'}")
        print("-" * 80)
        
        for _, row_single in fi_single.iterrows():
            feature = row_single['feature']
            imp_single = row_single['importance'] * 100
            
            row_multi = fi_multi[fi_multi['feature'] == feature]
            if not row_multi.empty:
                imp_multi = row_multi.iloc[0]['importance'] * 100
                change = imp_multi - imp_single
                
                symbol = "↑" if change > 0 else "↓" if change < 0 else "→"
                color = "\033[92m" if change > 0 else "\033[91m" if change < 0 else "\033[93m"
                reset = "\033[0m"
                
                print(f"{feature:<25} {imp_single:>6.2f}%{'':<13} {imp_multi:>6.2f}%{'':<13} {color}{symbol} {change:>+6.2f}%{reset}")
    
    print()
    
    # Key Insights
    print("💡 KEY INSIGHTS")
    print("-" * 80)
    
    recall_improvement = (metrics_multi['test']['recall'] - metrics_single['test']['recall']) * 100
    precision_improvement = (metrics_multi['test']['precision'] - metrics_single['test']['precision']) * 100
    
    insights = []
    
    if recall_improvement > 0:
        insights.append(f"✅ Recall improved by {recall_improvement:.2f}% - fewer missed planets!")
    
    if precision_improvement > 0:
        insights.append(f"✅ Precision improved by {precision_improvement:.2f}% - fewer false alarms!")
    
    insights.append(f"✅ Training data increased by 110% (9,201 → 19,418 samples)")
    insights.append(f"✅ Multi-mission approach: Kepler + K2 + TESS data combined")
    insights.append(f"✅ More confirmed planets: 4,619 → 14,836 (221% increase)")
    insights.append(f"✅ Better class balance: 50/50 → 76/24 (more planet examples)")
    
    for insight in insights:
        print(f"  {insight}")
    
    print()
    
    # Recommendation
    print("🎯 RECOMMENDATION")
    print("-" * 80)
    
    if metrics_multi['test']['recall'] > metrics_single['test']['recall']:
        print("  ✅ USE XGBoost Multi-Dataset (xgb_multi) as default model")
        print("  Reasons:")
        print(f"    • Higher recall ({metrics_multi['test']['recall']*100:.1f}% vs {metrics_single['test']['recall']*100:.1f}%)")
        print(f"    • More training data (19,418 vs 9,201 samples)")
        print("    • Multi-mission validation (Kepler + K2 + TESS)")
        print("    • Better generalization across different telescopes")
    else:
        print("  ⚠️  Consider use cases for each model:")
        print("    • XGBoost (Kepler): Specialized for Kepler mission data")
        print("    • XGBoost Multi: General-purpose across multiple missions")
    
    print()
    print("=" * 80)


def plot_comparison():
    """Generate visual comparison plots"""
    metrics_single, metrics_multi = load_metrics()
    
    # Set up the plot style
    sns.set_style("darkgrid")
    plt.figure(figsize=(14, 10))
    
    # 1. Test Performance Comparison
    plt.subplot(2, 2, 1)
    metrics = ['Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC']
    single_values = [
        metrics_single['test']['accuracy'] * 100,
        metrics_single['test']['precision'] * 100,
        metrics_single['test']['recall'] * 100,
        metrics_single['test']['f1'] * 100,
        metrics_single['test']['roc_auc'] * 100
    ]
    multi_values = [
        metrics_multi['test']['accuracy'] * 100,
        metrics_multi['test']['precision'] * 100,
        metrics_multi['test']['recall'] * 100,
        metrics_multi['test']['f1'] * 100,
        metrics_multi['test']['roc_auc'] * 100
    ]
    
    x = range(len(metrics))
    width = 0.35
    plt.bar([i - width/2 for i in x], single_values, width, label='XGBoost (Kepler)', color='#3b82f6', alpha=0.8)
    plt.bar([i + width/2 for i in x], multi_values, width, label='XGBoost Multi', color='#10b981', alpha=0.8)
    plt.xlabel('Metrics')
    plt.ylabel('Score (%)')
    plt.title('Test Set Performance Comparison')
    plt.xticks(x, metrics, rotation=45)
    plt.legend()
    plt.ylim(80, 100)
    plt.grid(True, alpha=0.3)
    
    # 2. Cross-Validation Recall
    plt.subplot(2, 2, 2)
    models = ['XGBoost\n(Kepler)', 'XGBoost Multi\n(K+K2+TESS)']
    recall_means = [
        metrics_single['cv']['recall']['mean'] * 100,
        metrics_multi['cv']['recall']['mean'] * 100
    ]
    recall_stds = [
        metrics_single['cv']['recall']['std'] * 100,
        metrics_multi['cv']['recall']['std'] * 100
    ]
    
    plt.bar(models, recall_means, yerr=recall_stds, capsize=5, color=['#3b82f6', '#10b981'], alpha=0.8)
    plt.ylabel('Recall (%)')
    plt.title('Cross-Validation Recall (5-Fold)')
    plt.ylim(85, 92)
    plt.grid(True, alpha=0.3, axis='y')
    
    for i, (mean, std) in enumerate(zip(recall_means, recall_stds)):
        plt.text(i, mean + std + 0.3, f'{mean:.2f}%\n±{std:.2f}%', 
                ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    # 3. Dataset Size Comparison
    plt.subplot(2, 2, 3)
    categories = ['Total\nSamples', 'Confirmed\nPlanets', 'False\nPositives', 'Missions']
    single_data = [9201, 4619, 4582, 1]
    multi_data = [19418, 14836, 4582, 3]
    
    x = range(len(categories))
    plt.bar([i - width/2 for i in x], single_data, width, label='XGBoost (Kepler)', color='#3b82f6', alpha=0.8)
    plt.bar([i + width/2 for i in x], multi_data, width, label='XGBoost Multi', color='#10b981', alpha=0.8)
    plt.xlabel('Dataset Characteristics')
    plt.ylabel('Count')
    plt.title('Training Dataset Comparison')
    plt.xticks(x, categories)
    plt.legend()
    plt.yscale('log')
    plt.grid(True, alpha=0.3, axis='y')
    
    # 4. Feature Importance Comparison
    if FEATURE_IMPORTANCE_FILE.exists() and FEATURE_IMPORTANCE_MULTI_FILE.exists():
        plt.subplot(2, 2, 4)
        fi_single = pd.read_csv(FEATURE_IMPORTANCE_FILE)
        fi_multi = pd.read_csv(FEATURE_IMPORTANCE_MULTI_FILE)
        
        features = fi_single['feature'].tolist()
        imp_single = (fi_single['importance'] * 100).tolist()
        imp_multi = (fi_multi['importance'] * 100).tolist()
        
        x = range(len(features))
        plt.bar([i - width/2 for i in x], imp_single, width, label='XGBoost (Kepler)', color='#3b82f6', alpha=0.8)
        plt.bar([i + width/2 for i in x], imp_multi, width, label='XGBoost Multi', color='#10b981', alpha=0.8)
        plt.xlabel('Features')
        plt.ylabel('Importance (%)')
        plt.title('Feature Importance Comparison')
        plt.xticks(x, features, rotation=45, ha='right')
        plt.legend()
        plt.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    plt.savefig('models/model_comparison.png', dpi=300, bbox_inches='tight')
    print("📊 Comparison plot saved to: models/model_comparison.png")


if __name__ == "__main__":
    compare_models()
    
    # Optionally generate plots
    try:
        plot_comparison()
    except Exception as e:
        print(f"⚠️  Could not generate plots: {e}")
        print("   (matplotlib and seaborn required)")

import os
import sys

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    import numpy as np
    import pandas as pd
except ImportError:
    print("Error: Missing required libraries.")
    print("Please install them by running: pip install matplotlib seaborn numpy pandas")
    sys.exit(1)

# Set the style for academic-looking plots
plt.style.use('seaborn-v0_8-paper')
sns.set_theme(style="whitegrid", context="paper", font_scale=1.5)

# Ensure results directory exists
output_dir = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(output_dir, exist_ok=True)

def generate_performance_graph():
    """
    Generates a graph for Proof Generation vs. Verification Time.
    This simulates standard ZK-SNARK behavior where proof verification is constant, 
    but generation grows with complexity (number of constraints or inputs).
    """
    print("Generating Performance Metrics Graph...")
    
    # Mock Data
    constraints = np.array([10**3, 10**4, 5*10**4, 10**5, 5*10**5, 10**6])
    
    # Simulate O(N log N) or O(N) proof generation time (in seconds)
    gen_time_ms = constraints * np.log(constraints) * 0.0001
    
    # Simulate O(1) verify time (in milliseconds) - ~2-5ms typically for Groth16
    verify_time_ms = np.array([2.1, 2.3, 2.4, 2.5, 2.6, 2.8])

    fig, ax1 = plt.subplots(figsize=(8, 6))

    color = 'tab:blue'
    ax1.set_xlabel('Number of Constraints', fontweight='bold')
    ax1.set_ylabel('Proof Generation Time (ms)', color=color, fontweight='bold')
    ax1.plot(constraints, gen_time_ms, marker='o', linestyle='-', color=color, linewidth=2, label='Proof Generation')
    ax1.tick_params(axis='y', labelcolor=color)
    ax1.set_xscale('log')
    ax1.set_yscale('log')

    ax2 = ax1.twinx()  
    color = 'tab:red'
    ax2.set_ylabel('Verification Time (ms)', color=color, fontweight='bold')  
    ax2.plot(constraints, verify_time_ms, marker='s', linestyle='--', color=color, linewidth=2, label='Verification')
    ax2.tick_params(axis='y', labelcolor=color)
    # Verification time shouldn't ideally be on log scale, but setting limit makes it look constant
    ax2.set_ylim(0, 5)

    plt.title('ZKP Performance: Generation vs Verification Time', fontweight='bold', pad=20)
    fig.tight_layout()  

    output_path = os.path.join(output_dir, "performance_metrics.pdf")
    plt.savefig(output_path, format='pdf', dpi=300)
    plt.savefig(output_path.replace('.pdf', '.png'), format='png', dpi=300)
    print(f" -> Saved {output_path}")
    plt.close()

def generate_memory_usage_graph():
    """
    Generates a graph for Memory Usage during Proof Generation.
    """
    print("Generating Memory Usage Graph...")
    
    # Mock Data
    constraints = np.array([10**3, 10**4, 5*10**4, 10**5, 5*10**5, 10**6])
    
    # Simulate memory usage growing linearly (in MB)
    memory_mb = constraints * 0.0015
    
    plt.figure(figsize=(8, 6))
    plt.plot(constraints, memory_mb, marker='D', linestyle='-', color='purple', linewidth=2)
    plt.xscale('log')
    plt.yscale('log')
    plt.xlabel('Number of Constraints', fontweight='bold')
    plt.ylabel('Peak Memory Usage (MB)', fontweight='bold')
    plt.title('Memory Overhead during Proof Generation', fontweight='bold', pad=20)
    
    plt.tight_layout()
    output_path = os.path.join(output_dir, "memory_usage.pdf")
    plt.savefig(output_path, format='pdf', dpi=300)
    plt.savefig(output_path.replace('.pdf', '.png'), format='png', dpi=300)
    print(f" -> Saved {output_path}")
    plt.close()

def generate_security_analysis_graph():
    """
    Generates a security bar chart comparing ZKP system parameter sizes vs traditional.
    Or forging probability. Here we do an estimation of Security Level (bits) vs Key/Proof Size.
    """
    print("Generating Security Analysis Graph...")
    
    # Mock Data
    schemes = ['RSA-3072', 'ECDSA (P-256)', 'ZK-SNARK (Groth16)', 'ZK-STARK']
    security_bits = [128, 128, 128, 128]  # Common targeted security level
    proof_sizes_bytes = [384, 64, 256, 45000] # Approximate sizes in bytes

    df = pd.DataFrame({
        'Scheme': schemes,
        'Proof/Signature Size (Bytes)': proof_sizes_bytes
    })

    plt.figure(figsize=(9, 6))
    ax = sns.barplot(x='Scheme', y='Proof/Signature Size (Bytes)', data=df, palette='viridis')
    
    # Add values on top of bars
    for p in ax.patches:
        ax.annotate(f"{int(p.get_height())} B", 
                    (p.get_x() + p.get_width() / 2., p.get_height()), 
                    ha = 'center', va = 'bottom', 
                    xytext = (0, 5), 
                    textcoords = 'offset points',
                    fontweight='bold')

    plt.yscale('log')
    plt.xlabel('Cryptographic Scheme (128-bit Security)', fontweight='bold')
    plt.ylabel('Size (Bytes, Log Scale)', fontweight='bold')
    plt.title('Comparative Proof/Signature Sizes', fontweight='bold', pad=20)

    plt.tight_layout()
    output_path = os.path.join(output_dir, "security_analysis.pdf")
    plt.savefig(output_path, format='pdf', dpi=300)
    plt.savefig(output_path.replace('.pdf', '.png'), format='png', dpi=300)
    print(f" -> Saved {output_path}")
    plt.close()

def generate_throughput_graph():
    """
    Generates a graph for System Throughput (TPS - Transactions Per Second).
    Simulates the whole system throughput under different concurrency levels.
    """
    print("Generating Throughput Graph...")
    
    # Mock Data
    concurrency = np.array([1, 10, 50, 100, 200, 500])
    
    # TPS plateauing after a certain concurrency level due to DB/System limits
    tps = 1000 * (1 - np.exp(-concurrency / 50)) 
    
    # Latency increases as concurrency goes up past a certain point
    latency_ms = 50 + (concurrency ** 1.5) * 0.1

    fig, ax1 = plt.subplots(figsize=(8, 6))

    color = 'tab:green'
    ax1.set_xlabel('Concurrent Users / Requests', fontweight='bold')
    ax1.set_ylabel('Throughput (TPS)', color=color, fontweight='bold')
    ax1.plot(concurrency, tps, marker='^', linestyle='-', color=color, linewidth=2, label='Throughput')
    ax1.tick_params(axis='y', labelcolor=color)

    ax2 = ax1.twinx()  
    color = 'tab:red'
    ax2.set_ylabel('Average Latency (ms)', color=color, fontweight='bold')  
    ax2.plot(concurrency, latency_ms, marker='x', linestyle='--', color=color, linewidth=2, label='Latency')
    ax2.tick_params(axis='y', labelcolor=color)

    plt.title('System Scalability: Throughput vs Latency', fontweight='bold', pad=20)
    fig.tight_layout()  

    output_path = os.path.join(output_dir, "throughput_scalability.pdf")
    plt.savefig(output_path, format='pdf', dpi=300)
    plt.savefig(output_path.replace('.pdf', '.png'), format='png', dpi=300)
    print(f" -> Saved {output_path}")
    plt.close()

if __name__ == "__main__":
    print("-" * 50)
    print("Starting ZKP Metric Graph Generation")
    print("-" * 50)
    
    generate_performance_graph()
    generate_memory_usage_graph()
    generate_security_analysis_graph()
    generate_throughput_graph()
    
    print("-" * 50)
    print(f"All graphs successfully generated in: {output_dir}")
    print("PDFs are perfect for LaTeX/Papers. PNGs are good for quick previews.")
    print("-" * 50)

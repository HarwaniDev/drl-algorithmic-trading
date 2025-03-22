import matplotlib.pyplot as plt
import numpy as np
import requests
import pandas as pd
from datetime import datetime, timedelta

def fetch_trading_data():
    """Fetch trading data from the FastAPI backend"""
    response = requests.get('http://localhost:8000/real_time_prediction')
    return response.json()

def plot_trading_performance(data):
    """Generate performance visualization plots"""
    # Create figure with subplots
    fig = plt.figure(figsize=(15, 12))
    
    # Price and Signals Plot
    ax1 = plt.subplot(2, 1, 1)
    prices = data['data_info']['close']
    time_points = range(len(prices))
    
    # Plot price
    ax1.plot(time_points, prices, 'b-', label='Price')
    
    # Plot trading signals
    for i, signal in enumerate(data['trading_signal']['tdqn_decision']['target_position']):
        if signal > 0:
            ax1.plot(i, prices[i], '^', color='green', markersize=10, label='Long' if i == 0 else "")
        elif signal < 0:
            ax1.plot(i, prices[i], 'v', color='red', markersize=10, label='Short' if i == 0 else "")
    
    ax1.set_ylabel('Price')
    ax1.legend()
    ax1.grid(True)
    
    # Capital Plot
    ax2 = plt.subplot(2, 1, 2)
    
    # Calculate cumulative returns
    returns = np.diff(prices) / prices[:-1]
    strategy_returns = returns * np.array(data['trading_signal']['tdqn_decision']['target_position'][:-1])
    initial_capital = 100000
    capital = initial_capital * (1 + np.cumsum(strategy_returns))
    
    ax2.plot(time_points[1:], capital, 'b-', label='Capital')
    
    # Plot entry/exit points
    for i, signal in enumerate(data['trading_signal']['tdqn_decision']['target_position'][:-1]):
        if signal > 0:
            ax2.plot(i, capital[i], '^', color='green', markersize=10, label='Long' if i == 0 else "")
        elif signal < 0:
            ax2.plot(i, capital[i], 'v', color='red', markersize=10, label='Short' if i == 0 else "")
    
    ax2.set_ylabel('Capital')
    ax2.set_xlabel('Time')
    ax2.legend()
    ax2.grid(True)
    
    # Performance Metrics Plot
    fig2, (ax3, ax4) = plt.subplots(1, 2, figsize=(15, 5))
    
    # Sharpe Ratio Plot
    episodes = range(1, 51)
    training_sharpe = np.random.normal(1, 0.5, 50)  # Simulated training Sharpe ratio
    testing_sharpe = np.random.normal(1.2, 0.7, 50)  # Simulated testing Sharpe ratio
    
    ax3.plot(episodes, training_sharpe, 'b-', label='Training')
    ax3.plot(episodes, testing_sharpe, 'orange', label='Testing')
    ax3.set_xlabel('Episode')
    ax3.set_ylabel('Performance (Sharpe Ratio)')
    ax3.legend()
    ax3.grid(True)
    
    # Total Reward Plot
    rewards = np.cumsum(np.random.normal(0.1, 0.5, 50))  # Simulated cumulative rewards
    ax4.plot(episodes, rewards, 'b-')
    ax4.set_xlabel('Episode')
    ax4.set_ylabel('Total reward collected')
    ax4.grid(True)
    
    plt.tight_layout()
    
    # Save plots
    fig.savefig('trading_performance.png')
    fig2.savefig('training_metrics.png')
    plt.close('all')

if __name__ == "__main__":
    # Fetch data and generate plots
    data = fetch_trading_data()
    plot_trading_performance(data)
    print("Plots have been generated and saved as 'trading_performance.png' and 'training_metrics.png'") 
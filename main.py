from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import torch
import numpy as np
from model import TDQN
import os
import time
import yfinance as yf
from datetime import datetime, timedelta

app = FastAPI(title="Trading Strategy API")

# Model performance metrics from training
MODEL_METRICS = {
    "profit_and_loss": 167143,
    "annualized_return": 43.17,
    "annualized_volatility": 25.03,
    "sharpe_ratio": 2.094,
    "sortino_ratio": 2.952,
    "maximum_drawdown": 19.23,
    "maximum_drawdown_duration": 30,
    "profitability": 85.71,
    "ratio_average_profit_loss": 7.040,
    "skewness": 0.026
}

def get_real_time_data():
    """Fetch real-time data for AAPL stock."""
    try:
        # Get AAPL ticker
        aapl = yf.Ticker("AAPL")
        
        # Get historical data for the last 31 periods (we need 30 for prediction plus 1 for returns calculation)
        # Using 1-minute intervals for the most recent data
        end_time = datetime.now()
        start_time = end_time - timedelta(days=5)  # Getting more data than needed in case of market closures
        df = aapl.history(start=start_time, end=end_time, interval='1d')
        
        # Get the last 30 valid data points
        df = df.tail(30)
        
        if len(df) < 30:
            raise HTTPException(
                status_code=400,
                detail="Not enough data points available. Market might be closed."
            )
        
        # Format data according to our API requirements
        data = {
            "close": df['Close'].tolist(),
            "low": df['Low'].tolist(),
            "high": df['High'].tolist(),
            "volume": df['Volume'].tolist(),
            "position": 0.0  # Default to no position
        }
        
        # Add timestamp information
        last_timestamp = df.index[-1].strftime('%Y-%m-%d %H:%M:%S')
        data_info = {
            "last_update": last_timestamp,
            "interval": "1min",
            "symbol": "AAPL"
        }
        
        return {"data": data, "info": data_info}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching real-time data: {str(e)}"
        )

def interpret_trading_signal(action_value, confidence, current_position, performance_metrics):
    """
    Pure wrapper around TDQN's output without any additional trading logic.
    TDQN outputs action_value as the target position (-1 to 1).
    
    Args:
        action_value (float): The target position from TDQN (-1 to 1)
        confidence (float): Model's confidence
        current_position (float): Current position (-1 to 1)
        performance_metrics (dict): Current performance metrics for information only
    
    Returns:
        dict: Raw TDQN output with performance metrics as additional information
    """
    # Calculate the raw position change from TDQN
    position_change = action_value - current_position
    
    return {
        "tdqn_decision": {
            "target_position": round(action_value, 3),
            "position_change": round(position_change, 3),
            "confidence": round(confidence, 3)
        },
        "current_state": {
            "position": current_position
        }
    }

# Load the model
model_path = os.path.join("Strategies", "TDQN_AAPL_2012-1-1_2018-1-1.pth")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TDQN().to(device)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

class TradingData(BaseModel):
    close: List[float]
    low: List[float]
    high: List[float]
    volume: List[float]
    position: float
    window_size: Optional[int] = 30  # Optional parameter to specify how many records to use

@app.get("/real_time_prediction")
async def real_time_prediction(window_size: Optional[int] = 30):
    try:
        # Get AAPL data
        end_time = datetime.now()
        # For daily data, get much more historical data to ensure we have enough trading days
        start_time = end_time - timedelta(days=window_size * 4)  # Get 4x days to account for weekends/holidays/market closures
        
        ticker = yf.Ticker("AAPL")
        df = ticker.history(start=start_time, end=end_time, interval='1d')
        
        if len(df) == 0:
            # If no data, try getting more historical data
            start_time = end_time - timedelta(days=window_size * 8)  # Try with even more days
            df = ticker.history(start=start_time, end=end_time, interval='1d')
            
            if len(df) == 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"No data available. Market might be closed or there might be an issue with the data feed."
                )
        
        # Validate data dates
        if df.index[-1].date() > datetime.now().date():
            raise HTTPException(
                status_code=400,
                detail="Received future dates in data. Please check the data source."
            )
        
        if len(df) < window_size:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough data points available. Expected {window_size}, got {len(df)}. Try reducing window_size parameter."
            )
        
        # Validate data quality
        if df.isnull().any().any():
            raise HTTPException(
                status_code=400,
                detail="Data contains missing values. Please try again later."
            )
        
        # Calculate basic statistics to validate data
        price_change = (df['Close'].iloc[-1] - df['Close'].iloc[0]) / df['Close'].iloc[0] * 100
        if abs(price_change) > 100:  # More than 100% price change in the window
            raise HTTPException(
                status_code=400,
                detail="Unusual price changes detected in the data. Please verify the data source."
            )
        
        # Prepare the data (use the most recent window_size records)
        data = TradingData(
            close=df['Close'].values[-window_size:].tolist(),
            low=df['Low'].values[-window_size:].tolist(),
            high=df['High'].values[-window_size:].tolist(),
            volume=df['Volume'].values[-window_size:].tolist(),
            position=0.0,  # Assume neutral position for real-time prediction
            window_size=window_size
        )
        
        # Get prediction
        prediction = await predict(data)
        
        # Add data info to response
        prediction["data_info"] = {
            "last_update": df.index[-1].strftime("%Y-%m-%d"),
            "interval": "1d",
            "symbol": "AAPL",
            "window_size": window_size,
            "total_records_available": len(df),
            "date_range": {
                "start": df.index[-window_size].strftime("%Y-%m-%d"),
                "end": df.index[-1].strftime("%Y-%m-%d")
            },
            "trading_days_found": len(df),
            "calendar_days_searched": (end_time - start_time).days,
            "price_change_percent": round(price_change, 2),
            "current_price": round(df['Close'].iloc[-1], 2)
        }
        
        return prediction
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in real-time prediction: {str(e)}"
        )

def safe_division(a, b, default=0.0):
    """Safe division that handles division by zero and NaN values."""
    try:
        result = a / b if b != 0 else default
        return default if np.isnan(result) or np.isinf(result) else result
    except:
        return default

def calculate_performance_metrics(prices, position_changes):
    """Calculate performance metrics based on input prices and positions."""
    try:
        # Calculate returns
        returns = np.diff(prices) / prices[:-1]
        returns = np.insert(returns, 0, 0)  # Add 0 for the first day
        
        # Calculate strategy returns based on position
        strategy_returns = returns * position_changes
        
        # Calculate cumulative returns
        cumulative_returns = np.cumprod(1 + strategy_returns) - 1
        
        # Calculate profit and loss (in price points)
        initial_capital = 100000  # Using larger initial capital for more realistic P&L
        profit_and_loss = int(initial_capital * cumulative_returns[-1])
        
        # Calculate annualized return (252 trading days per year)
        total_return = cumulative_returns[-1]
        annualized_return = ((1 + total_return) ** (252/len(prices)) - 1) * 100
        
        # Calculate annualized volatility
        annualized_volatility = np.std(strategy_returns) * np.sqrt(252) * 100
        
        # Calculate Sharpe Ratio (assuming risk-free rate = 0 for simplicity)
        sharpe_ratio = np.mean(strategy_returns) / np.std(strategy_returns) * np.sqrt(252) if np.std(strategy_returns) > 0 else 0
        
        # Calculate Sortino Ratio (using negative returns only for denominator)
        negative_returns = strategy_returns[strategy_returns < 0]
        sortino_ratio = np.mean(strategy_returns) / np.std(negative_returns) * np.sqrt(252) if len(negative_returns) > 0 and np.std(negative_returns) > 0 else 0
        
        # Calculate Maximum Drawdown
        rolling_max = np.maximum.accumulate(1 + cumulative_returns)
        drawdowns = (1 + cumulative_returns - rolling_max) / rolling_max
        max_drawdown = abs(min(drawdowns)) * 100 if len(drawdowns) > 0 else 0
        
        # Calculate drawdown duration
        underwater = drawdowns < 0
        if not any(underwater):
            max_drawdown_duration = 0
        else:
            underwater_periods = np.diff(np.where(np.concatenate(([underwater[0]], underwater[:-1] != underwater[1:], [True])))[0])
            max_drawdown_duration = max(underwater_periods) if len(underwater_periods) > 0 else 0
        
        # Calculate profitability (percentage of profitable trades)
        profitable_trades = np.sum(strategy_returns > 0)
        total_trades = np.sum(np.abs(strategy_returns) > 0)  # Only count actual trades
        profitability = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Calculate ratio of average profit to average loss
        positive_returns = strategy_returns[strategy_returns > 0]
        negative_returns = strategy_returns[strategy_returns < 0]
        if len(positive_returns) > 0 and len(negative_returns) > 0:
            avg_profit = np.mean(positive_returns)
            avg_loss = abs(np.mean(negative_returns))
            ratio_average_profit_loss = avg_profit / avg_loss
        else:
            ratio_average_profit_loss = 0
        
        # Calculate skewness
        if len(strategy_returns) > 2:
            skewness = float(((strategy_returns - np.mean(strategy_returns)) ** 3).mean() / 
                           (np.std(strategy_returns) ** 3)) if np.std(strategy_returns) > 0 else 0
        else:
            skewness = 0
        
        # Format metrics exactly as shown in the image
        formatted_metrics = {
            "Performance Indicator": [
                "Profit & Loss (P&L)",
                "Annualized Return",
                "Annualized Volatility",
                "Sharpe Ratio",
                "Sortino Ratio",
                "Maximum Drawdown",
                "Maximum Drawdown Duration",
                "Profitability",
                "Ratio Average Profit/Loss",
                "Skewness"
            ],
            "TDQN": [
                f"{profit_and_loss}",
                f"{annualized_return:.2f}%",
                f"{annualized_volatility:.2f}%",
                f"{sharpe_ratio:.3f}",
                f"{sortino_ratio:.3f}",
                f"{max_drawdown:.2f}%",
                f"{int(max_drawdown_duration)} days",
                f"{profitability:.2f}%",
                f"{ratio_average_profit_loss:.3f}",
                f"{skewness:.3f}"
            ]
        }
        
        return formatted_metrics
        
    except Exception as e:
        print(f"Error in performance metrics calculation: {str(e)}")
        return {
            "Performance Indicator": [
                "Profit & Loss (P&L)",
                "Annualized Return",
                "Annualized Volatility",
                "Sharpe Ratio",
                "Sortino Ratio",
                "Maximum Drawdown",
                "Maximum Drawdown Duration",
                "Profitability",
                "Ratio Average Profit/Loss",
                "Skewness"
            ],
            "TDQN": [
                "0",
                "0.00%",
                "0.00%",
                "0.000",
                "0.000",
                "0.00%",
                "0 days",
                "0.00%",
                "0.000",
                "0.000"
            ]
        }

@app.post("/predict")
async def predict(data: TradingData):
    try:
        total_start = time.time()
        
        # Convert input data to numpy arrays
        global close
        close = np.array(data.close, dtype=np.float64)
        low = np.array(data.low, dtype=np.float64)
        high = np.array(data.high, dtype=np.float64)
        volume = np.array(data.volume, dtype=np.float64)
        position = np.array([data.position], dtype=np.float64)

        # Validate input lengths match
        if not (len(close) == len(low) == len(high) == len(volume)):
            raise ValueError("All input arrays must have the same length")
        
        # Use the last window_size records if we have more data
        if len(close) > data.window_size:
            close = close[-data.window_size:]
            low = low[-data.window_size:]
            high = high[-data.window_size:]
            volume = volume[-data.window_size:]
        elif len(close) < data.window_size:
            raise ValueError(f"Not enough data points. Expected at least {data.window_size}, got {len(close)}")

        # Calculate features
        feature_start = time.time()
        
        # Normalize prices using percentage changes from start
        relative_close = (close - close[0]) / close[0]
        relative_low = (low - low[0]) / low[0]
        relative_high = (high - high[0]) / high[0]
        relative_volume = (volume - volume[0]) / volume[0]
        
        # Calculate returns
        returns = np.diff(close) / close[:-1]
        returns = np.insert(returns, 0, 0)
        
        # Technical indicators
        def calculate_sma(data, window):
            return np.convolve(data, np.ones(window)/window, mode='same')
        
        sma_5 = calculate_sma(relative_close, 5)
        sma_10 = calculate_sma(relative_close, 10)
        sma_20 = calculate_sma(relative_close, 20)
        
        # RSI
        delta = np.diff(close)
        delta = np.insert(delta, 0, 0)
        gain = (delta > 0) * delta
        loss = (delta < 0) * -delta
        
        avg_gain = calculate_sma(gain, 14)
        avg_loss = calculate_sma(loss, 14)
        
        rs = avg_gain / np.maximum(avg_loss, 1e-10)
        rsi = 100 - (100 / (1 + rs))
        
        # Momentum
        momentum_5 = relative_close - np.roll(relative_close, 5)
        momentum_5[:5] = 0
        momentum_10 = relative_close - np.roll(relative_close, 10)
        momentum_10[:10] = 0
        
        # Volume momentum
        volume_momentum_5 = relative_volume - np.roll(relative_volume, 5)
        volume_momentum_5[:5] = 0
        volume_momentum_10 = relative_volume - np.roll(relative_volume, 10)
        volume_momentum_10[:10] = 0
        
        # Volatility
        volatility = np.std(returns[-5:])
        
        # Stack features
        features = np.stack([
            relative_close, relative_low, relative_high,
            relative_volume, returns,
            sma_5, sma_10, sma_20,
            rsi/100,  # Scale RSI to 0-1
            momentum_5, momentum_10,
            volume_momentum_5, volume_momentum_10,
            np.full_like(close, volatility)
        ], axis=1)
        
        # Standardize features
        for i in range(features.shape[1]):
            std = np.std(features[:, i])
            if std > 0:
                features[:, i] = (features[:, i] - np.mean(features[:, i])) / std
        
        # Handle NaN/inf values
        features = np.nan_to_num(features, nan=0.0, posinf=1.0, neginf=-1.0)
        
        # Reshape to match model input size (117)
        features = features.reshape(-1)[:117]
        if len(features) < 117:
            features = np.pad(features, (0, 117 - len(features)))
        
        feature_time = time.time() - feature_start
        
        # Convert to tensor
        tensor_start = time.time()
        features_tensor = torch.FloatTensor(features).unsqueeze(0).to(device)
        position_tensor = torch.FloatTensor(position).unsqueeze(0).to(device)
        tensor_time = time.time() - tensor_start

        # Get TDQN's direct output
        model_start = time.time()
        with torch.no_grad():
            action = model(features_tensor, position_tensor)
            action = action.cpu().numpy()[0]
            
            # TDQN outputs target position and confidence
            action_value = float(np.clip(action[0], -1, 1))  # Target position
            confidence = float(np.clip(action[1], 0, 1))     # Confidence
            
            # Ensure confidence is not zero for valid predictions
            if confidence == 0 and abs(action_value) > 0.001:
                confidence = 0.1  # Minimum confidence for non-zero actions
        
        model_time = time.time() - model_start
        
        # Calculate performance metrics based on the model's output
        positions = np.full(len(close), action_value)  # Create an array filled with the target position
        performance_metrics = calculate_performance_metrics(
            prices=close,
            position_changes=positions
        )
        
        # Get TDQN's trading signal
        trading_signal = interpret_trading_signal(
            action_value, 
            confidence, 
            data.position,
            performance_metrics
        )
        
        return {
            "prediction": {
                "action": action_value,  # This is the target position (-1 to 1)
                "confidence": confidence
            },
            "trading_signal": trading_signal,
            "performance_metrics": performance_metrics,
            "timing": {
                "feature_calculation": round(feature_time * 1000, 2),
                "tensor_conversion": round(tensor_time * 1000, 2),
                "model_inference": round(model_time * 1000, 2),
                "total_time": round((time.time() - total_start) * 1000, 2)
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in prediction: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
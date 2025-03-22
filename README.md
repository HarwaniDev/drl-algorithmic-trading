# Trading Strategy API

This FastAPI server serves a pre-trained TDQN (Trading Deep Q-Network) model for trading decisions.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Usage

### Endpoint: POST /predict

Send a POST request to `/predict` with the following JSON structure:

```json
{
    "close": [100.0, 101.0, 102.0, ...],  // Last 30 close prices
    "low": [99.0, 100.0, 101.0, ...],     // Last 30 low prices
    "high": [101.0, 102.0, 103.0, ...],   // Last 30 high prices
    "volume": [1000000, 1100000, 900000, ...],  // Last 30 volume values
    "position": 0.0  // Current position
}
```

### Response

The API will return a JSON response with the predicted action:

```json
{
    "action": 0.5  // Predicted trading action
}
```

### Example using curl:

```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
           "close": [100.0, 101.0, 102.0],
           "low": [99.0, 100.0, 101.0],
           "high": [101.0, 102.0, 103.0],
           "volume": [1000000, 1100000, 900000],
           "position": 0.0
         }'
```

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc` 
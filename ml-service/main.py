from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import uvicorn
from forecaster import ProphetForecaster

app = FastAPI(title="ASTRA Forecasting Engine", version="1.0.0")

class TimePoint(BaseModel):
    ds: str = Field(..., description="Timestamp in YYYY-MM format")
    y: float = Field(..., description="Historical value")

class ForecastRequest(BaseModel):
    history: List[TimePoint]
    horizon: int = Field(default=6, ge=1, le=24, description="Horizon to predict in months")

class ForecastResponsePoint(BaseModel):
    period: str
    predictedValue: float
    lowerBound: float
    upperBound: float

class ModelMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float

class ForecastResponse(BaseModel):
    predictions: List[ForecastResponsePoint]
    metrics: ModelMetrics

@app.post("/api/v1/ml/forecast", response_model=ForecastResponse)
async def generate_forecast(payload: ForecastRequest):
    if len(payload.history) < 6:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient history. Received {len(payload.history)} points. Minimum required is 6."
        )
    
    try:
        # Convert request array into key data frames and fit
        history_data = [{"ds": p.ds, "y": p.y} for p in payload.history]
        
        predictions, metrics = ProphetForecaster.fit_and_predict(
            history_data=history_data,
            horizon=payload.horizon
        )
        
        return {
            "predictions": predictions,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prophet fitting algorithm failure: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ASTRA Forecasting microservice active"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

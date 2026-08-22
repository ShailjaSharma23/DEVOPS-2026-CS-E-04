import pandas as pd
import numpy as np
from prophet import Prophet

class ProphetForecaster:
    @staticmethod
    def fit_and_predict(history_data, horizon):
        """
        Fits Facebook Prophet model on aggregated historical allocations and predicts resource demands.
        
        Args:
          history_data (list): List of dicts containing 'ds' (YYYY-MM) and 'y' (float value)
          horizon (int): Months ahead to predict
          
        Returns:
          tuple: (predictions_list, metrics_dict)
        """
        # 1. Structure Pandas DataFrame
        df = pd.DataFrame(history_data)
        
        # Prophet expects 'ds' to be datetime and 'y' numeric
        df['ds'] = pd.to_datetime(df['ds'] + '-01') # Append day suffix to make standard date
        df['y'] = pd.to_numeric(df['y'])
        
        # 2. Configure and Fit Prophet Model
        # Since our aggregation window is monthly, disable daily/weekly seasonalities
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            interval_width=0.95 # 95% uncertainty interval
        )
        
        model.fit(df)
        
        # 3. Predict Future Horizons
        # Monthly frequency prediction ('MS' for Month Start)
        future = model.make_future_dataframe(periods=horizon, freq='MS', include_history=False)
        forecast = model.predict(future)
        
        # 4. Extract Predictions
        predictions = []
        for _, row in forecast.iterrows():
            date_str = row['ds'].strftime('%Y-%m')
            
            # Bound outputs to 0 since resources cannot be negative
            predicted_val = max(0.0, float(row['yhat']))
            lower_bound = max(0.0, float(row['yhat_lower']))
            upper_bound = max(0.0, float(row['yhat_upper']))
            
            predictions.append({
                "period": date_str,
                "predictedValue": predicted_val,
                "lowerBound": lower_bound,
                "upperBound": upper_bound
            })
            
        # 5. Evaluate training fits performance (Metrics)
        # Compare actuals with fitted model predictions on training set
        train_forecast = model.predict(df)
        actuals = df['y'].values
        fitted = train_forecast['yhat'].values
        
        # Guard zero value denominators
        actuals_safe = np.where(actuals == 0, 1.0, actuals)
        
        mae = float(np.mean(np.abs(actuals - fitted)))
        rmse = float(np.sqrt(np.mean((actuals - fitted) ** 2)))
        mape = float(np.mean(np.abs((actuals - fitted) / actuals_safe)) * 100)
        
        metrics = {
            "mae": mae,
            "rmse": rmse,
            "mape": mape
        }
        
        return predictions, metrics

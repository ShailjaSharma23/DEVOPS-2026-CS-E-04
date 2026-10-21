import pandas as pd
import numpy as np

try:
    from prophet import Prophet
    HAS_PROPHET = True
except ImportError:
    HAS_PROPHET = False

class ProphetForecaster:
    @staticmethod
    def fit_and_predict(history_data, horizon):
        """
        Fits Facebook Prophet model (with automatic fallback to regression if Prophet is unavailable)
        on aggregated historical allocations and predicts resource demands.
        
        Args:
          history_data (list): List of dicts containing 'ds' (YYYY-MM) and 'y' (float value)
          horizon (int): Months ahead to predict
          
        Returns:
          tuple: (predictions_list, metrics_dict)
        """
        # 1. Structure Pandas DataFrame
        df = pd.DataFrame(history_data)
        df['ds'] = pd.to_datetime(df['ds'] + '-01')
        df['y'] = pd.to_numeric(df['y'])

        if HAS_PROPHET:
            # 2. Configure and Fit Prophet Model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                interval_width=0.95
            )
            model.fit(df)
            
            # 3. Predict Future Horizons
            future = model.make_future_dataframe(periods=horizon, freq='MS', include_history=False)
            forecast = model.predict(future)
            
            predictions = []
            for _, row in forecast.iterrows():
                date_str = row['ds'].strftime('%Y-%m')
                predicted_val = max(0.0, float(row['yhat']))
                lower_bound = max(0.0, float(row['yhat_lower']))
                upper_bound = max(0.0, float(row['yhat_upper']))
                
                predictions.append({
                    "period": date_str,
                    "predictedValue": round(predicted_val, 2),
                    "lowerBound": round(lower_bound, 2),
                    "upperBound": round(upper_bound, 2)
                })
                
            train_forecast = model.predict(df)
            actuals = df['y'].values
            fitted = train_forecast['yhat'].values
            actuals_safe = np.where(actuals == 0, 1.0, actuals)
            
            metrics = {
                "mae": round(float(np.mean(np.abs(actuals - fitted))), 2),
                "rmse": round(float(np.sqrt(np.mean((actuals - fitted) ** 2))), 2),
                "mape": round(float(np.mean(np.abs((actuals - fitted) / actuals_safe)) * 100), 2)
            }
            return predictions, metrics
        else:
            # Fallback linear regression with uncertainty bounds
            x = np.arange(len(df))
            y = df['y'].values
            slope, intercept = np.polyfit(x, y, 1) if len(x) > 1 else (0.0, float(y[0]))
            
            last_date = df['ds'].iloc[-1]
            future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=horizon, freq='MS')
            
            residuals = y - (slope * x + intercept)
            std_err = float(np.std(residuals)) if len(residuals) > 1 else 3.0
            
            predictions = []
            for i, d in enumerate(future_dates):
                pred_x = len(df) + i
                pred_y = max(0.0, float(slope * pred_x + intercept))
                predictions.append({
                    "period": d.strftime('%Y-%m'),
                    "predictedValue": round(pred_y, 2),
                    "lowerBound": max(0.0, round(pred_y - 1.96 * std_err, 2)),
                    "upperBound": round(pred_y + 1.96 * std_err, 2)
                })
                
            fitted = slope * x + intercept
            actuals_safe = np.where(y == 0, 1.0, y)
            metrics = {
                "mae": round(float(np.mean(np.abs(y - fitted))), 2),
                "rmse": round(float(np.sqrt(np.mean((y - fitted) ** 2))), 2),
                "mape": round(float(np.mean(np.abs((y - fitted) / actuals_safe)) * 100), 2)
            }
            return predictions, metrics


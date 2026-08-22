import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';

const Forecasting = ({ filters }) => {
  const { user, hasPermission } = useAuth();
  const [resourceType, setResourceType] = useState('enrollment_kits');
  const [horizon, setHorizon] = useState(6);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  
  const [metrics, setMetrics] = useState({ mae: '12.42', rmse: '16.89', mape: '4.12%' });

  const fetchForecast = () => {
    setLoading(true);
    // Simulate API call to FastAPI
    setTimeout(() => {
      setLoading(false);
      calculateChart();
    }, 1200);
  };

  const calculateChart = () => {
    const activeRegion = filters.state || 'all';
    
    // Mock regional trends
    let history = [100, 105, 112, 120, 122, 130, 132, 140, 145, 148, 152, 160];
    let forecast = [165, 168, 172, 175, 180, 183];
    let maeVal = '6.2';
    let rmseVal = '8.5';
    let mapeVal = '3.2%';

    if (activeRegion === 'maharashtra') {
      history = [30, 32, 35, 38, 39, 42, 43, 46, 48, 50, 52, 55];
      forecast = [57, 59, 61, 63, 65, 67];
      maeVal = '2.1'; rmseVal = '2.9'; mapeVal = '4.5%';
    } else if (activeRegion === 'uttar_pradesh') {
      history = [45, 48, 52, 55, 56, 60, 61, 65, 67, 68, 70, 74];
      forecast = [76, 78, 80, 82, 84, 86];
      maeVal = '3.2'; rmseVal = '4.1'; mapeVal = '4.9%';
    } else if (activeRegion === 'karnataka') {
      history = [10, 9, 8, 9, 8, 8, 10, 12, 7, 6, 5, 4];
      forecast = [4, 4, 3, 3, 2, 2];
      maeVal = '1.4'; rmseVal = '1.9'; mapeVal = '12.1%';
    }

    setMetrics({ mae: maeVal, rmse: rmseVal, mape: mapeVal });

    const historyLabels = ['Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26'];
    const forecastLabels = ['Sep 26', 'Oct 26', 'Nov 26', 'Dec 26', 'Jan 27', 'Feb 27'].slice(0, horizon);
    
    const labels = [...historyLabels, ...forecastLabels];
    
    const historyPoints = [...history];
    const forecastPoints = Array(12).fill(null);
    forecastPoints[11] = history[11];
    forecastPoints.push(...forecast.slice(0, horizon));

    const lowerBounds = Array(12).fill(null);
    const upperBounds = Array(12).fill(null);
    lowerBounds[11] = history[11];
    upperBounds[11] = history[11];
    
    forecast.slice(0, horizon).forEach((val, idx) => {
      const uncertainty = val * 0.08 * (idx + 1);
      lowerBounds.push(val - uncertainty);
      upperBounds.push(val + uncertainty);
    });

    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'Historical Allocation',
          data: historyPoints,
          borderColor: '#5bc0be',
          borderWidth: 2,
          tension: 0.2
        },
        {
          label: 'Prophet Demand Forecast',
          data: forecastPoints,
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          borderWidth: 2,
          tension: 0.2
        },
        {
          label: 'Upper Confidence Limit (95%)',
          data: upperBounds,
          borderColor: 'rgba(245, 158, 11, 0.15)',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          fill: '+1',
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Lower Confidence Limit (95%)',
          data: lowerBounds,
          borderColor: 'rgba(245, 158, 11, 0.15)',
          fill: false,
          pointRadius: 0,
          tension: 0.2
        }
      ]
    });
  };

  useEffect(() => {
    calculateChart();
  }, [filters, resourceType, horizon]);

  const canGenerate = hasPermission('generate_forecasts');

  return (
    <div>
      <div className="filter-panel" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '24px' }}>
        <div className="filter-group">
          <label htmlFor="forecast-resource-select">Resource Type</label>
          <select
            className="filter-select"
            id="forecast-resource-select"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
          >
            <option value="enrollment_kits">Aadhaar Enrollment Kits</option>
            <option value="biometric_scanners">Biometric Iris Scanners</option>
            <option value="personnel_units">Trained Personnel (Units)</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="forecast-horizon-select">Forecast Horizon</label>
          <select
            className="filter-select"
            id="forecast-horizon-select"
            value={horizon}
            onChange={(e) => setHorizon(parseInt(e.target.value))}
          >
            <option value={6}>6 Months Horizon</option>
            <option value={12}>12 Months Horizon</option>
          </select>
        </div>
        
        {canGenerate && (
          <div className="filter-group" style={{ paddingTop: '18px' }}>
            <button className="btn" onClick={fetchForecast} disabled={loading}>
              {loading ? (
                <span><i className="fa-solid fa-spinner fa-spin"></i> Fitting Prophet Model...</span>
              ) : (
                <span><i className="fa-solid fa-wand-magic-sparkles"></i> Run Prophet Forecast</span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Resource demand forecasting (Prophet Time-Series fitting)</span>
          <span className="status-badge ready"><i className="fa-solid fa-server"></i> Model: Prophet v1.2</span>
        </div>
        <p className="visual-card-desc">Solid line indicates historical allocations. Dotted line indicates forecasts. Shaded band represents 95% confidence intervals.</p>
        
        <div className="chart-container" style={{ height: '380px' }}>
          {chartData && (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: '#a0aec0',
                      filter: (item) => !item.text.includes('Limit')
                    }
                  }
                },
                scales: {
                  x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } },
                  y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } }
                }
              }}
            />
          )}
        </div>

        <div className="metrics-row">
          <div className="metric-box">
            <div className="metric-box-label">Mean Absolute Error (MAE)</div>
            <div className="metric-box-value">{metrics.mae}</div>
          </div>
          <div className="metric-box">
            <div className="metric-box-label">Root Mean Square Error (RMSE)</div>
            <div className="metric-box-value">{metrics.rmse}</div>
          </div>
          <div className="metric-box">
            <div className="metric-box-label">Mean Absolute Percentage Error (MAPE)</div>
            <div className="metric-box-value">{metrics.mape}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;

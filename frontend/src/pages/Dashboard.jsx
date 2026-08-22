import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ filters }) => {
  const [kpis, setKpis] = useState({
    demographics: '42,912,410',
    biometrics: '18,349,201',
    datasets: 24,
    gaps: 0
  });

  const [trendData, setTrendData] = useState([120, 135, 142, 160, 175, 192, 210, 230, 248, 255, 274, 290]);
  const [biometricTrend, setBiometricTrend] = useState([85, 90, 88, 102, 110, 115, 130, 125, 138, 142, 150, 155]);

  useEffect(() => {
    // Dynamic updates depending on filters (mocking backend call)
    if (filters.state === 'maharashtra') {
      setKpis({ demographics: '12,410,892', biometrics: '5,410,210', datasets: 8, gaps: 0 });
      setTrendData([35, 38, 41, 46, 50, 54, 58, 63, 67, 71, 75, 80]);
      setBiometricTrend([22, 24, 23, 27, 29, 31, 35, 33, 37, 39, 41, 43]);
    } else if (filters.state === 'uttar_pradesh') {
      setKpis({ demographics: '18,924,102', biometrics: '7,890,142', datasets: 12, gaps: 0 });
      setTrendData([55, 60, 63, 71, 78, 85, 93, 102, 110, 114, 122, 130]);
      setBiometricTrend([38, 40, 39, 45, 48, 50, 56, 54, 59, 61, 64, 66]);
    } else if (filters.state === 'karnataka') {
      setKpis({ demographics: '4,737,806', biometrics: '2,206,740', datasets: 6, gaps: 1 });
      setTrendData([12, 17, 17, 19, 21, 25, 28, 32, 35, 33, 38, 39]);
      setBiometricTrend([12, 12, 13, 14, 16, 16, 19, 19, 21, 20, 22, 22]);
    } else {
      // National / default
      setKpis({ demographics: '42,912,410', biometrics: '18,349,201', datasets: 24, gaps: 0 });
      setTrendData([120, 135, 142, 160, 175, 192, 210, 230, 248, 255, 274, 290]);
      setBiometricTrend([85, 90, 88, 102, 110, 115, 130, 125, 138, 142, 150, 155]);
    }
  }, [filters]);

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Demographics (x10k)',
        data: trendData,
        borderColor: '#5bc0be',
        backgroundColor: 'rgba(91, 192, 190, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Biometrics (x10k)',
        data: biometricTrend,
        borderColor: '#3a506b',
        backgroundColor: 'rgba(58, 80, 107, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const barChartData = {
    labels: ['0-5 yrs', '5-18 yrs', '18-35 yrs', '35-60 yrs', '60+ yrs'],
    datasets: [
      {
        label: 'Percent of Population',
        data: filters.state === 'maharashtra' ? [10, 22, 42, 18, 8] : [12, 24, 38, 18, 8],
        backgroundColor: ['#5bc0be', '#3a506b', '#1c2541', '#f59e0b', '#10b981'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div>
      <div className="dashboard-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Aggregated Demographic Rows</span>
            <span className="kpi-value">{kpis.demographics}</span>
            <span className="kpi-change up" style={{ color: 'var(--status-ready)' }}>
              <i className="fa-solid fa-arrow-up"></i> 8.4% YoY
            </span>
          </div>
          <div className="kpi-icon"><i className="fa-solid fa-users"></i></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Biometric Update Trans.</span>
            <span className="kpi-value">{kpis.biometrics}</span>
            <span className="kpi-change up" style={{ color: 'var(--status-ready)' }}>
              <i className="fa-solid fa-arrow-up"></i> 4.1% MoM
            </span>
          </div>
          <div className="kpi-icon"><i className="fa-solid fa-fingerprint"></i></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Active Datasets</span>
            <span className="kpi-value">{kpis.datasets}</span>
            <span className="kpi-change up" style={{ color: 'var(--status-ready)' }}>
              <i className="fa-solid fa-plus"></i> Ingestion Active
            </span>
          </div>
          <div className="kpi-icon"><i className="fa-solid fa-database"></i></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Allocation Gaps Flagged</span>
            <span className="kpi-value">{kpis.gaps}</span>
            <span className={kpis.gaps > 0 ? "kpi-change down" : "kpi-change up"} style={{ color: kpis.gaps > 0 ? 'var(--status-failed)' : 'var(--status-ready)' }}>
              <i className={kpis.gaps > 0 ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-check"}></i>{' '}
              {kpis.gaps > 0 ? 'Immediate action required' : 'Nominal capacity'}
            </span>
          </div>
          <div className="kpi-icon">
            <i className={kpis.gaps > 0 ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check"}></i>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="visual-card">
          <div className="visual-card-title">
            <span>Regional Enrollment & Updates (Trends)</span>
            <i className="fa-solid fa-chart-line text-muted"></i>
          </div>
          <div className="chart-container">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#a0aec0', font: { family: 'Inter' } } }
                },
                scales: {
                  x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } },
                  y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } }
                }
              }}
            />
          </div>
        </div>

        <div className="visual-card">
          <div className="visual-card-title">
            <span>Age Band Distribution</span>
            <i className="fa-solid fa-chart-pie text-muted"></i>
          </div>
          <div className="chart-container">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#a0aec0' } },
                  y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

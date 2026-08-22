import React, { useState, useEffect } from 'react';
import { Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Analytics = ({ filters }) => {
  const [genderSplit, setGenderSplit] = useState([51, 48, 1]);
  const [biometricSplit, setBiometricSplit] = useState([65, 35]);

  useEffect(() => {
    if (filters.state === 'maharashtra') {
      setGenderSplit([52, 47, 1]);
      setBiometricSplit([68, 32]);
    } else if (filters.state === 'uttar_pradesh') {
      setGenderSplit([51, 48, 1]);
      setBiometricSplit([62, 38]);
    } else if (filters.state === 'tamil_nadu') {
      setGenderSplit([50, 49, 1]);
      setBiometricSplit([67, 33]);
    } else {
      setGenderSplit([51, 48, 1]);
      setBiometricSplit([65, 35]);
    }
  }, [filters]);

  const genderChartData = {
    labels: ['Male', 'Female', 'Third Gender / Other'],
    datasets: [{
      data: genderSplit,
      backgroundColor: ['#5bc0be', '#f59e0b', '#3a506b'],
      borderWidth: 1,
      borderColor: '#1c2541'
    }]
  };

  const biometricChartData = {
    labels: ['New Enrollments', 'Biometric Updates'],
    datasets: [{
      data: biometricSplit,
      backgroundColor: ['#10b981', '#3b82f6'],
      borderWidth: 1,
      borderColor: '#1c2541'
    }]
  };

  const tableRows = [
    { age: '0-5 yrs (Infant)', male: '1,240,105', female: '1,180,942', other: '10,210', total: '2,431,257', growth: '+1.2%' },
    { age: '5-18 yrs (School)', male: '4,590,820', female: '4,302,112', other: '32,900', total: '8,925,832', growth: '+2.4%' },
    { age: '18-35 yrs (Youth)', male: '7,820,490', female: '7,249,102', other: '89,102', total: '15,158,694', growth: '+8.6%' },
    { age: '35-60 yrs (Working)', male: '6,910,210', female: '6,410,290', other: '41,090', total: '13,361,590', growth: '+4.1%' },
    { age: '60+ yrs (Senior)', male: '1,540,119', female: '1,440,912', other: '12,900', total: '2,993,931', growth: '+0.8%' }
  ];

  return (
    <div>
      <div className="grid-2col">
        <div className="visual-card">
          <div className="visual-card-title">
            <span>Demographic Gender Breakdown</span>
            <i className="fa-solid fa-venus-mars text-muted"></i>
          </div>
          <div className="chart-container">
            <Doughnut
              data={genderChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#a0aec0' } }
                }
              }}
            />
          </div>
        </div>

        <div className="visual-card">
          <div className="visual-card-title">
            <span>Biometric Update Types</span>
            <i className="fa-solid fa-fingerprint text-muted"></i>
          </div>
          <div className="chart-container">
            <Pie
              data={biometricChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#a0aec0' } }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Demographic Age-Distribution Split (Details)</span>
          <i className="fa-solid fa-circle-info text-muted"></i>
        </div>
        <p className="visual-card-desc">Detailed counts by age bracket. This data helps identify target age blocks for demographic updates.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="astra-table">
            <thead>
              <tr>
                <th>Age Bracket</th>
                <th>Male</th>
                <th>Female</th>
                <th>Third Gender / Other</th>
                <th>Total</th>
                <th>Growth Rate (YoY)</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, index) => (
                <tr key={index}>
                  <td><strong>{r.age}</strong></td>
                  <td className="text-code">{r.male}</td>
                  <td className="text-code">{r.female}</td>
                  <td className="text-code">{r.other}</td>
                  <td className="text-code" style={{ fontWeight: 600 }}>{r.total}</td>
                  <td style={{ color: 'var(--status-ready)', fontWeight: 600 }}>{r.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

import React, { useState } from 'react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([
    { timestamp: '2026-08-16 23:15', ip: '10.240.12.82', email: 'admin@uidai.gov.in', role: 'Administrator', action: 'User session authenticated successfully via JWT gateway', status: 'Success' },
    { timestamp: '2026-08-16 22:50', ip: '10.240.45.101', email: 'a.sen@nic.in', role: 'Data Analyst', action: 'Ingested dataset D-8021: mh_demographics_q2_2026.csv', status: 'Success' },
    { timestamp: '2026-08-16 21:05', ip: '10.240.80.32', email: 'r.subra@nic.in', role: 'Resource Planning Officer', action: 'Initiated Prophet model fitting: Mumbai District — Enrollment Kits', status: 'Success' },
    { timestamp: '2026-08-16 19:42', ip: '10.240.10.15', email: 'd.pratap@gov.in', role: 'Department Officer', action: 'Exported demographic report to PDF (Filters: National)', status: 'Success' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    return log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
           log.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className="filter-panel" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '24px' }}>
        <div className="filter-group">
          <label htmlFor="audit-search-input">Search Action / User</label>
          <input
            type="text"
            id="audit-search-input"
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. forecast, admin"
            style={{ minWidth: '300px' }}
          />
        </div>
      </div>

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Security & Audit Trails (Immutable Repository)</span>
          <i className="fa-solid fa-clock text-muted"></i>
        </div>
        <p className="visual-card-desc">Tracks authentication events, user-level file uploads, forecasts runs, and permissions configuration.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="astra-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IP Address</th>
                <th>Personnel (Email)</th>
                <th>Role</th>
                <th>Action Log</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index}>
                  <td className="text-code" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                  <td className="text-code" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ip}</td>
                  <td>{log.email}</td>
                  <td><span className="text-code" style={{ fontSize: '0.75rem' }}>{log.role}</span></td>
                  <td>{log.action}</td>
                  <td>
                    <span className="status-badge ready" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

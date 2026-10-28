import { API_BASE } from '../config';
import React, { useState, useEffect, useCallback } from 'react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async (query = '') => {
    setLoading(true);
    const token = localStorage.getItem('astra_token');
    try {
      const url = query ? `${API_BASE}/api/v1/audit/logs?search=${encodeURIComponent(query)}` : `${API_BASE}/api/v1/audit/logs`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalCount(data.pagination?.totalItems || (data.logs ? data.logs.length : 0));
      }
    } catch (err) {
      console.warn('Audit logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(searchTerm);
  };

  return (
    <div>
      <div className="filter-panel" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="filter-group">
            <label htmlFor="audit-search-input">Search Audit Log Records</label>
            <input
              type="text"
              id="audit-search-input"
              className="filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by keyword, email, or action..."
              style={{ minWidth: '320px' }}
            />
          </div>
          <button type="submit" className="btn" style={{ height: '42px', marginBottom: '1px' }}>
            <i className="fa-solid fa-magnifying-glass"></i> Search Logs
          </button>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); fetchLogs(''); }}
            className="btn"
            style={{ height: '42px', marginBottom: '1px', backgroundColor: '#334155' }}
          >
            <i className="fa-solid fa-rotate-left"></i> Reset
          </button>
        </form>
      </div>

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Security & Audit Trails (Immutable MongoDB Repository)</span>
          <span className="status-badge ready">{totalCount} Logged Events</span>
        </div>
        <p className="visual-card-desc">Tracks authentication events, user-level file uploads, forecasts runs, and permissions configuration recorded in real time.</p>

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
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-code" style={{ whiteSpace: 'nowrap' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="text-code">{log.ipAddress || '127.0.0.1'}</td>
                    <td><strong>{log.email || 'System'}</strong></td>
                    <td>
                      <span className="status-badge ready">{log.roleName || 'System'}</span>
                    </td>
                    <td>{log.action}</td>
                    <td>
                      <span className={`status-badge ${log.status === 'Success' ? 'ready' : 'failed'}`}>
                        {log.status || 'Success'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#a0aec0', padding: '24px' }}>
                    {loading ? 'Querying audit security database...' : 'No audit entries match current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

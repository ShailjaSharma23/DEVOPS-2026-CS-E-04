import { API_BASE } from '../config';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Data Analyst');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('Password123');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('astra_token');
    try {
      const response = await fetch(`${API_BASE}/api/v1/users`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPersonnel(data);
      }
    } catch (err) {
      console.warn('User fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const token = localStorage.getItem('astra_token');
    try {
      const response = await fetch(`${API_BASE}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name,
          email,
          roleName,
          department,
          password
        })
      });

      if (response.ok) {
        setSuccessMsg(`User [${email}] provisioned successfully!`);
        setName('');
        setEmail('');
        setDepartment('');
        fetchUsers();
      } else {
        const err = await response.json();
        setErrorMsg(err.error || 'Failed to provision user');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to user management endpoint.');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem('astra_token');
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${API_BASE}/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <div className="grid-2col">
      <div className="visual-card">
        <div className="visual-card-title">
          <span>Provision New Personnel Account</span>
          <i className="fa-solid fa-user-plus text-muted"></i>
        </div>
        <p className="visual-card-desc">Create role-bounded government personnel profiles in MongoDB.</p>

        {errorMsg && (
          <div style={{ color: '#fca5a5', marginBottom: '14px', fontSize: '13px' }}>
            <i className="fa-solid fa-circle-exclamation"></i> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ color: '#86efac', marginBottom: '14px', fontSize: '13px' }}>
            <i className="fa-solid fa-circle-check"></i> {successMsg}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="filter-group">
              <label htmlFor="p-name">Full Name</label>
              <input
                type="text"
                id="p-name"
                className="filter-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Officer R. Sharma"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="p-email">Government Email</label>
              <input
                type="email"
                id="p-email"
                className="filter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="officer@astra.gov.in"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="p-role">Security Role</label>
              <select
                id="p-role"
                className="filter-select"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              >
                <option value="Administrator">Administrator (Full Access)</option>
                <option value="Data Analyst">Data Analyst (Uploads & Queries)</option>
                <option value="Resource Planning Officer">Resource Planning Officer (Forecasting)</option>
                <option value="Department Officer">Department Officer (Read-Only)</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="p-dept">Department</label>
              <input
                type="text"
                id="p-dept"
                className="filter-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                placeholder="e.g. UIDAI Regional Office"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="p-pwd">Initial Password</label>
              <input
                type="password"
                id="p-pwd"
                className="filter-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" style={{ marginTop: '8px' }}>
              <i className="fa-solid fa-shield-halved"></i> Provision in MongoDB
            </button>
          </div>
        </form>
      </div>

      <div className="visual-card">
        <div className="visual-card-title">
          <span>Active Government Accounts</span>
          <button onClick={fetchUsers} className="btn" style={{ padding: '4px 10px', fontSize: '12px' }}>
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
        <p className="visual-card-desc">Authorized operators currently provisioned in MongoDB User collection.</p>

        <div style={{ overflowX: 'auto' }}>
          <table className="astra-table">
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {personnel.length > 0 ? (
                personnel.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '11px', color: '#a0aec0' }}>{p.email}</div>
                      <div style={{ fontSize: '11px', color: '#718096' }}>{p.department}</div>
                    </td>
                    <td>
                      <span className="status-badge ready">{p.roleId?.name || p.role || 'Officer'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${p.status === 'active' ? 'ready' : 'failed'}`}>
                        {p.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(p._id, p.status || 'active')}
                        className="btn"
                        style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: p.status === 'active' ? '#ef4444' : '#10b981' }}
                      >
                        {p.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#a0aec0', padding: '24px' }}>
                    {loading ? 'Loading user registry...' : 'No users found in database.'}
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

export default Users;

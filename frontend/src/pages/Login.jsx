import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <i className="fa-solid fa-chart-line"></i>
          <h2>ASTRA PORTAL</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Aadhaar Statistical Trends & Resource Analytics
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--status-failed-bg)', color: 'var(--status-failed)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="filter-group">
            <label htmlFor="login-email">Government Email</label>
            <input
              type="email"
              id="login-email"
              className="filter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. administrator@uidai.gov.in"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="login-password">Access Password</label>
            <input
              type="password"
              id="login-password"
              className="filter-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn" disabled={submitting} style={{ marginTop: '10px' }}>
            {submitting ? (
              <span><i className="fa-solid fa-spinner fa-spin"></i> Authenticating...</span>
            ) : (
              <span>Login <i className="fa-solid fa-arrow-right-to-bracket"></i></span>
            )}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          <strong>Notice:</strong> This is a secure internal government database system. Unauthorized access attempts are actively monitored, captured, and reported.
        </div>
      </div>
    </div>
  );
};

export default Login;

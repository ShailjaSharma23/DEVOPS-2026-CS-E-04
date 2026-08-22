import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'GO';
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <header className="top-bar">
      <div className="top-title">{title}</div>
      <div className="top-actions">
        <div className="user-profile">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'Gov Officer'}</span>
            <span className="user-role-badge">{user?.role || 'Officer'}</span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: '12px' }}
            onClick={logout}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

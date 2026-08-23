import React from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccessPage, getDefaultTab } from '../utils/permissions';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, setUser } = useAuth();

  const handleRoleChange = (e) => {
    const roleValue = e.target.value;

    // Permission arrays use EXACT strings from backend/routes/*.js authorize() calls.
    // Role strings match backend/models/Role.js enum exactly.
    let role = 'Administrator';
    let permissions = ['manage_users', 'view_audit_logs', 'upload_datasets', 'manage_datasets', 'generate_forecasts'];
    let email = 'admin@uidai.gov.in';

    if (roleValue === 'analyst') {
      role = 'Data Analyst';
      permissions = ['upload_datasets'];
      email = 'a.sen@nic.in';
    } else if (roleValue === 'planning_officer') {
      role = 'Resource Planning Officer';
      permissions = ['generate_forecasts'];
      email = 'r.subra@nic.in';
    } else if (roleValue === 'department_officer') {
      role = 'Department Officer';
      permissions = [];
      email = 'd.pratap@gov.in';
    }

    const updatedUser = {
      ...user,
      email,
      role,
      permissions
    };

    localStorage.setItem('astra_user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    // If the currently active tab is not accessible under the new role, redirect to the
    // first valid tab for that role. Covers all tabs — not just 'users' and 'audit'.
    if (!canAccessPage(updatedUser, activeTab)) {
      setActiveTab(getDefaultTab(updatedUser));
    }
  };

  const currentRoleValue = user?.role === 'Data Analyst' ? 'analyst' :
                           user?.role === 'Resource Planning Officer' ? 'planning_officer' :
                           user?.role === 'Department Officer' ? 'department_officer' : 'administrator';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <i className="fa-solid fa-chart-line"></i>
        <h1>ASTRA</h1>
      </div>

      <ul className="sidebar-menu">
        {/* Dashboard — always visible to all authenticated users */}
        <li
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fa-solid fa-house"></i>
          <span>Dashboard</span>
        </li>

        {/* Datasets — Admin + Data Analyst only */}
        {canAccessPage(user, 'datasets') && (
          <li
            className={`menu-item ${activeTab === 'datasets' ? 'active' : ''}`}
            onClick={() => setActiveTab('datasets')}
          >
            <i className="fa-solid fa-database"></i>
            <span>Datasets</span>
          </li>
        )}

        {/* Analytics — Admin + Data Analyst only */}
        {canAccessPage(user, 'analytics') && (
          <li
            className={`menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fa-solid fa-chart-pie"></i>
            <span>Demographic Analytics</span>
          </li>
        )}

        {/* Forecasting — Admin + Resource Planning Officer only */}
        {canAccessPage(user, 'forecasting') && (
          <li
            className={`menu-item ${activeTab === 'forecasting' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecasting')}
          >
            <i className="fa-solid fa-bullseye"></i>
            <span>Resource Forecasting</span>
          </li>
        )}

        {/* Users — Admin only */}
        {canAccessPage(user, 'users') && (
          <li
            className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fa-solid fa-users-gear"></i>
            <span>User Control</span>
          </li>
        )}

        {/* Audit Logs — Admin only */}
        {canAccessPage(user, 'audit') && (
          <li
            className={`menu-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Audit Logs</span>
          </li>
        )}
      </ul>

      <div className="sidebar-footer">
        <div className="role-indicator">
          <span className="role-label">Logged Access Level</span>
          <select
            className="role-select"
            value={currentRoleValue}
            onChange={handleRoleChange}
          >
            <option value="administrator">Administrator</option>
            <option value="analyst">Data Analyst</option>
            <option value="planning_officer">Resource Planning Officer</option>
            <option value="department_officer">Department Officer</option>
          </select>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

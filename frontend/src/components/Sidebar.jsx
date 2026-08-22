import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, setUser } = useAuth();

  const handleRoleChange = (e) => {
    const roleValue = e.target.value;
    
    // Simulate updating user profile
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

    // Reset tab if target is hidden
    if (roleValue !== 'administrator') {
      if (activeTab === 'users' || activeTab === 'audit') {
        setActiveTab('dashboard');
      }
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
        <li 
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fa-solid fa-house"></i>
          <span>Dashboard</span>
        </li>
        
        <li 
          className={`menu-item ${activeTab === 'datasets' ? 'active' : ''}`}
          onClick={() => setActiveTab('datasets')}
        >
          <i className="fa-solid fa-database"></i>
          <span>Datasets</span>
        </li>

        <li 
          className={`menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fa-solid fa-chart-pie"></i>
          <span>Demographic Analytics</span>
        </li>

        <li 
          className={`menu-item ${activeTab === 'forecasting' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasting')}
        >
          <i className="fa-solid fa-bullseye"></i>
          <span>Resource Forecasting</span>
        </li>

        {user?.role === 'Administrator' && (
          <>
            <li 
              className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fa-solid fa-users-gear"></i>
              <span>User Control</span>
            </li>
            <li 
              className={`menu-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Audit Logs</span>
            </li>
          </>
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

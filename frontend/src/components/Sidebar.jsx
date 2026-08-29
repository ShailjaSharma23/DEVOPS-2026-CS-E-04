import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccessPage, getAuthorizedRolesForPage } from '../utils/permissions';
import RoleSwitchModal from './RoleSwitchModal';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
  { id: 'datasets', label: 'Datasets', icon: 'fa-database' },
  { id: 'analytics', label: 'Demographic Analytics', icon: 'fa-chart-pie' },
  { id: 'forecasting', label: 'Resource Forecasting', icon: 'fa-bullseye' },
  { id: 'users', label: 'User Control', icon: 'fa-users-gear' },
  { id: 'audit', label: 'Audit Logs', icon: 'fa-shield-halved' }
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [hoveredLockedTab, setHoveredLockedTab] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTargetRole, setSelectedTargetRole] = useState(null);

  const handleLockedItemClick = (item) => {
    const roles = getAuthorizedRolesForPage(item.id);
    const targetRole = roles.find(r => r !== 'Administrator') || roles[0] || 'Administrator';
    setSelectedTargetRole(targetRole);
    setModalOpen(true);
  };

  const handleOpenRoleSwitch = (roleName) => {
    setSelectedTargetRole(roleName);
    setModalOpen(true);
  };

  const handleConfirmSignOut = () => {
    setModalOpen(false);
    logout();
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <i className="fa-solid fa-chart-line"></i>
          <h1>ASTRA</h1>
        </div>

        <ul className="sidebar-menu">
          {MENU_ITEMS.map((item) => {
            const isAccessible = canAccessPage(user, item.id);
            const authorizedRoles = getAuthorizedRolesForPage(item.id);
            const isHovered = hoveredLockedTab === item.id;

            if (isAccessible) {
              return (
                <li
                  key={item.id}
                  className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </li>
              );
            }

            return (
              <li
                key={item.id}
                className="menu-item locked"
                onClick={() => handleLockedItemClick(item)}
                onMouseEnter={() => setHoveredLockedTab(item.id)}
                onMouseLeave={() => setHoveredLockedTab(null)}
                style={{ position: 'relative' }}
              >
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
                <span className="lock-badge" title="Access Locked">
                  <i className="fa-solid fa-lock"></i>
                </span>

                {isHovered && (
                  <div className="locked-popover">
                    <div className="locked-popover-title">
                      <i className="fa-solid fa-lock"></i> Access Restricted
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Accessible to:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.8rem' }}>
                      {authorizedRoles.map((role) => (
                        <li key={role} style={{ margin: '3px 0' }}>
                          <span
                            className="locked-role-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRoleSwitch(role);
                            }}
                          >
                            {role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <div className="role-indicator">
            <span className="role-label">Logged Access Level</span>
            <div className="role-badge-display">
              <i className="fa-solid fa-user-shield" style={{ marginRight: '8px', color: 'var(--accent-color)' }}></i>
              <span>{user?.role || 'Officer'}</span>
            </div>
          </div>
        </div>
      </aside>

      <RoleSwitchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetRole={selectedTargetRole}
        currentRole={user?.role}
        onConfirmSignOut={handleConfirmSignOut}
      />
    </>
  );
};

export default Sidebar;

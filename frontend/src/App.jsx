import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import RegionFilter from './components/RegionFilter';
import { canAccessPage, getDefaultTab } from './utils/permissions';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Datasets from './pages/Datasets';
import Analytics from './pages/Analytics';
import Forecasting from './pages/Forecasting';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';

const MainAppContent = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    state: 'all',
    district: 'all',
    time: '12m'
  });

  // Page-level guard: whenever the user (role/permissions) changes, ensure the currently
  // active tab is still accessible. If not, redirect to the first permitted tab.
  // Placed before the early return to comply with React Rules of Hooks.
  useEffect(() => {
    if (user && !canAccessPage(user, activeTab)) {
      setActiveTab(getDefaultTab(user));
    }
  }, [user]);

  // Redirect to login if user isn't authenticated
  if (!user || !token) {
    return <Login />;
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'datasets': return 'Data Repository Management';
      case 'analytics': return 'Demographic & Biometric Analytics';
      case 'forecasting': return 'Prophet Predictive Forecasting';
      case 'users': return 'Personnel Registry Control';
      case 'audit': return 'Operational Audit Logs';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-wrapper">
        <Navbar title={getPageTitle()} />

        <main className="content-body">
          {/* Render filters on dashboards/analytics/forecasting only */}
          {(activeTab === 'dashboard' || activeTab === 'analytics' || activeTab === 'forecasting') && (
            <RegionFilter filters={filters} setFilters={setFilters} />
          )}

          {/* Page-level access guard: page component only renders if the user's current
              role/permissions permit it. This is a second line of defence — the sidebar
              already hides unauthorized items, but this prevents rendering even if activeTab
              is set programmatically to an unauthorized value. */}
          {activeTab === 'dashboard' && <Dashboard filters={filters} />}
          {canAccessPage(user, 'datasets') && activeTab === 'datasets' && <Datasets />}
          {canAccessPage(user, 'analytics') && activeTab === 'analytics' && <Analytics filters={filters} />}
          {canAccessPage(user, 'forecasting') && activeTab === 'forecasting' && <Forecasting filters={filters} />}
          {canAccessPage(user, 'users') && activeTab === 'users' && <Users />}
          {canAccessPage(user, 'audit') && activeTab === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;

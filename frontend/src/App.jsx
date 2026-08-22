import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import RegionFilter from './components/RegionFilter';

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

          {activeTab === 'dashboard' && <Dashboard filters={filters} />}
          {activeTab === 'datasets' && <Datasets />}
          {activeTab === 'analytics' && <Analytics filters={filters} />}
          {activeTab === 'forecasting' && <Forecasting filters={filters} />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'audit' && <AuditLogs />}
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

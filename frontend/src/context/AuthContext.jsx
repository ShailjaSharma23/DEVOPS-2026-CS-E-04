import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('astra_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage, validate session
    const checkSession = async () => {
      if (token) {
        try {
          const response = await fetch('/api/v1/auth/session', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Invalidate session
            logout();
          }
        } catch (err) {
          console.warn('Backend API offline. Operating in simulation fallback mode.');
          // Offline mock resolution based on storage
          const storedUser = localStorage.getItem('astra_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      }
      setLoading(false);
    };

    checkSession();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('astra_token', data.token);
        localStorage.setItem('astra_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err) {
      console.warn('Backend server offline. Initiating mock login simulation.');
      // Local fallback simulation
      let role = 'Administrator';
      let permissions = ['manage_users', 'view_audit_logs', 'upload_datasets', 'manage_datasets', 'generate_forecasts'];
      
      if (email.includes('analyst')) {
        role = 'Data Analyst';
        permissions = ['upload_datasets'];
      } else if (email.includes('planning')) {
        role = 'Resource Planning Officer';
        permissions = ['generate_forecasts'];
      } else if (email.includes('dept') || email.includes('officer')) {
        role = 'Department Officer';
        permissions = [];
      }

      const mockUser = {
        id: 'mock-100',
        name: email.split('@')[0].toUpperCase(),
        email,
        role,
        permissions,
        department: 'UIDAI Simulation Workspace'
      };

      localStorage.setItem('astra_token', 'mock_jwt_token_456');
      localStorage.setItem('astra_user', JSON.stringify(mockUser));
      setToken('mock_jwt_token_456');
      setUser(mockUser);
      return { success: true };
    }
  };

  const logout = async () => {
    if (token && !token.startsWith('mock')) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        // quiet ignore
      }
    }
    localStorage.removeItem('astra_token');
    localStorage.removeItem('astra_user');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    // Admins bypass all restrictions
    if (user.role === 'Administrator') return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

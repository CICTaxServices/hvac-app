import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminPanel from './pages/AdminPanel';
import TicketDetails from './pages/TicketDetails';
import './styles/index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getHomePath(user.role)} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {user ? (
          <>
            {user.role === 'admin' && (
              <Route
                path="/admin/*"
                element={<AdminPanel user={user} onLogout={handleLogout} />}
              />
            )}
            {user.role === 'technician' && (
              <Route
                path="/technician/*"
                element={<TechnicianDashboard user={user} onLogout={handleLogout} />}
              />
            )}
            {user.role === 'accounting' && (
              <Route
                path="/accounting/*"
                element={<Dashboard user={user} onLogout={handleLogout} />}
              />
            )}
            <Route path="/ticket/:id" element={<TicketDetails user={user} />} />
            <Route path="/" element={<Navigate to={getHomePath(user.role)} replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

function getHomePath(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'technician':
      return '/technician/dashboard';
    case 'accounting':
      return '/accounting/dashboard';
    default:
      return '/login';
  }
}

export default App;

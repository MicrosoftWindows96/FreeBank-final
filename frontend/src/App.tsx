import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { AuthProvider } from './contexts/AuthContext';
import AuthLanding from './components/Authentication/AuthLanding';
import Login from './components/Authentication/Login';
import Register from './components/Authentication/Register';
import Dashboard from './components/Dashboard/Dashboard';
import EducationalPage from './components/Dashboard/EducationalPage';
import PrivateRoute from './components/Authentication/PrivateRoute';
import './styles/App.css';
import './styles/MobileContainer.css';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="mobile-container-wrapper">
        <div className="mobile-container">
          <div className="mobile-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <Web3Provider>
          <div className="mobile-container-wrapper">
            <div className="mobile-container">
              <div className="mobile-mode-indicator">
                {t('app.mobile_view_mode', 'Mobile View Mode')}
              </div>
              <div className="mobile-content">
                <div className="app">
                  <Routes>
                    <Route path="/" element={<AuthLanding />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/education" 
                      element={
                        <PrivateRoute>
                          <EducationalPage />
                        </PrivateRoute>
                      } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </div>
          </div>
        </Web3Provider>
      </AuthProvider>
    </Router>
  );
};

export default App;

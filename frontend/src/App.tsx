import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layouts
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Dashboard
import Dashboard from './components/Dashboard/Dashboard';

// Meters
import MeterList from './components/Meters/MeterList';
import MeterDetails from './components/Meters/MeterDetails';
import MeterTopUp from './components/Meters/MeterTopUp';

// Payments
import PaymentHistory from './components/Payments/PaymentHistory';

// Profile
import Profile from './components/Profile/Profile';

// Settings
import Settings from './components/Settings/Settings';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CssBaseline />
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  <Route path="/meters" element={<MeterList />} />
                  <Route path="/meters/:id" element={<MeterDetails />} />
                  <Route path="/meters/:id/topup" element={<MeterTopUp />} />
                  
                  <Route path="/payments" element={<PaymentHistory />} />
                  
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Redirect root to dashboard or login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
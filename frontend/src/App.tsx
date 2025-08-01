import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import DashboardLayout from './components/layouts/DashboardLayout';
import lazyLoad from './utils/lazyLoad';

// Public Pages - Lazy loaded
const LandingPage = lazyLoad(() => import('./pages/LandingPage'));

// Auth Pages - Lazy loaded
const LoginPage = lazyLoad(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazyLoad(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazyLoad(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyLoad(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazyLoad(() => import('./pages/auth/VerifyEmailPage'));

// Dashboard Pages - Lazy loaded
const SuperadminDashboard = lazyLoad(() => import('./pages/dashboard/superadmin/SuperadminDashboard'));
const ClientDashboard = lazyLoad(() => import('./pages/dashboard/client/ClientDashboard'));
const CustomerDashboard = lazyLoad(() => import('./pages/dashboard/customer/CustomerDashboard'));

// Error Pages - Lazy loaded
const NotFoundPage = lazyLoad(() => import('./pages/errors/NotFoundPage'));
const UnauthorizedPage = lazyLoad(() => import('./pages/errors/UnauthorizedPage'));
const ServerErrorPage = lazyLoad(() => import('./pages/errors/ServerErrorPage'));

// Styles
import 'react-toastify/dist/ReactToastify.css';
import './styles/index.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } 
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-email/:token"
                element={
                  <PublicRoute>
                    <VerifyEmailPage />
                  </PublicRoute>
                }
              />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['superadmin', 'client', 'customer']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Superadmin Routes */}
                <Route
                  path="superadmin/*"
                  element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                      <SuperadminDashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Client Routes */}
                <Route
                  path="client/*"
                  element={
                    <ProtectedRoute allowedRoles={['client']}>
                      <ClientDashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Customer Routes */}
                <Route
                  path="customer/*"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Error Routes */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/server-error" element={<ServerErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
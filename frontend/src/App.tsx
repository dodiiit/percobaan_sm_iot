import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserRole } from './contexts/AuthContext';

// Layouts
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import RoleBasedRoute from './components/Layout/RoleBasedRoute';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Common Pages
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';

// Customer Pages
import Dashboard from './pages/dashboard/customer/Dashboard';
import CustomerDashboard from './pages/dashboard/customer/CustomerDashboard';
import Consumption from './pages/dashboard/customer/Consumption';
import CustomerMeters from './pages/dashboard/customer/Meters';
import CustomerPayments from './pages/dashboard/customer/Payments';
import Topup from './pages/dashboard/customer/Topup';

// Client Pages
import ClientDashboard from './pages/dashboard/client/ClientDashboard';
import ClientMeters from './pages/dashboard/client/Meters';
import Customers from './pages/dashboard/client/Customers';
import Properties from './pages/dashboard/client/Properties';
import ConsumptionAnalytics from './pages/dashboard/client/ConsumptionAnalytics';
import ClientPayments from './pages/dashboard/client/Payments';
import Reports from './pages/dashboard/client/Reports';
import ClientSettings from './pages/dashboard/client/Settings';

// Superadmin Pages
import SuperadminDashboard from './pages/dashboard/superadmin/SuperadminDashboard';
import ClientsManagement from './pages/dashboard/superadmin/ClientsManagement';
import CustomersManagement from './pages/dashboard/superadmin/CustomersManagement';
import MetersManagement from './pages/dashboard/superadmin/MetersManagement';
import PropertiesManagement from './pages/dashboard/superadmin/PropertiesManagement';
import PaymentsManagement from './pages/dashboard/superadmin/PaymentsManagement';
import ReportsManagement from './pages/dashboard/superadmin/ReportsManagement';
import TariffsManagement from './pages/dashboard/superadmin/TariffsManagement';
import SystemSettings from './pages/dashboard/superadmin/SystemSettings';

// Error Pages
import NotFound from './pages/errors/NotFound';

// Legacy Components (to be replaced with role-specific pages)
import MeterList from './components/Meters/MeterList';
import MeterDetails from './components/Meters/MeterDetails';
import MeterTopUp from './components/Meters/MeterTopUp';
import PaymentHistory from './components/Payments/PaymentHistory';

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

              {/* Customer Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleBasedRoute allowedRoles={[UserRole.CUSTOMER]} />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<CustomerDashboard />} />
                    <Route path="/meters" element={<CustomerMeters />} />
                    <Route path="/meters/:id" element={<MeterDetails />} />
                    <Route path="/meters/:id/topup" element={<MeterTopUp />} />
                    <Route path="/consumption" element={<Consumption />} />
                    <Route path="/payments" element={<CustomerPayments />} />
                    <Route path="/topup" element={<Topup />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
              </Route>

              {/* Client Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleBasedRoute allowedRoles={[UserRole.CLIENT]} />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<ClientDashboard />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/meters" element={<ClientMeters />} />
                    <Route path="/properties" element={<Properties />} />
                    <Route path="/analytics" element={<ConsumptionAnalytics />} />
                    <Route path="/payments" element={<ClientPayments />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<ClientSettings />} />
                  </Route>
                </Route>
              </Route>

              {/* Superadmin Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleBasedRoute allowedRoles={[UserRole.SUPERADMIN]} />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<SuperadminDashboard />} />
                    <Route path="/clients" element={<ClientsManagement />} />
                    <Route path="/customers" element={<CustomersManagement />} />
                    <Route path="/meters" element={<MetersManagement />} />
                    <Route path="/properties" element={<PropertiesManagement />} />
                    <Route path="/payments" element={<PaymentsManagement />} />
                    <Route path="/reports" element={<ReportsManagement />} />
                    <Route path="/tariffs" element={<TariffsManagement />} />
                    <Route path="/system" element={<SystemSettings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback Protected Route (for backward compatibility) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/legacy-dashboard" element={<Dashboard />} />
                </Route>
              </Route>

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
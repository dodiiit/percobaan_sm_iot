import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';

// Layouts
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Dashboard Pages
import SuperadminDashboard from './pages/dashboard/superadmin/Dashboard';
import ClientDashboard from './pages/dashboard/client/Dashboard';
import CustomerDashboard from './pages/dashboard/customer/Dashboard';

// Superadmin Pages
import ClientsManagement from './pages/dashboard/superadmin/ClientsManagement';
import PropertiesManagement from './pages/dashboard/superadmin/PropertiesManagement';
import CustomersManagement from './pages/dashboard/superadmin/CustomersManagement';
import MetersManagement from './pages/dashboard/superadmin/MetersManagement';
import PaymentsManagement from './pages/dashboard/superadmin/PaymentsManagement';
import ReportsManagement from './pages/dashboard/superadmin/ReportsManagement';
import ServiceFeesManagement from './pages/dashboard/superadmin/ServiceFeesManagement';
import SystemSettings from './pages/dashboard/superadmin/SystemSettings';

// Client Pages
import ClientProperties from './pages/dashboard/client/Properties';
import ClientCustomers from './pages/dashboard/client/Customers';
import ClientMeters from './pages/dashboard/client/Meters';
import ClientPayments from './pages/dashboard/client/Payments';
import ClientReports from './pages/dashboard/client/Reports';
import ClientSettings from './pages/dashboard/client/Settings';

// Customer Pages
import CustomerMeters from './pages/dashboard/customer/Meters';
import CustomerConsumption from './pages/dashboard/customer/Consumption';
import CustomerPayments from './pages/dashboard/customer/Payments';
import CustomerTopup from './pages/dashboard/customer/Topup';
import CustomerProfile from './pages/dashboard/customer/Profile';

// Error Pages
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';
import ServerError from './pages/errors/ServerError';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  useEffect(() => {
    // Apply theme class to body
    document.body.className = theme;
    
    // Set page title
    document.title = t('app.title');
  }, [theme, t]);
  
  return (
    <div className={`App ${theme}`}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Route>
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['superadmin', 'client', 'customer']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard/home" replace />} />
          
          {/* Dynamic Dashboard Home based on user role */}
          <Route path="home" element={
            <ProtectedRoute allowedRoles={['superadmin', 'client', 'customer']}>
              {/* This will be replaced with the appropriate dashboard based on user role */}
              <div>Dashboard Home</div>
            </ProtectedRoute>
          } />
          
          {/* Superadmin Routes */}
          <Route path="superadmin" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperadminDashboard />
            </ProtectedRoute>
          } />
          <Route path="clients" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <ClientsManagement />
            </ProtectedRoute>
          } />
          <Route path="properties" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <PropertiesManagement />
            </ProtectedRoute>
          } />
          <Route path="customers" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <CustomersManagement />
            </ProtectedRoute>
          } />
          <Route path="meters" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <MetersManagement />
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <PaymentsManagement />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <ReportsManagement />
            </ProtectedRoute>
          } />
          <Route path="service-fees" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <ServiceFeesManagement />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SystemSettings />
            </ProtectedRoute>
          } />
          
          {/* Client Routes */}
          <Route path="client" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="client/properties" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientProperties />
            </ProtectedRoute>
          } />
          <Route path="client/customers" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientCustomers />
            </ProtectedRoute>
          } />
          <Route path="client/meters" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientMeters />
            </ProtectedRoute>
          } />
          <Route path="client/payments" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientPayments />
            </ProtectedRoute>
          } />
          <Route path="client/reports" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientReports />
            </ProtectedRoute>
          } />
          <Route path="client/settings" element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientSettings />
            </ProtectedRoute>
          } />
          
          {/* Customer Routes */}
          <Route path="customer" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="customer/meters" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerMeters />
            </ProtectedRoute>
          } />
          <Route path="customer/consumption" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerConsumption />
            </ProtectedRoute>
          } />
          <Route path="customer/payments" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPayments />
            </ProtectedRoute>
          } />
          <Route path="customer/topup" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerTopup />
            </ProtectedRoute>
          } />
          <Route path="customer/profile" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerProfile />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/server-error" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
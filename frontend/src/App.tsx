import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, CircularProgress } from '@mui/material';

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

// Performance monitoring
import { registerWebVitals } from './utils/performance';

// Loading Fallback
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <CircularProgress color="primary" />
    <p>Loading...</p>
  </div>
);

// Lazy-loaded Auth Pages
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'));

// Lazy-loaded Common Pages
const Profile = lazy(() => import('./components/Profile/Profile'));
const Settings = lazy(() => import('./components/Settings/Settings'));

// Lazy-loaded Customer Pages
const Dashboard = lazy(() => import('./pages/dashboard/customer/Dashboard'));
const CustomerDashboard = lazy(() => import('./pages/dashboard/customer/CustomerDashboard'));
const Consumption = lazy(() => import('./pages/dashboard/customer/Consumption'));
const CustomerMeters = lazy(() => import('./pages/dashboard/customer/Meters'));
const CustomerPayments = lazy(() => import('./pages/dashboard/customer/Payments'));
const Topup = lazy(() => import('./pages/dashboard/customer/Topup'));

// Lazy-loaded Client Pages
const ClientDashboard = lazy(() => import('./pages/dashboard/client/ClientDashboard'));
const ClientMeters = lazy(() => import('./pages/dashboard/client/Meters'));
const Customers = lazy(() => import('./pages/dashboard/client/Customers'));
const Properties = lazy(() => import('./pages/dashboard/client/Properties'));
const ConsumptionAnalytics = lazy(() => import('./pages/dashboard/client/ConsumptionAnalytics'));
const ClientPayments = lazy(() => import('./pages/dashboard/client/Payments'));
const Reports = lazy(() => import('./pages/dashboard/client/Reports'));
const ClientSettings = lazy(() => import('./pages/dashboard/client/Settings'));

// Lazy-loaded Superadmin Pages
const SuperadminDashboard = lazy(() => import('./pages/dashboard/superadmin/SuperadminDashboard'));
const ClientsManagement = lazy(() => import('./pages/dashboard/superadmin/ClientsManagement'));
const CustomersManagement = lazy(() => import('./pages/dashboard/superadmin/CustomersManagement'));
const MetersManagement = lazy(() => import('./pages/dashboard/superadmin/MetersManagement'));
const PropertiesManagement = lazy(() => import('./pages/dashboard/superadmin/PropertiesManagement'));
const PaymentsManagement = lazy(() => import('./pages/dashboard/superadmin/PaymentsManagement'));
const ReportsManagement = lazy(() => import('./pages/dashboard/superadmin/ReportsManagement'));
const TariffsManagement = lazy(() => import('./pages/dashboard/superadmin/TariffsManagement'));
const SystemSettings = lazy(() => import('./pages/dashboard/superadmin/SystemSettings'));

// Lazy-loaded Error Pages
const NotFound = lazy(() => import('./pages/errors/NotFound'));

// Lazy-loaded Legacy Components
const MeterList = lazy(() => import('./components/Meters/MeterList'));
const MeterDetails = lazy(() => import('./components/Meters/MeterDetails'));
const MeterTopUp = lazy(() => import('./components/Meters/MeterTopUp'));
const PaymentHistory = lazy(() => import('./components/Payments/PaymentHistory'));

const App: React.FC = () => {
  // Register web vitals for performance monitoring
  React.useEffect(() => {
    registerWebVitals();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CssBaseline />
          <Router>
            <Suspense fallback={<LoadingFallback />}>
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
                      <Route path="/dashboard" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <CustomerDashboard />
                        </Suspense>
                      } />
                      <Route path="/meters" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <CustomerMeters />
                        </Suspense>
                      } />
                      <Route path="/meters/:id" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <MeterDetails />
                        </Suspense>
                      } />
                      <Route path="/meters/:id/topup" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <MeterTopUp />
                        </Suspense>
                      } />
                      <Route path="/consumption" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Consumption />
                        </Suspense>
                      } />
                      <Route path="/payments" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <CustomerPayments />
                        </Suspense>
                      } />
                      <Route path="/topup" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Topup />
                        </Suspense>
                      } />
                      <Route path="/profile" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Profile />
                        </Suspense>
                      } />
                      <Route path="/settings" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Settings />
                        </Suspense>
                      } />
                    </Route>
                  </Route>
                </Route>

                {/* Client Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<RoleBasedRoute allowedRoles={[UserRole.CLIENT]} />}>
                    <Route element={<MainLayout />}>
                      <Route path="/dashboard" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ClientDashboard />
                        </Suspense>
                      } />
                      <Route path="/customers" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Customers />
                        </Suspense>
                      } />
                      <Route path="/meters" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ClientMeters />
                        </Suspense>
                      } />
                      <Route path="/properties" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Properties />
                        </Suspense>
                      } />
                      <Route path="/analytics" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ConsumptionAnalytics />
                        </Suspense>
                      } />
                      <Route path="/payments" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ClientPayments />
                        </Suspense>
                      } />
                      <Route path="/reports" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Reports />
                        </Suspense>
                      } />
                      <Route path="/profile" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Profile />
                        </Suspense>
                      } />
                      <Route path="/settings" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ClientSettings />
                        </Suspense>
                      } />
                    </Route>
                  </Route>
                </Route>

                {/* Superadmin Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<RoleBasedRoute allowedRoles={[UserRole.SUPERADMIN]} />}>
                    <Route element={<MainLayout />}>
                      <Route path="/dashboard" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <SuperadminDashboard />
                        </Suspense>
                      } />
                      <Route path="/clients" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ClientsManagement />
                        </Suspense>
                      } />
                      <Route path="/customers" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <CustomersManagement />
                        </Suspense>
                      } />
                      <Route path="/meters" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <MetersManagement />
                        </Suspense>
                      } />
                      <Route path="/properties" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <PropertiesManagement />
                        </Suspense>
                      } />
                      <Route path="/payments" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <PaymentsManagement />
                        </Suspense>
                      } />
                      <Route path="/reports" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <ReportsManagement />
                        </Suspense>
                      } />
                      <Route path="/tariffs" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <TariffsManagement />
                        </Suspense>
                      } />
                      <Route path="/system" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <SystemSettings />
                        </Suspense>
                      } />
                      <Route path="/profile" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Profile />
                        </Suspense>
                      } />
                      <Route path="/settings" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Settings />
                        </Suspense>
                      } />
                    </Route>
                  </Route>
                </Route>

                {/* Fallback Protected Route (for backward compatibility) */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/legacy-dashboard" element={
                      <Suspense fallback={<LoadingFallback />}>
                        <Dashboard />
                      </Suspense>
                    } />
                  </Route>
                </Route>

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 Page */}
                <Route path="*" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Loading Component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
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

// Lazy-loaded Landing Page
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Lazy-loaded Legacy Components
const MeterList = lazy(() => import('./components/Meters/MeterList'));
const MeterDetails = lazy(() => import('./components/Meters/MeterDetails'));
const MeterTopUp = lazy(() => import('./components/Meters/MeterTopUp'));
const PaymentHistory = lazy(() => import('./components/Payments/PaymentHistory'));

const App: React.FC = () => {
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

                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
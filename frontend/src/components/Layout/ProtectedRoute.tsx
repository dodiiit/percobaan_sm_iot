import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * A component that restricts access to authenticated users
 * For role-based access control, use RoleBasedRoute instead
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role (if specified)
  if (allowedRoles && allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    // User doesn't have the required role, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
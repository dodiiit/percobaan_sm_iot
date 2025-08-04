import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on user role
    if (user.role === 'superadmin') {
      return <Navigate to="/dashboard/superadmin" replace />;
    } else if (user.role === 'client') {
      return <Navigate to="/dashboard/client" replace />;
    } else if (user.role === 'customer') {
      return <Navigate to="/dashboard/customer" replace />;
    }
  }

  return <>{children}</>;
};

export default PublicRoute;
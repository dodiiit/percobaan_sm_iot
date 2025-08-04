import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../contexts/AuthContext';

interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
}

/**
 * A component that restricts access to routes based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param redirectPath - Path to redirect to if user doesn't have permission (defaults to /dashboard)
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  allowedRoles, 
  redirectPath = '/dashboard' 
}) => {
  const { userRole, isAuthenticated, isLoading } = useAuth();
  
  // If still loading auth state, don't render anything yet
  if (isLoading) {
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user role is not in the allowed roles, redirect to the specified path
  if (userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // If user has permission, render the child routes
  return <Outlet />;
};

export default RoleBasedRoute;
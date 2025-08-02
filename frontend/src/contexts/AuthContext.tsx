import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../services/api';

export enum UserRole {
  CUSTOMER = 'customer',
  CLIENT = 'client',
  SUPERADMIN = 'superadmin'
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  isCustomer: boolean;
  isClient: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await userAPI.getProfile();
          const userData = response.data.data;
          
          // Ensure the role is one of the defined UserRole values
          const userRoleValue = userData.role as UserRole;
          if (Object.values(UserRole).includes(userRoleValue)) {
            setUserRole(userRoleValue);
          } else {
            // Default to customer if role is not recognized
            console.warn(`Unrecognized role: ${userData.role}, defaulting to customer`);
            userData.role = UserRole.CUSTOMER;
            setUserRole(UserRole.CUSTOMER);
          }
          
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUserRole(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { user, access_token, refresh_token } = response.data.data;
      
      // Ensure the role is one of the defined UserRole values
      const userRoleValue = user.role as UserRole;
      if (Object.values(UserRole).includes(userRoleValue)) {
        setUserRole(userRoleValue);
      } else {
        // Default to customer if role is not recognized
        console.warn(`Unrecognized role: ${user.role}, defaulting to customer`);
        user.role = UserRole.CUSTOMER;
        setUserRole(UserRole.CUSTOMER);
      }
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setUserRole(null);
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      await authAPI.register(userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      await authAPI.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password request failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string, passwordConfirmation: string) => {
    setIsLoading(true);
    try {
      await authAPI.resetPassword(token, password, passwordConfirmation);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Compute role-based flags
  const isCustomer = userRole === UserRole.CUSTOMER;
  const isClient = userRole === UserRole.CLIENT;
  const isSuperAdmin = userRole === UserRole.SUPERADMIN;

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    userRole,
    isCustomer,
    isClient,
    isSuperAdmin,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
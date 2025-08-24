import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../services/api';
import { mockApi, shouldUseMockApi } from '../services/mockApi';

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
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          if (shouldUseMockApi()) {
            const result = await mockApi.getProfile(token);
            const userData = result.data;
            const userRoleValue = userData.role as UserRole;
            if (Object.values(UserRole).includes(userRoleValue)) {
              setUserRole(userRoleValue);
            } else {
              console.warn(`Unrecognized role: ${userData.role}, defaulting to customer`);
              userData.role = UserRole.CUSTOMER;
              setUserRole(UserRole.CUSTOMER);
            }
            setUser(userData);
          } else {
            const response = await userAPI.getProfile();
            const userData = response.data.data;
            const userRoleValue = userData.role as UserRole;
            if (Object.values(UserRole).includes(userRoleValue)) {
              setUserRole(userRoleValue);
            } else {
              console.warn(`Unrecognized role: ${userData.role}, defaulting to customer`);
              userData.role = UserRole.CUSTOMER;
              setUserRole(UserRole.CUSTOMER);
            }
            setUser(userData);
          }
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

  const login = async (email: string, password: string, remember: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (shouldUseMockApi()) {
        const result = await mockApi.login(email, password);
        const { user } = result.data;
        const access_token = result.data.token;
        const refresh_token = 'mock_refresh_token';

        const userRoleValue = user.role as UserRole;
        if (Object.values(UserRole).includes(userRoleValue)) {
          setUserRole(userRoleValue);
        } else {
          console.warn(`Unrecognized role: ${user.role}, defaulting to customer`);
          user.role = UserRole.CUSTOMER;
          setUserRole(UserRole.CUSTOMER);
        }

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('access_token', access_token);
        storage.setItem('refresh_token', refresh_token);
        setUser(user);
      } else {
        const response = await authAPI.login({ email, password, remember });
        const { user, access_token, refresh_token } = response.data.data;

        const userRoleValue = user.role as UserRole;
        if (Object.values(UserRole).includes(userRoleValue)) {
          setUserRole(userRoleValue);
        } else {
          console.warn(`Unrecognized role: ${user.role}, defaulting to customer`);
          user.role = UserRole.CUSTOMER;
          setUserRole(UserRole.CUSTOMER);
        }

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('access_token', access_token);
        storage.setItem('refresh_token', refresh_token);
        setUser(user);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error?.response?.data?.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (!shouldUseMockApi()) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
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
    setError(null);
    try {
      await authAPI.resetPassword(token, password, passwordConfirmation);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      setError(error?.response?.data?.message || 'Password reset failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authAPI.verifyEmail(token);
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setError(error?.response?.data?.message || 'Email verification failed. Please try again.');
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
    error,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
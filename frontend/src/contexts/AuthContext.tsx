import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'client' | 'customer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user data
        const response = await api.get('/users/me');
        
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string, remember: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data.data;
      
      // Save token to localStorage
      if (remember) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      // Redirect based on user role
      if (user.role === 'superadmin') {
        navigate('/dashboard/superadmin');
      } else if (user.role === 'client') {
        navigate('/dashboard/client');
      } else if (user.role === 'customer') {
        navigate('/dashboard/customer');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'An error occurred during login');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await api.post('/auth/logout');
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Remove token from API headers
      delete api.defaults.headers.common['Authorization'];
      
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/auth/register', userData);
      
      // Redirect to login page with success message
      navigate('/login', { state: { message: 'Registration successful! Please check your email to verify your account.' } });
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };
  
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/auth/forgot-password', { email });
      
      // Redirect to login page with success message
      navigate('/login', { state: { message: 'Password reset link has been sent to your email.' } });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.message || 'An error occurred while sending reset link');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (token: string, password: string, passwordConfirmation: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/auth/reset-password', { token, password, password_confirmation: passwordConfirmation });
      
      // Redirect to login page with success message
      navigate('/login', { state: { message: 'Password has been reset successfully.' } });
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.response?.data?.message || 'An error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyEmail = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.get(`/auth/verify-email/${token}`);
      
      // Redirect to login page with success message
      navigate('/login', { state: { message: 'Email verified successfully.' } });
    } catch (error: any) {
      console.error('Verify email error:', error);
      setError(error.response?.data?.message || 'An error occurred while verifying email');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendVerification = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.post('/auth/resend-verification', { email });
      
      // Show success message
      alert('Verification email has been resent.');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      setError(error.response?.data?.message || 'An error occurred while resending verification email');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.put('/users/me', userData);
      
      setUser(response.data.data);
      
      // Show success message
      alert('Profile updated successfully.');
    } catch (error: any) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.message || 'An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePassword = async (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await api.put('/users/me/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      });
      
      // Show success message
      alert('Password updated successfully.');
    } catch (error: any) {
      console.error('Update password error:', error);
      setError(error.response?.data?.message || 'An error occurred while updating password');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
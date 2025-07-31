import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  phone?: string;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'client' | 'customer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  }

  async register(userData: RegisterData): Promise<void> {
    await api.post('/auth/register', userData);
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string, passwordConfirmation: string): Promise<void> {
    await api.post('/auth/reset-password', {
      token,
      password,
      password_confirmation: passwordConfirmation
    });
  }

  async verifyEmail(token: string): Promise<void> {
    await api.get(`/auth/verify-email/${token}`);
  }

  async resendVerification(email: string): Promise<void> {
    await api.post('/auth/resend-verification', { email });
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put('/users/me', userData);
    return response.data.data;
  }

  async updatePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<void> {
    await api.put('/users/me/password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPasswordConfirmation
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data.data;
  }
}

export default new AuthService();
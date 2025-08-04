import { enhancedApi, ApiResponse, ApiError } from './enhancedApi';

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  phone?: string;
  address?: string;
  terms_accepted: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'client' | 'customer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  phone?: string;
  address?: string;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  permissions?: string[];
  preferences?: any;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface PasswordResetRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

class EnhancedAuthService {
  private readonly baseUrl = '/auth';

  // Login with comprehensive validation and error handling
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    // Validate required fields
    if (!credentials.email || !credentials.password) {
      throw {
        message: 'Email and password are required',
        code: 'VALIDATION_ERROR',
        details: {
          missingFields: [
            !credentials.email && 'email',
            !credentials.password && 'password'
          ].filter(Boolean)
        }
      } as ApiError;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw {
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/login`, credentials, {
      cacheKey: 'login_attempt',
      skipLoadingState: false,
      retry: {
        retries: 2,
        retryDelay: 1500,
        retryCondition: (error) => {
          // Don't retry on authentication failures (401) or validation errors (422)
          return ![401, 422].includes(error.response?.status || 0);
        },
        onRetry: (retryCount, error) => {
          console.warn(`Login retry ${retryCount} due to:`, error.message);
        }
      }
    });
  }

  // Register with comprehensive validation
  async register(userData: RegisterData): Promise<ApiResponse<{ message: string }>> {
    // Validate required fields
    const requiredFields = ['name', 'email', 'password', 'password_confirmation', 'role'];
    const missingFields = requiredFields.filter(field => !(userData as any)[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw {
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' }
      } as ApiError;
    }

    // Validate password strength
    if (userData.password.length < 8) {
      throw {
        message: 'Password must be at least 8 characters long',
        code: 'VALIDATION_ERROR',
        details: { field: 'password' }
      } as ApiError;
    }

    // Validate password confirmation
    if (userData.password !== userData.password_confirmation) {
      throw {
        message: 'Password confirmation does not match',
        code: 'VALIDATION_ERROR',
        details: { field: 'password_confirmation' }
      } as ApiError;
    }

    // Validate terms acceptance
    if (!userData.terms_accepted) {
      throw {
        message: 'Terms and conditions must be accepted',
        code: 'VALIDATION_ERROR',
        details: { field: 'terms_accepted' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/register`, userData, {
      cacheKey: 'register_attempt',
      retry: {
        retries: 1,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on validation errors (422) or conflicts (409)
          return ![422, 409].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Logout with cleanup
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await enhancedApi.post(`${this.baseUrl}/logout`, {}, {
        cacheKey: 'logout_attempt',
        retry: {
          retries: 1,
          retryDelay: 1000
        }
      });

      // Clear local storage and session storage
      this.clearAuthData();
      
      return response;
    } catch (error) {
      // Even if logout fails on server, clear local data
      this.clearAuthData();
      throw error;
    }
  }

  // Forgot password with email validation
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    if (!email) {
      throw {
        message: 'Email is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' }
      } as ApiError;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw {
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/forgot-password`, { email }, {
      cacheKey: 'forgot_password_attempt',
      retry: {
        retries: 2,
        retryDelay: 2000
      }
    });
  }

  // Reset password with validation
  async resetPassword(resetData: PasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    const requiredFields = ['token', 'password', 'password_confirmation'];
    const missingFields = requiredFields.filter(field => !(resetData as any)[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    // Validate password strength
    if (resetData.password.length < 8) {
      throw {
        message: 'Password must be at least 8 characters long',
        code: 'VALIDATION_ERROR',
        details: { field: 'password' }
      } as ApiError;
    }

    // Validate password confirmation
    if (resetData.password !== resetData.password_confirmation) {
      throw {
        message: 'Password confirmation does not match',
        code: 'VALIDATION_ERROR',
        details: { field: 'password_confirmation' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/reset-password`, resetData, {
      cacheKey: 'reset_password_attempt',
      retry: {
        retries: 1,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on validation errors or expired tokens
          return ![400, 422].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    if (!token) {
      throw {
        message: 'Verification token is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'token' }
      } as ApiError;
    }

    return enhancedApi.get(`${this.baseUrl}/verify-email/${token}`, {
      cacheKey: `verify_email_${token}`,
      retry: {
        retries: 1,
        retryDelay: 1000,
        retryCondition: (error) => {
          // Don't retry on invalid tokens
          return error.response?.status !== 400;
        }
      }
    });
  }

  // Resend verification email
  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    if (!email) {
      throw {
        message: 'Email is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/resend-verification`, { email }, {
      cacheKey: 'resend_verification_attempt',
      retry: {
        retries: 1,
        retryDelay: 2000
      }
    });
  }

  // Get current user profile
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return enhancedApi.get('/users/me', {
      cacheKey: 'current_user',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    // Remove read-only fields
    const { id, created_at, updated_at, email_verified_at, last_login_at, ...updateData } = userData;

    return enhancedApi.put('/users/me', updateData, {
      cacheKey: 'update_profile',
      retry: {
        retries: 1,
        retryDelay: 1500
      }
    });
  }

  // Change password
  async changePassword(passwordData: PasswordChangeRequest): Promise<ApiResponse<{ message: string }>> {
    const requiredFields = ['current_password', 'password', 'password_confirmation'];
    const missingFields = requiredFields.filter(field => !(passwordData as any)[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    // Validate new password strength
    if (passwordData.password.length < 8) {
      throw {
        message: 'New password must be at least 8 characters long',
        code: 'VALIDATION_ERROR',
        details: { field: 'password' }
      } as ApiError;
    }

    // Validate password confirmation
    if (passwordData.password !== passwordData.password_confirmation) {
      throw {
        message: 'Password confirmation does not match',
        code: 'VALIDATION_ERROR',
        details: { field: 'password_confirmation' }
      } as ApiError;
    }

    return enhancedApi.put('/users/me/password', passwordData, {
      cacheKey: 'change_password',
      retry: {
        retries: 1,
        retryDelay: 1500,
        retryCondition: (error) => {
          // Don't retry on authentication failures
          return error.response?.status !== 401;
        }
      }
    });
  }

  // Refresh token
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw {
        message: 'No refresh token available',
        code: 'AUTH_ERROR'
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/refresh`, { refresh_token: refreshToken }, {
      cacheKey: 'refresh_token_attempt',
      retry: {
        retries: 1,
        retryDelay: 1000,
        retryCondition: (error) => {
          // Don't retry on invalid refresh tokens
          return error.response?.status !== 401;
        }
      }
    });
  }

  // Two-factor authentication
  async enableTwoFactor(): Promise<ApiResponse<{ qr_code: string; secret: string }>> {
    return enhancedApi.post('/users/me/2fa/enable', {}, {
      cacheKey: 'enable_2fa',
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  async verifyTwoFactor(code: string): Promise<ApiResponse<{ backup_codes: string[] }>> {
    if (!code || code.length !== 6) {
      throw {
        message: 'Valid 6-digit code is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'code' }
      } as ApiError;
    }

    return enhancedApi.post('/users/me/2fa/verify', { code }, {
      cacheKey: 'verify_2fa',
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  async disableTwoFactor(password: string): Promise<ApiResponse<{ message: string }>> {
    if (!password) {
      throw {
        message: 'Password is required to disable 2FA',
        code: 'VALIDATION_ERROR',
        details: { field: 'password' }
      } as ApiError;
    }

    return enhancedApi.post('/users/me/2fa/disable', { password }, {
      cacheKey: 'disable_2fa',
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Session management
  async getSessions(): Promise<ApiResponse<any[]>> {
    return enhancedApi.get('/users/me/sessions', {
      cacheKey: 'user_sessions',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
    if (!sessionId) {
      throw {
        message: 'Session ID is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'sessionId' }
      } as ApiError;
    }

    return enhancedApi.delete(`/users/me/sessions/${sessionId}`, {
      cacheKey: `revoke_session_${sessionId}`,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  async revokeAllSessions(): Promise<ApiResponse<void>> {
    return enhancedApi.delete('/users/me/sessions', {
      cacheKey: 'revoke_all_sessions',
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Account security
  async getSecurityLog(): Promise<ApiResponse<any[]>> {
    return enhancedApi.get('/users/me/security-log', {
      cacheKey: 'security_log',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  async updateSecuritySettings(settings: {
    login_notifications?: boolean;
    suspicious_activity_alerts?: boolean;
    session_timeout?: number;
  }): Promise<ApiResponse<void>> {
    return enhancedApi.put('/users/me/security-settings', settings, {
      cacheKey: 'update_security_settings',
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Account verification and status
  async checkAccountStatus(): Promise<ApiResponse<{
    status: string;
    email_verified: boolean;
    phone_verified: boolean;
    two_factor_enabled: boolean;
    account_locked: boolean;
    suspension_reason?: string;
  }>> {
    return enhancedApi.get('/users/me/status', {
      cacheKey: 'account_status',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Utility methods
  private clearAuthData(): void {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    
    // Clear user data
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    
    // Clear any cached auth-related data
    const authKeys = ['current_user', 'account_status', 'user_sessions', 'security_log'];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  // Token validation
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    return !!token;
  }

  // Get stored user data
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Store user data
  storeUserData(user: User, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(user));
    storage.setItem('userId', user.id);
  }

  // Store auth tokens
  storeTokens(tokens: { access_token: string; refresh_token: string }, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', tokens.access_token);
    storage.setItem('refresh_token', tokens.refresh_token);
  }
}

// Create and export service instance
const enhancedAuthService = new EnhancedAuthService();
export default enhancedAuthService;

// Export class for testing
export { EnhancedAuthService };
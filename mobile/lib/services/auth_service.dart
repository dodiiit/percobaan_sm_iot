import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:indowater_mobile/services/api_service.dart';
import 'package:indowater_mobile/services/storage_service.dart';
import 'package:indowater_mobile/models/user.dart';

class AuthService {
  final ApiService _apiService;
  final StorageService _storageService;
  
  AuthService(this._apiService, this._storageService);
  
  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        
        // Save token and user data
        await _storageService.setString('token', data['token']);
        await _storageService.setString('refresh_token', data['refresh_token']);
        await _storageService.setString('user', jsonEncode(data['user']));
        
        // Set token in API service
        _apiService.setToken(data['token']);
        
        return {
          'success': true,
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred during login',
      };
    }
  }
  
  // Register
  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final response = await _apiService.post(
        '/auth/register',
        data: userData,
      );
      
      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': 'Registration successful! Please check your email to verify your account.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Registration failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred during registration',
      };
    }
  }
  
  // Logout
  Future<Map<String, dynamic>> logout() async {
    try {
      final response = await _apiService.post('/auth/logout');
      
      // Remove token and user data
      await _storageService.remove('token');
      await _storageService.remove('refresh_token');
      await _storageService.remove('user');
      
      // Remove token from API service
      _apiService.removeToken();
      
      return {
        'success': true,
        'message': 'Logout successful',
      };
    } catch (e) {
      // Remove token and user data even if API call fails
      await _storageService.remove('token');
      await _storageService.remove('refresh_token');
      await _storageService.remove('user');
      
      // Remove token from API service
      _apiService.removeToken();
      
      return {
        'success': true,
        'message': 'Logout successful',
      };
    }
  }
  
  // Forgot Password
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _apiService.post(
        '/auth/forgot-password',
        data: {
          'email': email,
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Password reset link has been sent to your email.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to send reset link',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred while sending reset link',
      };
    }
  }
  
  // Reset Password
  Future<Map<String, dynamic>> resetPassword(String token, String password, String passwordConfirmation) async {
    try {
      final response = await _apiService.post(
        '/auth/reset-password',
        data: {
          'token': token,
          'password': password,
          'password_confirmation': passwordConfirmation,
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Password has been reset successfully.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to reset password',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred while resetting password',
      };
    }
  }
  
  // Verify Email
  Future<Map<String, dynamic>> verifyEmail(String token) async {
    try {
      final response = await _apiService.get('/auth/verify-email/$token');
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Email verified successfully.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to verify email',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred while verifying email',
      };
    }
  }
  
  // Resend Verification Email
  Future<Map<String, dynamic>> resendVerification(String email) async {
    try {
      final response = await _apiService.post(
        '/auth/resend-verification',
        data: {
          'email': email,
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Verification email has been resent.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to resend verification email',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred while resending verification email',
      };
    }
  }
  
  // Get Current User
  Future<User?> getCurrentUser() async {
    final userJson = await _storageService.getString('user');
    
    if (userJson != null) {
      return User.fromJson(jsonDecode(userJson));
    }
    
    return null;
  }
  
  // Check if User is Logged In
  Future<bool> isLoggedIn() async {
    final token = await _storageService.getString('token');
    return token != null;
  }
  
  // Refresh Token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _storageService.getString('refresh_token');
      
      if (refreshToken == null) {
        return false;
      }
      
      final response = await _apiService.post(
        '/auth/refresh',
        data: {
          'refresh_token': refreshToken,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        
        // Save new token
        await _storageService.setString('token', data['token']);
        await _storageService.setString('refresh_token', data['refresh_token']);
        
        // Set new token in API service
        _apiService.setToken(data['token']);
        
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  
  // Update Profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> userData) async {
    try {
      final response = await _apiService.put(
        '/users/me',
        data: userData,
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        
        // Update user data in storage
        await _storageService.setString('user', jsonEncode(data));
        
        return {
          'success': true,
          'data': data,
          'message': 'Profile updated successfully.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to update profile',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred while updating profile',
      };
    }
  }
  
  // Change Password
  Future<Map<String, dynamic>> changePassword(String currentPassword, String newPassword, String newPasswordConfirmation) async {
    try {
      final response = await _apiService.put(
        '/users/me/password',
        data: {
          'current_password': currentPassword,
          'password': newPassword,
          'password_confirmation': newPasswordConfirmation,
        },
      );
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Password changed successfully.',
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Failed to change password',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred while changing password',
      };
    }
  }
}
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;
  
  AuthProvider() {
    _init();
  }
  
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;
  
  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      
      if (isLoggedIn) {
        _user = await _authService.getCurrentUser();
        _isAuthenticated = true;
      } else {
        _user = null;
        _isAuthenticated = false;
      }
    } catch (e) {
      _error = e.toString();
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.login(email, password);
      
      if (result['success']) {
        _user = User.fromJson(result['data']['user']);
        _isAuthenticated = true;
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.register(userData);
      
      if (result['success']) {
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> logout() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final result = await _authService.logout();
      
      _user = null;
      _isAuthenticated = false;
      
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.forgotPassword(email);
      
      if (result['success']) {
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> resetPassword(String token, String password, String passwordConfirmation) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.resetPassword(token, password, passwordConfirmation);
      
      if (result['success']) {
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> verifyEmail(String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.verifyEmail(token);
      
      if (result['success']) {
        // Refresh user data if logged in
        if (_isAuthenticated) {
          _user = await _authService.getCurrentUser();
        }
        
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> resendVerification(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.resendVerification(email);
      
      if (result['success']) {
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> updateProfile(Map<String, dynamic> userData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.updateProfile(userData);
      
      if (result['success']) {
        _user = User.fromJson(result['data']);
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<bool> changePassword(String currentPassword, String newPassword, String newPasswordConfirmation) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _authService.changePassword(currentPassword, newPassword, newPasswordConfirmation);
      
      if (result['success']) {
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
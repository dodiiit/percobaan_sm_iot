import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/payment.dart';

class PaymentProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Payment> _payments = [];
  List<PaymentMethod> _paymentMethods = [];
  Payment? _currentPayment;
  bool _isLoading = false;
  String? _error;
  
  List<Payment> get payments => _payments;
  List<PaymentMethod> get paymentMethods => _paymentMethods;
  Payment? get currentPayment => _currentPayment;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  Future<void> loadPaymentHistory() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _payments = await _apiService.getPaymentHistory();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> loadPaymentMethods() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _paymentMethods = await _apiService.getPaymentMethods();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<Payment?> createPayment(TopUpRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final payment = await _apiService.createPayment(request);
      _currentPayment = payment;
      _payments.insert(0, payment); // Add to the beginning of the list
      return payment;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> checkPaymentStatus(String paymentId) async {
    try {
      final payment = await _apiService.getPaymentStatus(paymentId);
      
      // Update the payment in the list
      final index = _payments.indexWhere((p) => p.id == paymentId);
      if (index != -1) {
        _payments[index] = payment;
      }
      
      // Update current payment if it matches
      if (_currentPayment?.id == paymentId) {
        _currentPayment = payment;
      }
      
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  void clearCurrentPayment() {
    _currentPayment = null;
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  List<Payment> getPendingPayments() {
    return _payments.where((payment) => payment.isPending).toList();
  }
  
  List<Payment> getCompletedPayments() {
    return _payments.where((payment) => payment.isCompleted).toList();
  }
  
  List<Payment> getFailedPayments() {
    return _payments.where((payment) => payment.isFailed).toList();
  }
  
  double getTotalPaymentsThisMonth() {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    
    return _payments
        .where((payment) => 
            payment.isCompleted && 
            payment.createdAt.isAfter(startOfMonth))
        .fold(0.0, (sum, payment) => sum + payment.amount);
  }
  
  PaymentMethod? getPaymentMethodById(String id) {
    try {
      return _paymentMethods.firstWhere((method) => method.id == id);
    } catch (e) {
      return null;
    }
  }
  
  List<PaymentMethod> getEnabledPaymentMethods() {
    return _paymentMethods.where((method) => method.isEnabled).toList();
  }
}
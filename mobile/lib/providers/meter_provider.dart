import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/water_meter.dart';

class MeterProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<WaterMeter> _meters = [];
  List<UsageHistory> _usageHistory = [];
  WaterMeter? _selectedMeter;
  bool _isLoading = false;
  String? _error;
  
  List<WaterMeter> get meters => _meters;
  List<UsageHistory> get usageHistory => _usageHistory;
  WaterMeter? get selectedMeter => _selectedMeter;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  Future<void> loadMeters() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _meters = await _apiService.getWaterMeters();
      if (_meters.isNotEmpty && _selectedMeter == null) {
        _selectedMeter = _meters.first;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> loadMeterDetails(String meterId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final meter = await _apiService.getWaterMeter(meterId);
      _selectedMeter = meter;
      
      // Update the meter in the list
      final index = _meters.indexWhere((m) => m.id == meterId);
      if (index != -1) {
        _meters[index] = meter;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> loadUsageHistory(String meterId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _usageHistory = await _apiService.getUsageHistory(
        meterId,
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  void selectMeter(WaterMeter meter) {
    _selectedMeter = meter;
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  double getTotalBalance() {
    return _meters.fold(0.0, (sum, meter) => sum + meter.balance);
  }
  
  double getTotalDailyUsage() {
    return _meters.fold(0.0, (sum, meter) => sum + meter.dailyUsage);
  }
  
  double getTotalMonthlyUsage() {
    return _meters.fold(0.0, (sum, meter) => sum + meter.monthlyUsage);
  }
  
  List<WaterMeter> getActiveMeters() {
    return _meters.where((meter) => meter.status == 'active').toList();
  }
  
  List<WaterMeter> getOfflineMeters() {
    return _meters.where((meter) => !meter.isOnline).toList();
  }
  
  List<WaterMeter> getLowBalanceMeters({double threshold = 10000}) {
    return _meters.where((meter) => meter.balance < threshold).toList();
  }
}
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';
import '../models/water_meter.dart';
import '../models/payment.dart';
import '../models/notification.dart';
import 'offline_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;
  final OfflineService _offlineService = OfflineService();
  
  void initialize() {
    _dio = Dio(
      BaseOptions(
        baseUrl: Constants.apiUrl,
        connectTimeout: Constants.connectionTimeout,
        receiveTimeout: Constants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    
    // Add interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Log request
          print('REQUEST[${options.method}] => PATH: ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          // Log response
          print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          // Log error
          print('ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}');
          return handler.next(e);
        },
      ),
    );
  }
  
  // Set auth token
  void setToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }
  
  // Remove auth token
  void removeToken() {
    _dio.options.headers.remove('Authorization');
  }
  
  // GET request
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
      );
      return response;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
  
  // POST request
  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return response;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
  
  // PUT request
  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return response;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
  
  // PATCH request
  Future<Response> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return response;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
  
  // DELETE request
  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return response;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
  
  // Upload file
  Future<Response> uploadFile(String path, File file, {String? fileName, Map<String, dynamic>? data}) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName ?? file.path.split('/').last,
        ),
        ...?data,
      });
      
      final response = await _dio.post(
        path,
        data: formData,
      );
      return response;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
  
  // Handle error
  Future<Response> _handleError(DioException e) async {
    if (e.response != null) {
      // Return the error response
      return e.response!;
    } else {
      // Create a custom response for network errors
      return Response(
        requestOptions: e.requestOptions,
        statusCode: e.type == DioExceptionType.connectionTimeout ||
                   e.type == DioExceptionType.receiveTimeout ||
                   e.type == DioExceptionType.sendTimeout
            ? 408 // Request Timeout
            : 503, // Service Unavailable
        data: {
          'status': 'error',
          'message': e.type == DioExceptionType.connectionTimeout ||
                    e.type == DioExceptionType.receiveTimeout ||
                    e.type == DioExceptionType.sendTimeout
              ? 'Request timeout'
              : 'Network error',
        },
      );
    }
  }

  // Authentication methods
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['access_token']);
        await prefs.setString('refresh_token', data['refresh_token']);
        await prefs.setString('user_data', jsonEncode(data['user']));
        setToken(data['access_token']);
        return data;
      }
      throw Exception('Login failed');
    } catch (e) {
      throw Exception('Login error: $e');
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final response = await post('/auth/register', data: userData);
      return response.data;
    } catch (e) {
      throw Exception('Registration error: $e');
    }
  }

  Future<void> logout() async {
    try {
      await post('/auth/logout');
    } catch (e) {
      print('Logout error: $e');
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('refresh_token');
      await prefs.remove('user_data');
      removeToken();
    }
  }

  // Water Meter Operations
  Future<List<WaterMeter>> getWaterMeters() async {
    try {
      final response = await get('/meters');
      final List<dynamic> data = response.data['data'];
      final meters = data.map((json) => WaterMeter.fromJson(json)).toList();
      
      // Cache the data for offline use
      for (final meter in meters) {
        await _offlineService.cacheWaterMeter(meter);
      }
      
      return meters;
    } catch (e) {
      // If offline, return cached data
      if (_offlineService.isOffline) {
        return await _offlineService.getCachedWaterMeters();
      }
      throw Exception('Failed to fetch water meters: $e');
    }
  }

  Future<WaterMeter> getWaterMeter(String meterId) async {
    try {
      final response = await get('/meters/$meterId');
      final meter = WaterMeter.fromJson(response.data['data']);
      await _offlineService.cacheWaterMeter(meter);
      return meter;
    } catch (e) {
      // If offline, return cached data
      if (_offlineService.isOffline) {
        final cachedMeter = await _offlineService.getCachedWaterMeter(meterId);
        if (cachedMeter != null) return cachedMeter;
      }
      throw Exception('Failed to fetch water meter: $e');
    }
  }

  Future<List<UsageHistory>> getUsageHistory(String meterId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['start_date'] = startDate.toIso8601String();
      if (endDate != null) queryParams['end_date'] = endDate.toIso8601String();

      final response = await get('/meters/$meterId/usage', queryParameters: queryParams);
      final List<dynamic> data = response.data['data'];
      final history = data.map((json) => UsageHistory.fromJson(json)).toList();
      
      // Cache the data
      await _offlineService.cacheUsageHistory(history);
      
      return history;
    } catch (e) {
      // If offline, return cached data
      if (_offlineService.isOffline) {
        return await _offlineService.getCachedUsageHistory(meterId);
      }
      throw Exception('Failed to fetch usage history: $e');
    }
  }

  // Payment Operations
  Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await get('/payment-methods');
      final List<dynamic> data = response.data['data'];
      return data.map((json) => PaymentMethod.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch payment methods: $e');
    }
  }

  Future<Payment> createPayment(TopUpRequest request) async {
    try {
      final response = await post('/payments', data: request.toJson());
      final payment = Payment.fromJson(response.data['data']);
      await _offlineService.cachePayment(payment);
      return payment;
    } catch (e) {
      // If offline, save for later sync
      if (_offlineService.isOffline) {
        final prefs = await SharedPreferences.getInstance();
        final userDataString = prefs.getString('user_data');
        final userData = userDataString != null ? jsonDecode(userDataString) : {};
        
        final offlinePayment = Payment(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          userId: userData['id'] ?? '',
          meterId: request.meterId,
          amount: request.amount,
          method: request.paymentMethodId,
          status: 'pending',
          createdAt: DateTime.now(),
        );
        await _offlineService.saveOfflinePayment(offlinePayment);
        return offlinePayment;
      }
      throw Exception('Failed to create payment: $e');
    }
  }

  Future<Payment> getPaymentStatus(String paymentId) async {
    try {
      final response = await get('/payments/$paymentId');
      final payment = Payment.fromJson(response.data['data']);
      await _offlineService.cachePayment(payment);
      return payment;
    } catch (e) {
      throw Exception('Failed to get payment status: $e');
    }
  }

  Future<List<Payment>> getPaymentHistory() async {
    try {
      final response = await get('/payments');
      final List<dynamic> data = response.data['data'];
      final payments = data.map((json) => Payment.fromJson(json)).toList();
      
      // Cache the data
      for (final payment in payments) {
        await _offlineService.cachePayment(payment);
      }
      
      return payments;
    } catch (e) {
      // If offline, return cached data
      if (_offlineService.isOffline) {
        return await _offlineService.getCachedPayments();
      }
      throw Exception('Failed to fetch payment history: $e');
    }
  }

  // Notification Operations
  Future<List<AppNotification>> getNotifications() async {
    try {
      final response = await get('/notifications');
      final List<dynamic> data = response.data['data'];
      final notifications = data.map((json) => AppNotification.fromJson(json)).toList();
      
      // Cache the data
      for (final notification in notifications) {
        await _offlineService.cacheNotification(notification);
      }
      
      return notifications;
    } catch (e) {
      // If offline, return cached data
      if (_offlineService.isOffline) {
        return await _offlineService.getCachedNotifications();
      }
      throw Exception('Failed to fetch notifications: $e');
    }
  }

  Future<void> markNotificationAsRead(String notificationId) async {
    try {
      await patch('/notifications/$notificationId', data: {
        'is_read': true,
      });
    } catch (e) {
      // If offline, add to sync queue
      if (_offlineService.isOffline) {
        await _offlineService.addToSyncQueue(
          tableName: 'notifications',
          recordId: notificationId,
          action: 'UPDATE',
          data: {'is_read': true},
        );
      } else {
        throw Exception('Failed to mark notification as read: $e');
      }
    }
  }

  // Device Operations
  Future<void> updateFCMToken(String token) async {
    try {
      await post('/devices/fcm-token', data: {
        'token': token,
      });
    } catch (e) {
      print('Failed to update FCM token: $e');
    }
  }

  Future<Map<String, dynamic>> getDeviceStatus(String meterId) async {
    try {
      final response = await get('/devices/$meterId/status');
      return response.data['data'];
    } catch (e) {
      throw Exception('Failed to get device status: $e');
    }
  }

  // QR Code Operations
  Future<Map<String, dynamic>> validateQRCode(String qrData) async {
    try {
      final response = await post('/qr/validate', data: {
        'qr_data': qrData,
      });
      return response.data;
    } catch (e) {
      throw Exception('Failed to validate QR code: $e');
    }
  }

  Future<String> generatePaymentQR(String paymentId) async {
    try {
      final response = await post('/qr/payment', data: {
        'payment_id': paymentId,
      });
      return response.data['qr_data'];
    } catch (e) {
      throw Exception('Failed to generate payment QR: $e');
    }
  }
}
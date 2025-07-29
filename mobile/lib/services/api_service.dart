import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:indowater_mobile/utils/constants.dart';

class ApiService {
  late Dio _dio;
  
  ApiService() {
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
}
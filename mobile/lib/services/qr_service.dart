import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter/material.dart';

class QRService {
  static final QRService _instance = QRService._internal();
  factory QRService() => _instance;
  QRService._internal();

  // Generate QR code for payment
  String generatePaymentQR({
    required String paymentId,
    required double amount,
    required String meterId,
    required String userId,
  }) {
    final paymentData = {
      'type': 'payment',
      'payment_id': paymentId,
      'amount': amount,
      'meter_id': meterId,
      'user_id': userId,
      'timestamp': DateTime.now().toIso8601String(),
      'signature': _generateSignature(paymentId, amount.toString(), meterId),
    };

    return jsonEncode(paymentData);
  }

  // Generate QR code for technician access
  String generateTechnicianQR({
    required String technicianId,
    required String meterId,
    required String accessType, // 'maintenance' or 'installation'
    required DateTime validUntil,
  }) {
    final techData = {
      'type': 'technician_access',
      'technician_id': technicianId,
      'meter_id': meterId,
      'access_type': accessType,
      'valid_until': validUntil.toIso8601String(),
      'timestamp': DateTime.now().toIso8601String(),
      'signature': _generateSignature(technicianId, meterId, accessType),
    };

    return jsonEncode(techData);
  }

  // Generate QR code for meter registration
  String generateMeterRegistrationQR({
    required String meterId,
    required String serialNumber,
    required String location,
    required String userId,
  }) {
    final meterData = {
      'type': 'meter_registration',
      'meter_id': meterId,
      'serial_number': serialNumber,
      'location': location,
      'user_id': userId,
      'timestamp': DateTime.now().toIso8601String(),
      'signature': _generateSignature(meterId, serialNumber, userId),
    };

    return jsonEncode(meterData);
  }

  // Parse QR code data
  QRData? parseQRCode(String qrData) {
    try {
      final Map<String, dynamic> data = jsonDecode(qrData);
      final type = data['type'] as String?;

      if (type == null) return null;

      switch (type) {
        case 'payment':
          return PaymentQRData.fromJson(data);
        case 'technician_access':
          return TechnicianQRData.fromJson(data);
        case 'meter_registration':
          return MeterRegistrationQRData.fromJson(data);
        default:
          return null;
      }
    } catch (e) {
      print('Error parsing QR code: $e');
      return null;
    }
  }

  // Validate QR code signature
  bool validateQRSignature(Map<String, dynamic> data) {
    final signature = data['signature'] as String?;
    if (signature == null) return false;

    final type = data['type'] as String;
    String expectedSignature;

    switch (type) {
      case 'payment':
        expectedSignature = _generateSignature(
          data['payment_id'],
          data['amount'].toString(),
          data['meter_id'],
        );
        break;
      case 'technician_access':
        expectedSignature = _generateSignature(
          data['technician_id'],
          data['meter_id'],
          data['access_type'],
        );
        break;
      case 'meter_registration':
        expectedSignature = _generateSignature(
          data['meter_id'],
          data['serial_number'],
          data['user_id'],
        );
        break;
      default:
        return false;
    }

    return signature == expectedSignature;
  }

  // Check if QR code is expired
  bool isQRExpired(Map<String, dynamic> data) {
    final validUntil = data['valid_until'] as String?;
    if (validUntil == null) return false;

    final expiryDate = DateTime.tryParse(validUntil);
    if (expiryDate == null) return false;

    return DateTime.now().isAfter(expiryDate);
  }

  // Generate signature for QR code validation
  String _generateSignature(String data1, String data2, String data3) {
    const secretKey = 'indowater_secret_key_2024'; // In production, use environment variable
    final input = '$data1:$data2:$data3:$secretKey';
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString().substring(0, 16); // Use first 16 characters
  }

  // Create QR code widget
  Widget createQRWidget({
    required String data,
    double size = 200.0,
    Color foregroundColor = Colors.black,
    Color backgroundColor = Colors.white,
  }) {
    return QrImageView(
      data: data,
      version: QrVersions.auto,
      size: size,
      foregroundColor: foregroundColor,
      backgroundColor: backgroundColor,
      errorCorrectionLevel: QrErrorCorrectLevel.M,
    );
  }
}

// Base class for QR data
abstract class QRData {
  final String type;
  final DateTime timestamp;
  final String signature;

  QRData({
    required this.type,
    required this.timestamp,
    required this.signature,
  });
}

// Payment QR data
class PaymentQRData extends QRData {
  final String paymentId;
  final double amount;
  final String meterId;
  final String userId;

  PaymentQRData({
    required this.paymentId,
    required this.amount,
    required this.meterId,
    required this.userId,
    required DateTime timestamp,
    required String signature,
  }) : super(
          type: 'payment',
          timestamp: timestamp,
          signature: signature,
        );

  factory PaymentQRData.fromJson(Map<String, dynamic> json) {
    return PaymentQRData(
      paymentId: json['payment_id'],
      amount: (json['amount'] as num).toDouble(),
      meterId: json['meter_id'],
      userId: json['user_id'],
      timestamp: DateTime.parse(json['timestamp']),
      signature: json['signature'],
    );
  }
}

// Technician access QR data
class TechnicianQRData extends QRData {
  final String technicianId;
  final String meterId;
  final String accessType;
  final DateTime validUntil;

  TechnicianQRData({
    required this.technicianId,
    required this.meterId,
    required this.accessType,
    required this.validUntil,
    required DateTime timestamp,
    required String signature,
  }) : super(
          type: 'technician_access',
          timestamp: timestamp,
          signature: signature,
        );

  factory TechnicianQRData.fromJson(Map<String, dynamic> json) {
    return TechnicianQRData(
      technicianId: json['technician_id'],
      meterId: json['meter_id'],
      accessType: json['access_type'],
      validUntil: DateTime.parse(json['valid_until']),
      timestamp: DateTime.parse(json['timestamp']),
      signature: json['signature'],
    );
  }

  bool get isExpired => DateTime.now().isAfter(validUntil);
  bool get isMaintenanceAccess => accessType == 'maintenance';
  bool get isInstallationAccess => accessType == 'installation';
}

// Meter registration QR data
class MeterRegistrationQRData extends QRData {
  final String meterId;
  final String serialNumber;
  final String location;
  final String userId;

  MeterRegistrationQRData({
    required this.meterId,
    required this.serialNumber,
    required this.location,
    required this.userId,
    required DateTime timestamp,
    required String signature,
  }) : super(
          type: 'meter_registration',
          timestamp: timestamp,
          signature: signature,
        );

  factory MeterRegistrationQRData.fromJson(Map<String, dynamic> json) {
    return MeterRegistrationQRData(
      meterId: json['meter_id'],
      serialNumber: json['serial_number'],
      location: json['location'],
      userId: json['user_id'],
      timestamp: DateTime.parse(json['timestamp']),
      signature: json['signature'],
    );
  }
}
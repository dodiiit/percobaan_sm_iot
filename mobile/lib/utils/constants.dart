import 'package:flutter/material.dart';

class Constants {
  // API Constants
  static const String baseUrl = 'http://localhost:8000';
  static const String apiVersion = 'v1';
  static const String apiUrl = '$baseUrl/api/$apiVersion';
  
  // Shared Preferences Keys
  static const String tokenKey = 'token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user';
  static const String themeKey = 'theme';
  static const String languageKey = 'language';
  static const String onboardingKey = 'onboarding_completed';
  
  // Timeout Durations
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Pagination
  static const int defaultPageSize = 10;
  
  // Animation Durations
  static const Duration shortAnimationDuration = Duration(milliseconds: 200);
  static const Duration mediumAnimationDuration = Duration(milliseconds: 500);
  static const Duration longAnimationDuration = Duration(milliseconds: 800);
  
  // Credit Constants
  static const int minCreditAmount = 10000;
  static const List<int> creditDenominations = [
    10000, 20000, 30000, 50000, 100000, 150000, 200000, 
    250000, 300000, 350000, 400000, 450000, 500000
  ];
  static const int lowBalanceThreshold = 5000;
  
  // Water Theme Colors
  static const Color waterPrimary = Color(0xFF0EA5E9);
  static const Color waterSecondary = Color(0xFF14B8A6);
  static const Color waterAccent = Color(0xFF3B82F6);
  static const Color waterBackground = Color(0xFFF8FAFC);
  static const Color waterSurface = Color(0xFFFFFFFF);
  static const Color waterError = Color(0xFFEF4444);
  static const Color waterSuccess = Color(0xFF22C55E);
  static const Color waterWarning = Color(0xFFF59E0B);
  static const Color waterInfo = Color(0xFF3B82F6);
  
  // Text Styles
  static const TextStyle headingStyle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  );
  
  static const TextStyle subheadingStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
  );
  
  static const TextStyle bodyStyle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.2,
  );
  
  static const TextStyle captionStyle = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    letterSpacing: 0.1,
  );
  
  // Border Radius
  static const double borderRadiusSmall = 4.0;
  static const double borderRadiusMedium = 8.0;
  static const double borderRadiusLarge = 12.0;
  static const double borderRadiusExtraLarge = 16.0;
  
  // Padding
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingExtraLarge = 32.0;
  
  // Margin
  static const double marginSmall = 8.0;
  static const double marginMedium = 16.0;
  static const double marginLarge = 24.0;
  static const double marginExtraLarge = 32.0;
  
  // Icon Sizes
  static const double iconSizeSmall = 16.0;
  static const double iconSizeMedium = 24.0;
  static const double iconSizeLarge = 32.0;
  static const double iconSizeExtraLarge = 48.0;
  
  // Button Heights
  static const double buttonHeightSmall = 36.0;
  static const double buttonHeightMedium = 44.0;
  static const double buttonHeightLarge = 52.0;
  
  // Input Heights
  static const double inputHeightSmall = 40.0;
  static const double inputHeightMedium = 48.0;
  static const double inputHeightLarge = 56.0;
  
  // Card Elevation
  static const double cardElevationSmall = 1.0;
  static const double cardElevationMedium = 2.0;
  static const double cardElevationLarge = 4.0;
  
  // Avatar Sizes
  static const double avatarSizeSmall = 32.0;
  static const double avatarSizeMedium = 48.0;
  static const double avatarSizeLarge = 64.0;
  static const double avatarSizeExtraLarge = 96.0;
  
  // Divider Thickness
  static const double dividerThickness = 1.0;
  
  // Shimmer Effect
  static const Color shimmerBaseColor = Color(0xFFE0E0E0);
  static const Color shimmerHighlightColor = Color(0xFFF5F5F5);
  
  // Property Types
  static const List<String> propertyTypes = [
    'residential',
    'commercial',
    'industrial',
    'dormitory',
    'rental',
    'other'
  ];
  
  // Payment Methods
  static const List<String> paymentMethods = [
    'credit_card',
    'bank_transfer',
    'e_wallet',
    'virtual_account',
    'convenience_store',
    'qr_code'
  ];
  
  // Payment Gateways
  static const List<String> paymentGateways = [
    'midtrans',
    'doku'
  ];
  
  // Meter Status
  static const List<String> meterStatus = [
    'active',
    'inactive',
    'maintenance',
    'disconnected'
  ];
  
  // User Status
  static const List<String> userStatus = [
    'active',
    'inactive',
    'pending',
    'suspended'
  ];
  
  // User Roles
  static const List<String> userRoles = [
    'superadmin',
    'client',
    'customer'
  ];
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  
  // Currency
  static const String currencySymbol = 'Rp';
  static const String currencyCode = 'IDR';
  static const String decimalSeparator = ',';
  static const String thousandSeparator = '.';
  static const int decimalPlaces = 2;
  
  // Volume Units
  static const String volumeUnit = 'm³';
  static const String flowRateUnit = 'L/min';
  
  // App Info
  static const String appName = 'IndoWater';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';
  static const String appCopyright = '© 2025 IndoWater. All rights reserved.';
  static const String appWebsite = 'https://indowater.example.com';
  static const String appEmail = 'info@indowater.example.com';
  static const String appPhone = '+6281234567890';
  static const String appAddress = 'Jl. Sudirman No. 123, Jakarta, Indonesia';
}
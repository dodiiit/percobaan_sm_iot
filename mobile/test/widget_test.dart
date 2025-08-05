import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:indowater_mobile/main.dart';
import 'package:indowater_mobile/providers/auth_provider.dart';
import 'package:indowater_mobile/providers/theme_provider.dart';
import 'package:indowater_mobile/providers/language_provider.dart';
import 'package:indowater_mobile/providers/meter_provider.dart';
import 'package:indowater_mobile/providers/payment_provider.dart';
import 'package:indowater_mobile/providers/notification_provider.dart';

void main() {
  group('IndoWater Mobile App Tests', () {
    testWidgets('App should start with splash screen', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => ThemeProvider()),
            ChangeNotifierProvider(create: (_) => LanguageProvider()),
            ChangeNotifierProvider(create: (_) => MeterProvider()),
            ChangeNotifierProvider(create: (_) => PaymentProvider()),
            ChangeNotifierProvider(create: (_) => NotificationProvider()),
          ],
          child: const MyApp(),
        ),
      );

      // Verify that splash screen is shown initially
      expect(find.text('IndoWater'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Login screen should have required fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => ThemeProvider()),
            ChangeNotifierProvider(create: (_) => LanguageProvider()),
            ChangeNotifierProvider(create: (_) => MeterProvider()),
            ChangeNotifierProvider(create: (_) => PaymentProvider()),
            ChangeNotifierProvider(create: (_) => NotificationProvider()),
          ],
          child: MaterialApp(
            home: const LoginScreen(),
          ),
        ),
      );

      // Wait for the widget to settle
      await tester.pumpAndSettle();

      // Verify login form elements
      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Login'), findsAtLeastNWidget(1));
      expect(find.text('Forgot Password?'), findsOneWidget);
    });

    group('Provider Tests', () {
      test('AuthProvider should initialize correctly', () {
        final authProvider = AuthProvider();
        
        expect(authProvider.user, isNull);
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.isLoading, isFalse);
        expect(authProvider.error, isNull);
      });

      test('MeterProvider should initialize correctly', () {
        final meterProvider = MeterProvider();
        
        expect(meterProvider.meters, isEmpty);
        expect(meterProvider.usageHistory, isEmpty);
        expect(meterProvider.selectedMeter, isNull);
        expect(meterProvider.isLoading, isFalse);
        expect(meterProvider.error, isNull);
      });

      test('PaymentProvider should initialize correctly', () {
        final paymentProvider = PaymentProvider();
        
        expect(paymentProvider.payments, isEmpty);
        expect(paymentProvider.paymentMethods, isEmpty);
        expect(paymentProvider.currentPayment, isNull);
        expect(paymentProvider.isLoading, isFalse);
        expect(paymentProvider.error, isNull);
      });

      test('NotificationProvider should initialize correctly', () {
        final notificationProvider = NotificationProvider();
        
        expect(notificationProvider.notifications, isEmpty);
        expect(notificationProvider.unreadCount, equals(0));
        expect(notificationProvider.isLoading, isFalse);
        expect(notificationProvider.error, isNull);
      });

      test('ThemeProvider should initialize with system theme', () {
        final themeProvider = ThemeProvider();
        
        expect(themeProvider.themeMode, equals(ThemeMode.system));
      });

      test('LanguageProvider should initialize with Indonesian locale', () {
        final languageProvider = LanguageProvider();
        
        expect(languageProvider.locale.languageCode, equals('id'));
      });
    });

    group('Model Tests', () {
      test('User model should serialize/deserialize correctly', () {
        final userData = {
          'id': '1',
          'name': 'Test User',
          'email': 'test@example.com',
          'phone': '+6281234567890',
          'role': 'customer',
          'status': 'active',
          'email_verified_at': '2024-01-01T00:00:00Z',
          'last_login_at': '2024-01-01T00:00:00Z',
          'created_at': '2024-01-01T00:00:00Z',
          'updated_at': '2024-01-01T00:00:00Z',
        };

        final user = User.fromJson(userData);
        
        expect(user.id, equals('1'));
        expect(user.name, equals('Test User'));
        expect(user.email, equals('test@example.com'));
        expect(user.phone, equals('+6281234567890'));
        expect(user.role, equals('customer'));
        expect(user.status, equals('active'));
        expect(user.isActive, isTrue);
        expect(user.isCustomer, isTrue);
        expect(user.isVerified, isTrue);

        final json = user.toJson();
        expect(json['id'], equals('1'));
        expect(json['name'], equals('Test User'));
        expect(json['email'], equals('test@example.com'));
      });

      test('WaterMeter model should serialize/deserialize correctly', () {
        final meterData = {
          'id': '1',
          'serial_number': 'WM001',
          'location': 'Kitchen',
          'current_reading': 1500.5,
          'balance': 50000.0,
          'status': 'active',
          'is_online': true,
          'daily_usage': 25.5,
          'monthly_usage': 750.0,
          'average_usage': 25.0,
          'battery_level': 85.0,
          'signal_strength': 'strong',
          'last_reading': '2024-01-01T12:00:00Z',
          'created_at': '2024-01-01T00:00:00Z',
          'updated_at': '2024-01-01T00:00:00Z',
        };

        final meter = WaterMeter.fromJson(meterData);
        
        expect(meter.id, equals('1'));
        expect(meter.serialNumber, equals('WM001'));
        expect(meter.location, equals('Kitchen'));
        expect(meter.currentReading, equals(1500.5));
        expect(meter.balance, equals(50000.0));
        expect(meter.status, equals('active'));
        expect(meter.isOnline, isTrue);
        expect(meter.dailyUsage, equals(25.5));
        expect(meter.monthlyUsage, equals(750.0));

        final json = meter.toJson();
        expect(json['id'], equals('1'));
        expect(json['serial_number'], equals('WM001'));
        expect(json['location'], equals('Kitchen'));
      });

      test('Payment model should serialize/deserialize correctly', () {
        final paymentData = {
          'id': '1',
          'user_id': '1',
          'meter_id': '1',
          'amount': 100000.0,
          'method': 'bank_transfer',
          'status': 'completed',
          'created_at': '2024-01-01T00:00:00Z',
          'completed_at': '2024-01-01T01:00:00Z',
          'transaction_id': 'TXN123456',
          'gateway_response': 'Success',
          'metadata': {'bank': 'BCA'},
        };

        final payment = Payment.fromJson(paymentData);
        
        expect(payment.id, equals('1'));
        expect(payment.userId, equals('1'));
        expect(payment.meterId, equals('1'));
        expect(payment.amount, equals(100000.0));
        expect(payment.method, equals('bank_transfer'));
        expect(payment.status, equals('completed'));
        expect(payment.isCompleted, isTrue);
        expect(payment.isPending, isFalse);
        expect(payment.transactionId, equals('TXN123456'));

        final json = payment.toJson();
        expect(json['id'], equals('1'));
        expect(json['amount'], equals(100000.0));
        expect(json['status'], equals('completed'));
      });
    });

    group('Utility Tests', () {
      test('Constants should have correct values', () {
        expect(Constants.appName, equals('IndoWater'));
        expect(Constants.appVersion, equals('1.0.0'));
        expect(Constants.baseUrl, equals('http://localhost:8000'));
        expect(Constants.currencySymbol, equals('Rp'));
        expect(Constants.volumeUnit, equals('L'));
        expect(Constants.lowBalanceThreshold, equals(10000.0));
      });

      test('Formatters should format correctly', () {
        expect(Formatters.formatCurrency(50000), equals('Rp 50,000'));
        expect(Formatters.formatVolume(25.5), equals('25.5 L'));
        expect(Formatters.formatPercentage(85.5), equals('85.5%'));
        
        final date = DateTime(2024, 1, 1, 12, 30);
        expect(Formatters.formatDate(date), equals('01/01/2024'));
        expect(Formatters.formatDateTime(date), equals('01/01/2024 12:30'));
        expect(Formatters.formatTime(date), equals('12:30'));
      });

      test('Validators should validate correctly', () {
        expect(Validators.isValidEmail('test@example.com'), isTrue);
        expect(Validators.isValidEmail('invalid-email'), isFalse);
        
        expect(Validators.isValidPhone('+6281234567890'), isTrue);
        expect(Validators.isValidPhone('invalid-phone'), isFalse);
        
        expect(Validators.isValidPassword('password123'), isTrue);
        expect(Validators.isValidPassword('123'), isFalse);
        
        expect(Validators.isNotEmpty('test'), isTrue);
        expect(Validators.isNotEmpty(''), isFalse);
        expect(Validators.isNotEmpty(null), isFalse);
      });
    });
  });
}
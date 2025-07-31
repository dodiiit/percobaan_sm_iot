import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:provider/provider.dart';
import 'package:responsive_framework/responsive_framework.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:indowater_mobile/services/api_service.dart';
import 'package:indowater_mobile/services/auth_service.dart';
import 'package:indowater_mobile/services/storage_service.dart';
import 'package:indowater_mobile/services/notification_service.dart';
import 'package:indowater_mobile/services/payment_service.dart';
import 'package:indowater_mobile/services/meter_service.dart';

import 'package:indowater_mobile/utils/app_theme.dart';
import 'package:indowater_mobile/utils/app_routes.dart';
import 'package:indowater_mobile/utils/constants.dart';

import 'package:indowater_mobile/screens/splash_screen.dart';
import 'package:indowater_mobile/screens/onboarding_screen.dart';
import 'package:indowater_mobile/screens/auth/login_screen.dart';
import 'package:indowater_mobile/screens/auth/register_screen.dart';
import 'package:indowater_mobile/screens/auth/forgot_password_screen.dart';
import 'package:indowater_mobile/screens/auth/reset_password_screen.dart';
import 'package:indowater_mobile/screens/auth/verify_email_screen.dart';

import 'package:indowater_mobile/screens/dashboard/dashboard_screen.dart';
import 'package:indowater_mobile/screens/meters/meters_screen.dart';
import 'package:indowater_mobile/screens/consumption/consumption_screen.dart';
import 'package:indowater_mobile/screens/payments/payments_screen.dart';
import 'package:indowater_mobile/screens/topup/topup_screen.dart';
import 'package:indowater_mobile/screens/profile/profile_screen.dart';

import 'package:indowater_mobile/providers/theme_provider.dart';
import 'package:indowater_mobile/providers/language_provider.dart';
import 'package:indowater_mobile/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Easy Localization
  await EasyLocalization.ensureInitialized();
  
  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  
  // Initialize Services
  final storageService = StorageService();
  final apiService = ApiService();
  final authService = AuthService(apiService, storageService);
  final notificationService = NotificationService();
  final paymentService = PaymentService(apiService);
  final meterService = MeterService(apiService);
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Initialize Notification Service
  await notificationService.initialize();
  
  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('id')],
      path: 'assets/translations',
      fallbackLocale: const Locale('id'),
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ThemeProvider(prefs)),
          ChangeNotifierProvider(create: (_) => LanguageProvider(prefs)),
          ChangeNotifierProvider(create: (_) => AuthProvider(authService)),
          Provider.value(value: apiService),
          Provider.value(value: storageService),
          Provider.value(value: notificationService),
          Provider.value(value: paymentService),
          Provider.value(value: meterService),
        ],
        child: const MyApp(),
      ),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    
    return MaterialApp(
      title: 'IndoWater',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeProvider.themeMode,
      locale: context.locale,
      supportedLocales: context.supportedLocales,
      localizationsDelegates: [
        ...context.localizationDelegates,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) {
        return ResponsiveWrapper.builder(
          child,
          maxWidth: 1200,
          minWidth: 320,
          defaultScale: true,
          breakpoints: [
            const ResponsiveBreakpoint.resize(320, name: MOBILE),
            const ResponsiveBreakpoint.resize(480, name: MOBILE),
            const ResponsiveBreakpoint.resize(768, name: TABLET),
            const ResponsiveBreakpoint.resize(1024, name: DESKTOP),
          ],
          background: Container(color: Theme.of(context).colorScheme.background),
        );
      },
      initialRoute: AppRoutes.splash,
      routes: {
        AppRoutes.splash: (context) => const SplashScreen(),
        AppRoutes.onboarding: (context) => const OnboardingScreen(),
        AppRoutes.login: (context) => const LoginScreen(),
        AppRoutes.register: (context) => const RegisterScreen(),
        AppRoutes.forgotPassword: (context) => const ForgotPasswordScreen(),
        AppRoutes.resetPassword: (context) => const ResetPasswordScreen(),
        AppRoutes.verifyEmail: (context) => const VerifyEmailScreen(),
        AppRoutes.dashboard: (context) => const DashboardScreen(),
        AppRoutes.meters: (context) => const MetersScreen(),
        AppRoutes.consumption: (context) => const ConsumptionScreen(),
        AppRoutes.payments: (context) => const PaymentsScreen(),
        AppRoutes.topup: (context) => const TopupScreen(),
        AppRoutes.profile: (context) => const ProfileScreen(),
      },
    );
  }
}
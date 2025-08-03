import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/api_service.dart';
import 'services/notification_service.dart';
import 'services/offline_service.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/language_provider.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize services
  final apiService = ApiService();
  final notificationService = NotificationService();
  final offlineService = OfflineService();
  
  apiService.initialize();
  await notificationService.initialize();
  await offlineService.initialize();
  
  runApp(MyApp(
    apiService: apiService,
    notificationService: notificationService,
    offlineService: offlineService,
  ));
}

class MyApp extends StatelessWidget {
  final ApiService apiService;
  final NotificationService notificationService;
  final OfflineService offlineService;

  const MyApp({
    Key? key,
    required this.apiService,
    required this.notificationService,
    required this.offlineService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        Provider.value(value: apiService),
        Provider.value(value: notificationService),
        Provider.value(value: offlineService),
      ],
      child: Consumer2<ThemeProvider, LanguageProvider>(
        builder: (context, themeProvider, languageProvider, child) {
          return MaterialApp(
            title: 'IndoWater Mobile',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              primarySwatch: Colors.blue,
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
                brightness: themeProvider.isDarkMode ? Brightness.dark : Brightness.light,
              ),
              fontFamily: 'Roboto',
            ),
            darkTheme: ThemeData(
              primarySwatch: Colors.blue,
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
                brightness: Brightness.dark,
              ),
              fontFamily: 'Roboto',
            ),
            themeMode: themeProvider.themeMode,
            locale: languageProvider.locale,
            home: const SplashScreen(),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/dashboard': (context) => const DashboardScreen(),
            },
          );
        },
      ),
    );
  }
}


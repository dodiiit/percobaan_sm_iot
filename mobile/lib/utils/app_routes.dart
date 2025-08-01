class AppRoutes {
  // Auth Routes
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  static const String verifyEmail = '/verify-email';
  
  // Main Routes
  static const String dashboard = '/dashboard';
  static const String meters = '/meters';
  static const String consumption = '/consumption';
  static const String payments = '/payments';
  static const String topup = '/topup';
  static const String profile = '/profile';
  
  // Meter Routes
  static const String meterDetails = '/meters/details';
  static const String addMeter = '/meters/add';
  
  // Consumption Routes
  static const String consumptionDetails = '/consumption/details';
  static const String consumptionHistory = '/consumption/history';
  
  // Payment Routes
  static const String paymentDetails = '/payments/details';
  static const String paymentHistory = '/payments/history';
  
  // Topup Routes
  static const String topupConfirmation = '/topup/confirmation';
  static const String topupSuccess = '/topup/success';
  static const String topupFailed = '/topup/failed';
  
  // Profile Routes
  static const String editProfile = '/profile/edit';
  static const String changePassword = '/profile/change-password';
  static const String notifications = '/profile/notifications';
  static const String settings = '/profile/settings';
  static const String help = '/profile/help';
  static const String about = '/profile/about';
}
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Light Theme Colors
  static const Color _lightPrimaryColor = Color(0xFF0EA5E9);
  static const Color _lightSecondaryColor = Color(0xFF14B8A6);
  static const Color _lightAccentColor = Color(0xFF3B82F6);
  static const Color _lightBackgroundColor = Color(0xFFF8FAFC);
  static const Color _lightSurfaceColor = Color(0xFFFFFFFF);
  static const Color _lightErrorColor = Color(0xFFEF4444);
  static const Color _lightTextColor = Color(0xFF1E293B);
  static const Color _lightDisabledColor = Color(0xFFCBD5E1);
  
  // Dark Theme Colors
  static const Color _darkPrimaryColor = Color(0xFF0EA5E9);
  static const Color _darkSecondaryColor = Color(0xFF14B8A6);
  static const Color _darkAccentColor = Color(0xFF3B82F6);
  static const Color _darkBackgroundColor = Color(0xFF0F172A);
  static const Color _darkSurfaceColor = Color(0xFF1E293B);
  static const Color _darkErrorColor = Color(0xFFEF4444);
  static const Color _darkTextColor = Color(0xFFF8FAFC);
  static const Color _darkDisabledColor = Color(0xFF475569);
  
  // Water Theme Colors
  static const Color waterBlue = Color(0xFF0EA5E9);
  static const Color waterLightBlue = Color(0xFF7DD3FC);
  static const Color waterDarkBlue = Color(0xFF0369A1);
  static const Color waterTeal = Color(0xFF14B8A6);
  static const Color waterLightTeal = Color(0xFF5EEAD4);
  static const Color waterDarkTeal = Color(0xFF0F766E);
  
  // Light Theme
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: _lightPrimaryColor,
    colorScheme: const ColorScheme.light(
      primary: _lightPrimaryColor,
      secondary: _lightSecondaryColor,
      tertiary: _lightAccentColor,
      background: _lightBackgroundColor,
      surface: _lightSurfaceColor,
      error: _lightErrorColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onTertiary: Colors.white,
      onBackground: _lightTextColor,
      onSurface: _lightTextColor,
      onError: Colors.white,
    ),
    scaffoldBackgroundColor: _lightBackgroundColor,
    appBarTheme: const AppBarTheme(
      backgroundColor: _lightSurfaceColor,
      foregroundColor: _lightTextColor,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: _lightTextColor),
    ),
    cardTheme: CardTheme(
      color: _lightSurfaceColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _lightPrimaryColor,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _lightPrimaryColor,
        side: const BorderSide(color: _lightPrimaryColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: _lightPrimaryColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _lightDisabledColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _lightDisabledColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _lightPrimaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _lightErrorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _lightErrorColor, width: 2),
      ),
      labelStyle: const TextStyle(color: _lightTextColor),
      hintStyle: const TextStyle(color: Colors.grey),
      errorStyle: const TextStyle(color: _lightErrorColor),
    ),
    textTheme: GoogleFonts.poppinsTextTheme(
      const TextTheme(
        displayLarge: TextStyle(color: _lightTextColor),
        displayMedium: TextStyle(color: _lightTextColor),
        displaySmall: TextStyle(color: _lightTextColor),
        headlineLarge: TextStyle(color: _lightTextColor),
        headlineMedium: TextStyle(color: _lightTextColor),
        headlineSmall: TextStyle(color: _lightTextColor),
        titleLarge: TextStyle(color: _lightTextColor),
        titleMedium: TextStyle(color: _lightTextColor),
        titleSmall: TextStyle(color: _lightTextColor),
        bodyLarge: TextStyle(color: _lightTextColor),
        bodyMedium: TextStyle(color: _lightTextColor),
        bodySmall: TextStyle(color: _lightTextColor),
        labelLarge: TextStyle(color: _lightTextColor),
        labelMedium: TextStyle(color: _lightTextColor),
        labelSmall: TextStyle(color: _lightTextColor),
      ),
    ),
    iconTheme: const IconThemeData(color: _lightTextColor),
    dividerTheme: const DividerThemeData(
      color: _lightDisabledColor,
      thickness: 1,
      space: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: _lightSurfaceColor,
      disabledColor: _lightDisabledColor,
      selectedColor: _lightPrimaryColor,
      secondarySelectedColor: _lightSecondaryColor,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      labelStyle: const TextStyle(color: _lightTextColor),
      secondaryLabelStyle: const TextStyle(color: Colors.white),
      brightness: Brightness.light,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: _lightDisabledColor),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _lightSurfaceColor,
      selectedItemColor: _lightPrimaryColor,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    tabBarTheme: const TabBarTheme(
      labelColor: _lightPrimaryColor,
      unselectedLabelColor: Colors.grey,
      indicatorColor: _lightPrimaryColor,
    ),
    dialogTheme: DialogTheme(
      backgroundColor: _lightSurfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _lightPrimaryColor,
      foregroundColor: Colors.white,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: _lightSurfaceColor,
      contentTextStyle: const TextStyle(color: _lightTextColor),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _lightPrimaryColor;
        }
        return Colors.grey;
      }),
      trackColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _lightPrimaryColor.withOpacity(0.5);
        }
        return Colors.grey.withOpacity(0.5);
      }),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _lightPrimaryColor;
        }
        return Colors.transparent;
      }),
      checkColor: MaterialStateProperty.all(Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
      ),
      side: const BorderSide(color: Colors.grey),
    ),
    radioTheme: RadioThemeData(
      fillColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _lightPrimaryColor;
        }
        return Colors.grey;
      }),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: _lightPrimaryColor,
      linearTrackColor: _lightDisabledColor,
      circularTrackColor: _lightDisabledColor,
    ),
  );
  
  // Dark Theme
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: _darkPrimaryColor,
    colorScheme: const ColorScheme.dark(
      primary: _darkPrimaryColor,
      secondary: _darkSecondaryColor,
      tertiary: _darkAccentColor,
      background: _darkBackgroundColor,
      surface: _darkSurfaceColor,
      error: _darkErrorColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onTertiary: Colors.white,
      onBackground: _darkTextColor,
      onSurface: _darkTextColor,
      onError: Colors.white,
    ),
    scaffoldBackgroundColor: _darkBackgroundColor,
    appBarTheme: const AppBarTheme(
      backgroundColor: _darkSurfaceColor,
      foregroundColor: _darkTextColor,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: _darkTextColor),
    ),
    cardTheme: CardTheme(
      color: _darkSurfaceColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _darkPrimaryColor,
        foregroundColor: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _darkPrimaryColor,
        side: const BorderSide(color: _darkPrimaryColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: _darkPrimaryColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: _darkSurfaceColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _darkDisabledColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _darkDisabledColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _darkPrimaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _darkErrorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _darkErrorColor, width: 2),
      ),
      labelStyle: const TextStyle(color: _darkTextColor),
      hintStyle: const TextStyle(color: Colors.grey),
      errorStyle: const TextStyle(color: _darkErrorColor),
    ),
    textTheme: GoogleFonts.poppinsTextTheme(
      const TextTheme(
        displayLarge: TextStyle(color: _darkTextColor),
        displayMedium: TextStyle(color: _darkTextColor),
        displaySmall: TextStyle(color: _darkTextColor),
        headlineLarge: TextStyle(color: _darkTextColor),
        headlineMedium: TextStyle(color: _darkTextColor),
        headlineSmall: TextStyle(color: _darkTextColor),
        titleLarge: TextStyle(color: _darkTextColor),
        titleMedium: TextStyle(color: _darkTextColor),
        titleSmall: TextStyle(color: _darkTextColor),
        bodyLarge: TextStyle(color: _darkTextColor),
        bodyMedium: TextStyle(color: _darkTextColor),
        bodySmall: TextStyle(color: _darkTextColor),
        labelLarge: TextStyle(color: _darkTextColor),
        labelMedium: TextStyle(color: _darkTextColor),
        labelSmall: TextStyle(color: _darkTextColor),
      ),
    ),
    iconTheme: const IconThemeData(color: _darkTextColor),
    dividerTheme: const DividerThemeData(
      color: _darkDisabledColor,
      thickness: 1,
      space: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: _darkSurfaceColor,
      disabledColor: _darkDisabledColor,
      selectedColor: _darkPrimaryColor,
      secondarySelectedColor: _darkSecondaryColor,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      labelStyle: const TextStyle(color: _darkTextColor),
      secondaryLabelStyle: const TextStyle(color: Colors.white),
      brightness: Brightness.dark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: _darkDisabledColor),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _darkSurfaceColor,
      selectedItemColor: _darkPrimaryColor,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    tabBarTheme: const TabBarTheme(
      labelColor: _darkPrimaryColor,
      unselectedLabelColor: Colors.grey,
      indicatorColor: _darkPrimaryColor,
    ),
    dialogTheme: DialogTheme(
      backgroundColor: _darkSurfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _darkPrimaryColor,
      foregroundColor: Colors.white,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: _darkSurfaceColor,
      contentTextStyle: const TextStyle(color: _darkTextColor),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _darkPrimaryColor;
        }
        return Colors.grey;
      }),
      trackColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _darkPrimaryColor.withOpacity(0.5);
        }
        return Colors.grey.withOpacity(0.5);
      }),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _darkPrimaryColor;
        }
        return Colors.transparent;
      }),
      checkColor: MaterialStateProperty.all(Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
      ),
      side: const BorderSide(color: Colors.grey),
    ),
    radioTheme: RadioThemeData(
      fillColor: MaterialStateProperty.resolveWith<Color>((states) {
        if (states.contains(MaterialState.selected)) {
          return _darkPrimaryColor;
        }
        return Colors.grey;
      }),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: _darkPrimaryColor,
      linearTrackColor: _darkDisabledColor,
      circularTrackColor: _darkDisabledColor,
    ),
  );
}
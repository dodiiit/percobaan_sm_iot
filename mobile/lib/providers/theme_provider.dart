import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider extends ChangeNotifier {
  SharedPreferences? _prefs;
  ThemeMode _themeMode = ThemeMode.system;
  
  ThemeProvider() {
    _init();
  }
  
  Future<void> _init() async {
    _prefs = await SharedPreferences.getInstance();
    _loadTheme();
  }
  
  ThemeMode get themeMode => _themeMode;
  
  bool get isDarkMode => _themeMode == ThemeMode.dark;
  
  void _loadTheme() {
    if (_prefs == null) return;
    
    final themeString = _prefs!.getString('theme');
    
    if (themeString == 'light') {
      _themeMode = ThemeMode.light;
    } else if (themeString == 'dark') {
      _themeMode = ThemeMode.dark;
    } else {
      _themeMode = ThemeMode.system;
    }
    
    notifyListeners();
  }
  
  void setThemeMode(ThemeMode themeMode) {
    _themeMode = themeMode;
    
    // Save to SharedPreferences
    if (_prefs != null) {
      if (themeMode == ThemeMode.light) {
        _prefs!.setString('theme', 'light');
      } else if (themeMode == ThemeMode.dark) {
        _prefs!.setString('theme', 'dark');
      } else {
        _prefs!.setString('theme', 'system');
      }
    }
    
    notifyListeners();
  }
  
  void toggleTheme() {
    if (_themeMode == ThemeMode.light) {
      setThemeMode(ThemeMode.dark);
    } else {
      setThemeMode(ThemeMode.light);
    }
  }
}
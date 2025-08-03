import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  SharedPreferences? _prefs;
  Locale _locale = const Locale('id');
  
  LanguageProvider() {
    _init();
  }
  
  Future<void> _init() async {
    _prefs = await SharedPreferences.getInstance();
    _loadLanguage();
  }
  
  Locale get locale => _locale;
  
  void _loadLanguage() {
    if (_prefs == null) return;
    
    final languageCode = _prefs!.getString('language');
    
    if (languageCode != null) {
      _locale = Locale(languageCode);
    } else {
      _locale = const Locale('id'); // Default to Indonesian
    }
    
    notifyListeners();
  }
  
  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    
    // Save to SharedPreferences
    if (_prefs != null) {
      await _prefs!.setString('language', locale.languageCode);
    }
    
    notifyListeners();
  }
  
  bool isCurrentLanguage(String languageCode) {
    return _locale.languageCode == languageCode;
  }
}
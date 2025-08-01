import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:easy_localization/easy_localization.dart';

class LanguageProvider extends ChangeNotifier {
  final SharedPreferences _prefs;
  Locale _locale;
  
  LanguageProvider(this._prefs) : _locale = const Locale('id') {
    _loadLanguage();
  }
  
  Locale get locale => _locale;
  
  void _loadLanguage() {
    final languageCode = _prefs.getString('language');
    
    if (languageCode != null) {
      _locale = Locale(languageCode);
    } else {
      _locale = const Locale('id'); // Default to Indonesian
    }
    
    notifyListeners();
  }
  
  Future<void> setLocale(BuildContext context, Locale locale) async {
    _locale = locale;
    
    // Save to SharedPreferences
    await _prefs.setString('language', locale.languageCode);
    
    // Update app locale
    await context.setLocale(locale);
    
    notifyListeners();
  }
  
  bool isCurrentLanguage(String languageCode) {
    return _locale.languageCode == languageCode;
  }
}
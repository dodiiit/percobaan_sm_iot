import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  SharedPreferences? _prefs;
  
  // Initialize SharedPreferences
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // SharedPreferences Methods
  
  // Get String
  Future<String?> getString(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getString(key);
  }
  
  // Set String
  Future<bool> setString(String key, String value) async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.setString(key, value);
  }
  
  // Get Bool
  Future<bool?> getBool(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getBool(key);
  }
  
  // Set Bool
  Future<bool> setBool(String key, bool value) async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.setBool(key, value);
  }
  
  // Get Int
  Future<int?> getInt(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getInt(key);
  }
  
  // Set Int
  Future<bool> setInt(String key, int value) async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.setInt(key, value);
  }
  
  // Get Double
  Future<double?> getDouble(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getDouble(key);
  }
  
  // Set Double
  Future<bool> setDouble(String key, double value) async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.setDouble(key, value);
  }
  
  // Get StringList
  Future<List<String>?> getStringList(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getStringList(key);
  }
  
  // Set StringList
  Future<bool> setStringList(String key, List<String> value) async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.setStringList(key, value);
  }
  
  // Check if key exists
  Future<bool> containsKey(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.containsKey(key);
  }
  
  // Remove key
  Future<bool> remove(String key) async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.remove(key);
  }
  
  // Clear all
  Future<bool> clear() async {
    _prefs ??= await SharedPreferences.getInstance();
    return await _prefs!.clear();
  }
}
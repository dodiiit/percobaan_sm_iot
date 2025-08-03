import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/water_meter.dart';
import '../models/payment.dart';
import '../models/notification.dart';

class OfflineService {
  static final OfflineService _instance = OfflineService._internal();
  factory OfflineService() => _instance;
  OfflineService._internal();

  Database? _database;
  bool _isOnline = true;
  final Connectivity _connectivity = Connectivity();

  bool get isOnline => _isOnline;
  bool get isOffline => !_isOnline;

  Future<void> initialize() async {
    await _initDatabase();
    await _initConnectivity();
    _connectivity.onConnectivityChanged.listen(_onConnectivityChanged);
  }

  Future<void> _initDatabase() async {
    final databasePath = await getDatabasesPath();
    final path = join(databasePath, 'indowater_offline.db');

    _database = await openDatabase(
      path,
      version: 1,
      onCreate: _createTables,
    );
  }

  Future<void> _createTables(Database db, int version) async {
    // Water meters table
    await db.execute('''
      CREATE TABLE water_meters (
        id TEXT PRIMARY KEY,
        serial_number TEXT,
        location TEXT,
        current_reading REAL,
        balance REAL,
        status TEXT,
        last_reading TEXT,
        daily_usage REAL,
        monthly_usage REAL,
        average_usage REAL,
        is_online INTEGER,
        battery_level REAL,
        signal_strength TEXT,
        last_sync TEXT
      )
    ''');

    // Usage history table
    await db.execute('''
      CREATE TABLE usage_history (
        id TEXT PRIMARY KEY,
        meter_id TEXT,
        usage REAL,
        cost REAL,
        timestamp TEXT,
        reading REAL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Payments table
    await db.execute('''
      CREATE TABLE payments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        meter_id TEXT,
        amount REAL,
        method TEXT,
        status TEXT,
        created_at TEXT,
        completed_at TEXT,
        transaction_id TEXT,
        gateway_response TEXT,
        metadata TEXT,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Notifications table
    await db.execute('''
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        type TEXT,
        data TEXT,
        created_at TEXT,
        is_read INTEGER,
        image_url TEXT,
        action_url TEXT,
        priority TEXT,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Sync queue table
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        record_id TEXT,
        action TEXT,
        data TEXT,
        created_at TEXT
      )
    ''');
  }

  Future<void> _initConnectivity() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    _isOnline = connectivityResult != ConnectivityResult.none;
  }

  void _onConnectivityChanged(ConnectivityResult result) {
    final wasOnline = _isOnline;
    _isOnline = result != ConnectivityResult.none;

    if (!wasOnline && _isOnline) {
      // Just came back online, sync data
      _syncPendingData();
    }
  }

  // Water Meter Operations
  Future<void> cacheWaterMeter(WaterMeter meter) async {
    if (_database == null) return;

    await _database!.insert(
      'water_meters',
      {
        ...meter.toJson(),
        'last_sync': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<WaterMeter>> getCachedWaterMeters() async {
    if (_database == null) return [];

    final List<Map<String, dynamic>> maps = await _database!.query('water_meters');
    return maps.map((map) => WaterMeter.fromJson(map)).toList();
  }

  Future<WaterMeter?> getCachedWaterMeter(String meterId) async {
    if (_database == null) return null;

    final List<Map<String, dynamic>> maps = await _database!.query(
      'water_meters',
      where: 'id = ?',
      whereArgs: [meterId],
    );

    if (maps.isEmpty) return null;
    return WaterMeter.fromJson(maps.first);
  }

  // Usage History Operations
  Future<void> cacheUsageHistory(List<UsageHistory> history) async {
    if (_database == null) return;

    final batch = _database!.batch();
    for (final usage in history) {
      batch.insert(
        'usage_history',
        usage.toJson(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit();
  }

  Future<List<UsageHistory>> getCachedUsageHistory(String meterId) async {
    if (_database == null) return [];

    final List<Map<String, dynamic>> maps = await _database!.query(
      'usage_history',
      where: 'meter_id = ?',
      whereArgs: [meterId],
      orderBy: 'timestamp DESC',
    );

    return maps.map((map) => UsageHistory.fromJson(map)).toList();
  }

  // Payment Operations
  Future<void> cachePayment(Payment payment) async {
    if (_database == null) return;

    await _database!.insert(
      'payments',
      {
        ...payment.toJson(),
        'metadata': payment.metadata != null ? jsonEncode(payment.metadata) : null,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Payment>> getCachedPayments() async {
    if (_database == null) return [];

    final List<Map<String, dynamic>> maps = await _database!.query(
      'payments',
      orderBy: 'created_at DESC',
    );

    return maps.map((map) {
      final paymentData = Map<String, dynamic>.from(map);
      if (paymentData['metadata'] != null) {
        paymentData['metadata'] = jsonDecode(paymentData['metadata']);
      }
      return Payment.fromJson(paymentData);
    }).toList();
  }

  // Notification Operations
  Future<void> cacheNotification(AppNotification notification) async {
    if (_database == null) return;

    await _database!.insert(
      'notifications',
      {
        ...notification.toJson(),
        'is_read': notification.isRead ? 1 : 0,
        'data': notification.data != null ? jsonEncode(notification.data) : null,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<AppNotification>> getCachedNotifications() async {
    if (_database == null) return [];

    final List<Map<String, dynamic>> maps = await _database!.query(
      'notifications',
      orderBy: 'created_at DESC',
    );

    return maps.map((map) {
      final notificationData = Map<String, dynamic>.from(map);
      notificationData['is_read'] = notificationData['is_read'] == 1;
      if (notificationData['data'] != null) {
        notificationData['data'] = jsonDecode(notificationData['data']);
      }
      return AppNotification.fromJson(notificationData);
    }).toList();
  }

  // Sync Queue Operations
  Future<void> addToSyncQueue({
    required String tableName,
    required String recordId,
    required String action,
    required Map<String, dynamic> data,
  }) async {
    if (_database == null) return;

    await _database!.insert('sync_queue', {
      'table_name': tableName,
      'record_id': recordId,
      'action': action,
      'data': jsonEncode(data),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getPendingSyncItems() async {
    if (_database == null) return [];

    return await _database!.query(
      'sync_queue',
      orderBy: 'created_at ASC',
    );
  }

  Future<void> removeSyncItem(int syncId) async {
    if (_database == null) return;

    await _database!.delete(
      'sync_queue',
      where: 'id = ?',
      whereArgs: [syncId],
    );
  }

  // Sync Operations
  Future<void> _syncPendingData() async {
    if (!_isOnline) return;

    final pendingItems = await getPendingSyncItems();
    
    for (final item in pendingItems) {
      try {
        await _syncItem(item);
        await removeSyncItem(item['id']);
      } catch (e) {
        print('Failed to sync item ${item['id']}: $e');
        // Keep item in queue for retry
      }
    }
  }

  Future<void> _syncItem(Map<String, dynamic> item) async {
    final tableName = item['table_name'];
    final action = item['action'];
    final data = jsonDecode(item['data']);

    // This would typically make API calls to sync data
    // For now, we'll just simulate the sync
    print('Syncing $action on $tableName: $data');
    
    // In a real implementation, you would:
    // 1. Make API call based on action (CREATE, UPDATE, DELETE)
    // 2. Handle response and update local cache if needed
    // 3. Remove from sync queue on success
  }

  // Offline-specific operations
  Future<void> saveOfflinePayment(Payment payment) async {
    await cachePayment(payment);
    await addToSyncQueue(
      tableName: 'payments',
      recordId: payment.id,
      action: 'CREATE',
      data: payment.toJson(),
    );
  }

  Future<void> saveOfflineUsage(UsageHistory usage) async {
    if (_database == null) return;

    await _database!.insert(
      'usage_history',
      {
        ...usage.toJson(),
        'synced': 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    await addToSyncQueue(
      tableName: 'usage_history',
      recordId: usage.id,
      action: 'CREATE',
      data: usage.toJson(),
    );
  }

  // Cache management
  Future<void> clearCache() async {
    if (_database == null) return;

    await _database!.delete('water_meters');
    await _database!.delete('usage_history');
    await _database!.delete('payments');
    await _database!.delete('notifications');
  }

  Future<void> clearSyncQueue() async {
    if (_database == null) return;

    await _database!.delete('sync_queue');
  }

  // Get cache statistics
  Future<Map<String, int>> getCacheStats() async {
    if (_database == null) return {};

    final stats = <String, int>{};
    
    final meterCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM water_meters'),
    ) ?? 0;
    
    final historyCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM usage_history'),
    ) ?? 0;
    
    final paymentCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM payments'),
    ) ?? 0;
    
    final notificationCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM notifications'),
    ) ?? 0;
    
    final syncQueueCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM sync_queue'),
    ) ?? 0;

    return {
      'meters': meterCount,
      'history': historyCount,
      'payments': paymentCount,
      'notifications': notificationCount,
      'pending_sync': syncQueueCount,
    };
  }

  // Force sync when connection is available
  Future<void> forceSyncWhenOnline() async {
    if (_isOnline) {
      await _syncPendingData();
    }
  }

  Future<void> dispose() async {
    await _database?.close();
  }
}
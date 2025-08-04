import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  List<AppNotification> _notifications = [];
  List<AppNotification> get notifications => _notifications;

  Future<void> initialize() async {
    // Initialize local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Request permissions
    await _requestPermissions();

    // Configure Firebase messaging
    await _configureFirebaseMessaging();

    // Load cached notifications
    await _loadCachedNotifications();
  }

  Future<void> _requestPermissions() async {
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else {
      print('User declined or has not accepted permission');
    }
  }

  Future<void> _configureFirebaseMessaging() async {
    // Get FCM token
    final token = await _firebaseMessaging.getToken();
    print('FCM Token: $token');

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Handle notification tap when app is terminated
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = _createNotificationFromRemoteMessage(message);
    await _addNotification(notification);
    await _showLocalNotification(notification);
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    print('Handling background message: ${message.messageId}');
  }

  Future<void> _handleNotificationTap(RemoteMessage message) async {
    final notification = _createNotificationFromRemoteMessage(message);
    await _addNotification(notification);
    // Handle navigation based on notification data
    _navigateToScreen(notification);
  }

  void _onNotificationTapped(NotificationResponse response) {
    final notificationId = response.id;
    final notification = _notifications.firstWhere(
      (n) => n.id == notificationId.toString(),
      orElse: () => _notifications.first,
    );
    _navigateToScreen(notification);
  }

  void _navigateToScreen(AppNotification notification) {
    // This would typically use a navigation service or callback
    print('Navigate to: ${notification.actionUrl}');
  }

  AppNotification _createNotificationFromRemoteMessage(RemoteMessage message) {
    return AppNotification(
      id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: message.notification?.title ?? 'IndoWater',
      body: message.notification?.body ?? '',
      type: message.data['type'] ?? 'general',
      data: message.data,
      createdAt: DateTime.now(),
      isRead: false,
      imageUrl: message.notification?.android?.imageUrl,
      actionUrl: message.data['action_url'],
      priority: _getPriorityFromString(message.data['priority']),
    );
  }

  NotificationPriority _getPriorityFromString(String? priority) {
    switch (priority?.toLowerCase()) {
      case 'high':
        return NotificationPriority.high;
      case 'urgent':
        return NotificationPriority.urgent;
      case 'low':
        return NotificationPriority.low;
      default:
        return NotificationPriority.normal;
    }
  }

  Future<void> _showLocalNotification(AppNotification notification) async {
    final androidDetails = AndroidNotificationDetails(
      'indowater_channel',
      'IndoWater Notifications',
      channelDescription: 'Notifications for IndoWater app',
      importance: _getAndroidImportance(notification.priority),
      priority: _getAndroidPriority(notification.priority),
      showWhen: true,
      when: notification.createdAt.millisecondsSinceEpoch,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      int.tryParse(notification.id) ?? 0,
      notification.title,
      notification.body,
      details,
      payload: notification.id,
    );
  }

  Importance _getAndroidImportance(NotificationPriority priority) {
    switch (priority) {
      case NotificationPriority.low:
        return Importance.low;
      case NotificationPriority.normal:
        return Importance.defaultImportance;
      case NotificationPriority.high:
        return Importance.high;
      case NotificationPriority.urgent:
        return Importance.max;
    }
  }

  Priority _getAndroidPriority(NotificationPriority priority) {
    switch (priority) {
      case NotificationPriority.low:
        return Priority.low;
      case NotificationPriority.normal:
        return Priority.defaultPriority;
      case NotificationPriority.high:
        return Priority.high;
      case NotificationPriority.urgent:
        return Priority.max;
    }
  }

  Future<void> _addNotification(AppNotification notification) async {
    _notifications.insert(0, notification);
    await _cacheNotifications();
  }

  Future<void> markAsRead(String notificationId) async {
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      await _cacheNotifications();
    }
  }

  Future<void> markAllAsRead() async {
    _notifications = _notifications
        .map((n) => n.copyWith(isRead: true))
        .toList();
    await _cacheNotifications();
  }

  Future<void> deleteNotification(String notificationId) async {
    _notifications.removeWhere((n) => n.id == notificationId);
    await _cacheNotifications();
  }

  Future<void> clearAllNotifications() async {
    _notifications.clear();
    await _cacheNotifications();
  }

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  Future<void> _cacheNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final notificationsJson = _notifications.map((n) => n.toJson()).toList();
    await prefs.setString('cached_notifications', jsonEncode(notificationsJson));
  }

  Future<void> _loadCachedNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedData = prefs.getString('cached_notifications');
    
    if (cachedData != null) {
      final List<dynamic> notificationsJson = jsonDecode(cachedData);
      _notifications = notificationsJson
          .map((json) => AppNotification.fromJson(json))
          .toList();
    }
  }

  Future<String?> getFCMToken() async {
    return await _firebaseMessaging.getToken();
  }

  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
  }

  // Create local notifications for app events
  Future<void> showLowBalanceAlert(double balance, String meterLocation) async {
    final notification = AppNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: 'Low Balance Alert',
      body: 'Your water meter at $meterLocation has low balance: Rp ${balance.toStringAsFixed(0)}',
      type: 'low_balance',
      createdAt: DateTime.now(),
      isRead: false,
      priority: NotificationPriority.high,
    );

    await _addNotification(notification);
    await _showLocalNotification(notification);
  }

  Future<void> showPaymentSuccess(double amount) async {
    final notification = AppNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: 'Payment Successful',
      body: 'Your top-up of Rp ${amount.toStringAsFixed(0)} has been processed successfully',
      type: 'payment_success',
      createdAt: DateTime.now(),
      isRead: false,
      priority: NotificationPriority.normal,
    );

    await _addNotification(notification);
    await _showLocalNotification(notification);
  }

  Future<void> showMeterOfflineAlert(String meterLocation) async {
    final notification = AppNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: 'Meter Offline',
      body: 'Your water meter at $meterLocation is currently offline',
      type: 'meter_offline',
      createdAt: DateTime.now(),
      isRead: false,
      priority: NotificationPriority.high,
    );

    await _addNotification(notification);
    await _showLocalNotification(notification);
  }
}
class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  final bool isRead;
  final String? imageUrl;
  final String? actionUrl;
  final NotificationPriority priority;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.data,
    required this.createdAt,
    required this.isRead,
    this.imageUrl,
    this.actionUrl,
    this.priority = NotificationPriority.normal,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? 'general',
      data: json['data'],
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      isRead: json['is_read'] ?? false,
      imageUrl: json['image_url'],
      actionUrl: json['action_url'],
      priority: NotificationPriority.values.firstWhere(
        (p) => p.name == json['priority'],
        orElse: () => NotificationPriority.normal,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'data': data,
      'created_at': createdAt.toIso8601String(),
      'is_read': isRead,
      'image_url': imageUrl,
      'action_url': actionUrl,
      'priority': priority.name,
    };
  }

  AppNotification copyWith({
    String? id,
    String? title,
    String? body,
    String? type,
    Map<String, dynamic>? data,
    DateTime? createdAt,
    bool? isRead,
    String? imageUrl,
    String? actionUrl,
    NotificationPriority? priority,
  }) {
    return AppNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      type: type ?? this.type,
      data: data ?? this.data,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      imageUrl: imageUrl ?? this.imageUrl,
      actionUrl: actionUrl ?? this.actionUrl,
      priority: priority ?? this.priority,
    );
  }
}

enum NotificationPriority {
  low,
  normal,
  high,
  urgent,
}

enum NotificationType {
  lowBalance,
  paymentSuccess,
  paymentFailed,
  meterOffline,
  maintenanceAlert,
  systemUpdate,
  general,
}

extension NotificationTypeExtension on NotificationType {
  String get displayName {
    switch (this) {
      case NotificationType.lowBalance:
        return 'Low Balance';
      case NotificationType.paymentSuccess:
        return 'Payment Success';
      case NotificationType.paymentFailed:
        return 'Payment Failed';
      case NotificationType.meterOffline:
        return 'Meter Offline';
      case NotificationType.maintenanceAlert:
        return 'Maintenance Alert';
      case NotificationType.systemUpdate:
        return 'System Update';
      case NotificationType.general:
        return 'General';
    }
  }

  String get icon {
    switch (this) {
      case NotificationType.lowBalance:
        return '💰';
      case NotificationType.paymentSuccess:
        return '✅';
      case NotificationType.paymentFailed:
        return '❌';
      case NotificationType.meterOffline:
        return '📡';
      case NotificationType.maintenanceAlert:
        return '🔧';
      case NotificationType.systemUpdate:
        return '🔄';
      case NotificationType.general:
        return '📢';
    }
  }
}
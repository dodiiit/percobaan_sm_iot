class WaterMeter {
  final String id;
  final String serialNumber;
  final String location;
  final double currentReading;
  final double balance;
  final String status;
  final DateTime lastReading;
  final double dailyUsage;
  final double monthlyUsage;
  final double averageUsage;
  final bool isOnline;
  final double batteryLevel;
  final String signalStrength;

  WaterMeter({
    required this.id,
    required this.serialNumber,
    required this.location,
    required this.currentReading,
    required this.balance,
    required this.status,
    required this.lastReading,
    required this.dailyUsage,
    required this.monthlyUsage,
    required this.averageUsage,
    required this.isOnline,
    required this.batteryLevel,
    required this.signalStrength,
  });

  factory WaterMeter.fromJson(Map<String, dynamic> json) {
    return WaterMeter(
      id: json['id'] ?? '',
      serialNumber: json['serial_number'] ?? '',
      location: json['location'] ?? '',
      currentReading: (json['current_reading'] ?? 0).toDouble(),
      balance: (json['balance'] ?? 0).toDouble(),
      status: json['status'] ?? 'inactive',
      lastReading: DateTime.tryParse(json['last_reading'] ?? '') ?? DateTime.now(),
      dailyUsage: (json['daily_usage'] ?? 0).toDouble(),
      monthlyUsage: (json['monthly_usage'] ?? 0).toDouble(),
      averageUsage: (json['average_usage'] ?? 0).toDouble(),
      isOnline: json['is_online'] ?? false,
      batteryLevel: (json['battery_level'] ?? 0).toDouble(),
      signalStrength: json['signal_strength'] ?? 'weak',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serial_number': serialNumber,
      'location': location,
      'current_reading': currentReading,
      'balance': balance,
      'status': status,
      'last_reading': lastReading.toIso8601String(),
      'daily_usage': dailyUsage,
      'monthly_usage': monthlyUsage,
      'average_usage': averageUsage,
      'is_online': isOnline,
      'battery_level': batteryLevel,
      'signal_strength': signalStrength,
    };
  }

  WaterMeter copyWith({
    String? id,
    String? serialNumber,
    String? location,
    double? currentReading,
    double? balance,
    String? status,
    DateTime? lastReading,
    double? dailyUsage,
    double? monthlyUsage,
    double? averageUsage,
    bool? isOnline,
    double? batteryLevel,
    String? signalStrength,
  }) {
    return WaterMeter(
      id: id ?? this.id,
      serialNumber: serialNumber ?? this.serialNumber,
      location: location ?? this.location,
      currentReading: currentReading ?? this.currentReading,
      balance: balance ?? this.balance,
      status: status ?? this.status,
      lastReading: lastReading ?? this.lastReading,
      dailyUsage: dailyUsage ?? this.dailyUsage,
      monthlyUsage: monthlyUsage ?? this.monthlyUsage,
      averageUsage: averageUsage ?? this.averageUsage,
      isOnline: isOnline ?? this.isOnline,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      signalStrength: signalStrength ?? this.signalStrength,
    );
  }
}

class UsageHistory {
  final String id;
  final String meterId;
  final double usage;
  final double cost;
  final DateTime timestamp;
  final double reading;

  UsageHistory({
    required this.id,
    required this.meterId,
    required this.usage,
    required this.cost,
    required this.timestamp,
    required this.reading,
  });

  factory UsageHistory.fromJson(Map<String, dynamic> json) {
    return UsageHistory(
      id: json['id'] ?? '',
      meterId: json['meter_id'] ?? '',
      usage: (json['usage'] ?? 0).toDouble(),
      cost: (json['cost'] ?? 0).toDouble(),
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      reading: (json['reading'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'meter_id': meterId,
      'usage': usage,
      'cost': cost,
      'timestamp': timestamp.toIso8601String(),
      'reading': reading,
    };
  }
}
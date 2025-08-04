class Payment {
  final String id;
  final String userId;
  final String meterId;
  final double amount;
  final String method;
  final String status;
  final DateTime createdAt;
  final DateTime? completedAt;
  final String? transactionId;
  final String? gatewayResponse;
  final Map<String, dynamic>? metadata;

  Payment({
    required this.id,
    required this.userId,
    required this.meterId,
    required this.amount,
    required this.method,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.transactionId,
    this.gatewayResponse,
    this.metadata,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      meterId: json['meter_id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      method: json['method'] ?? '',
      status: json['status'] ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      completedAt: json['completed_at'] != null 
          ? DateTime.tryParse(json['completed_at']) 
          : null,
      transactionId: json['transaction_id'],
      gatewayResponse: json['gateway_response'],
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'meter_id': meterId,
      'amount': amount,
      'method': method,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'transaction_id': transactionId,
      'gateway_response': gatewayResponse,
      'metadata': metadata,
    };
  }

  bool get isPending => status == 'pending';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
  bool get isCancelled => status == 'cancelled';
}

class PaymentMethod {
  final String id;
  final String name;
  final String type;
  final String icon;
  final bool isEnabled;
  final double? minAmount;
  final double? maxAmount;
  final double? fee;
  final String? description;

  PaymentMethod({
    required this.id,
    required this.name,
    required this.type,
    required this.icon,
    required this.isEnabled,
    this.minAmount,
    this.maxAmount,
    this.fee,
    this.description,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    return PaymentMethod(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      icon: json['icon'] ?? '',
      isEnabled: json['is_enabled'] ?? false,
      minAmount: json['min_amount']?.toDouble(),
      maxAmount: json['max_amount']?.toDouble(),
      fee: json['fee']?.toDouble(),
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'icon': icon,
      'is_enabled': isEnabled,
      'min_amount': minAmount,
      'max_amount': maxAmount,
      'fee': fee,
      'description': description,
    };
  }
}

class TopUpRequest {
  final String meterId;
  final double amount;
  final String paymentMethodId;
  final String? notes;

  TopUpRequest({
    required this.meterId,
    required this.amount,
    required this.paymentMethodId,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'meter_id': meterId,
      'amount': amount,
      'payment_method_id': paymentMethodId,
      'notes': notes,
    };
  }
}
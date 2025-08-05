import 'package:flutter/material.dart';
import '../../utils/constants.dart';

class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionText;
  final VoidCallback? onActionPressed;
  final Color? iconColor;
  final double? iconSize;

  const EmptyStateWidget({
    Key? key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionText,
    this.onActionPressed,
    this.iconColor,
    this.iconSize,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: iconSize ?? 80,
              color: iconColor ?? Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: Constants.headingStyle.copyWith(
                color: Colors.grey[700],
                fontSize: 20,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 12),
              Text(
                subtitle!,
                style: Constants.bodyStyle.copyWith(
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionText != null && onActionPressed != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onActionPressed,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Constants.waterPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Constants.borderRadiusMedium),
                  ),
                ),
                child: Text(actionText!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class NoDataWidget extends StatelessWidget {
  final String? message;
  final VoidCallback? onRefresh;

  const NoDataWidget({
    Key? key,
    this.message,
    this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.inbox_outlined,
      title: 'No Data Available',
      subtitle: message ?? 'There is no data to display at the moment.',
      actionText: onRefresh != null ? 'Refresh' : null,
      onActionPressed: onRefresh,
    );
  }
}

class NoMetersWidget extends StatelessWidget {
  final VoidCallback? onAddMeter;

  const NoMetersWidget({
    Key? key,
    this.onAddMeter,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.water_drop_outlined,
      title: 'No Water Meters',
      subtitle: 'You don\'t have any water meters registered yet. Contact your administrator to add meters.',
      actionText: onAddMeter != null ? 'Add Meter' : null,
      onActionPressed: onAddMeter,
      iconColor: Constants.waterPrimary,
    );
  }
}

class NoPaymentsWidget extends StatelessWidget {
  final VoidCallback? onMakePayment;

  const NoPaymentsWidget({
    Key? key,
    this.onMakePayment,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.payment_outlined,
      title: 'No Payment History',
      subtitle: 'You haven\'t made any payments yet. Make your first top-up to get started.',
      actionText: onMakePayment != null ? 'Make Payment' : null,
      onActionPressed: onMakePayment,
      iconColor: Constants.waterSecondary,
    );
  }
}

class NoNotificationsWidget extends StatelessWidget {
  const NoNotificationsWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const EmptyStateWidget(
      icon: Icons.notifications_none_outlined,
      title: 'No Notifications',
      subtitle: 'You\'re all caught up! No new notifications at the moment.',
      iconColor: Constants.waterAccent,
    );
  }
}

class NoUsageHistoryWidget extends StatelessWidget {
  final VoidCallback? onRefresh;

  const NoUsageHistoryWidget({
    Key? key,
    this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.history_outlined,
      title: 'No Usage History',
      subtitle: 'No usage data available for the selected period.',
      actionText: onRefresh != null ? 'Refresh' : null,
      onActionPressed: onRefresh,
      iconColor: Constants.waterPrimary,
    );
  }
}

class OfflineWidget extends StatelessWidget {
  final VoidCallback? onRetry;

  const OfflineWidget({
    Key? key,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.cloud_off_outlined,
      title: 'You\'re Offline',
      subtitle: 'Please check your internet connection and try again.',
      actionText: onRetry != null ? 'Retry' : null,
      onActionPressed: onRetry,
      iconColor: Colors.orange,
    );
  }
}

class ErrorStateWidget extends StatelessWidget {
  final String? message;
  final VoidCallback? onRetry;

  const ErrorStateWidget({
    Key? key,
    this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.error_outline,
      title: 'Something went wrong',
      subtitle: message ?? 'An error occurred while loading data. Please try again.',
      actionText: onRetry != null ? 'Try Again' : null,
      onActionPressed: onRetry,
      iconColor: Constants.waterError,
    );
  }
}

class MaintenanceWidget extends StatelessWidget {
  const MaintenanceWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const EmptyStateWidget(
      icon: Icons.build_outlined,
      title: 'Under Maintenance',
      subtitle: 'We\'re currently performing maintenance. Please check back later.',
      iconColor: Constants.waterWarning,
    );
  }
}

class ComingSoonWidget extends StatelessWidget {
  final String feature;

  const ComingSoonWidget({
    Key? key,
    required this.feature,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.upcoming_outlined,
      title: 'Coming Soon',
      subtitle: '$feature is coming soon. Stay tuned for updates!',
      iconColor: Constants.waterAccent,
    );
  }
}
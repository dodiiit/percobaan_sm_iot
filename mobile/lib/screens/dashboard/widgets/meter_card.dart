import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../models/water_meter.dart';

class MeterCard extends StatelessWidget {
  final WaterMeter meter;
  final VoidCallback? onTap;

  const MeterCard({
    Key? key,
    required this.meter,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.blue[50]!,
                Colors.white,
              ],
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          meter.location,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'SN: ${meter.serialNumber}',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      _buildStatusIndicator(),
                      const SizedBox(height: 4),
                      if (!meter.isOnline)
                        Icon(
                          Icons.cloud_off,
                          color: Colors.red[400],
                          size: 16,
                        ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Balance and Reading
              Row(
                children: [
                  Expanded(
                    child: _buildInfoCard(
                      'Balance',
                      'Rp ${NumberFormat('#,###').format(meter.balance)}',
                      Icons.account_balance_wallet,
                      _getBalanceColor(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildInfoCard(
                      'Current Reading',
                      '${meter.currentReading.toStringAsFixed(1)} L',
                      Icons.water_drop,
                      Colors.blue[600]!,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Usage Information
              Row(
                children: [
                  Expanded(
                    child: _buildInfoCard(
                      'Today',
                      '${meter.dailyUsage.toStringAsFixed(1)} L',
                      Icons.today,
                      Colors.orange[600]!,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildInfoCard(
                      'This Month',
                      '${meter.monthlyUsage.toStringAsFixed(1)} L',
                      Icons.calendar_month,
                      Colors.purple[600]!,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Bottom info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.battery_std,
                        size: 16,
                        color: _getBatteryColor(),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${meter.batteryLevel.toStringAsFixed(0)}%',
                        style: TextStyle(
                          color: _getBatteryColor(),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(
                        _getSignalIcon(),
                        size: 16,
                        color: _getSignalColor(),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        meter.signalStrength.toUpperCase(),
                        style: TextStyle(
                          color: _getSignalColor(),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'Updated: ${_formatLastReading()}',
                    style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator() {
    Color statusColor;
    String statusText;
    
    switch (meter.status.toLowerCase()) {
      case 'active':
        statusColor = Colors.green;
        statusText = 'ACTIVE';
        break;
      case 'inactive':
        statusColor = Colors.red;
        statusText = 'INACTIVE';
        break;
      case 'maintenance':
        statusColor = Colors.orange;
        statusText = 'MAINTENANCE';
        break;
      default:
        statusColor = Colors.grey;
        statusText = 'UNKNOWN';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Text(
        statusText,
        style: TextStyle(
          color: statusColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getBalanceColor() {
    if (meter.balance < 10000) return Colors.red[600]!;
    if (meter.balance < 50000) return Colors.orange[600]!;
    return Colors.green[600]!;
  }

  Color _getBatteryColor() {
    if (meter.batteryLevel < 20) return Colors.red[600]!;
    if (meter.batteryLevel < 50) return Colors.orange[600]!;
    return Colors.green[600]!;
  }

  Color _getSignalColor() {
    switch (meter.signalStrength.toLowerCase()) {
      case 'strong':
        return Colors.green[600]!;
      case 'medium':
        return Colors.orange[600]!;
      case 'weak':
        return Colors.red[600]!;
      default:
        return Colors.grey[600]!;
    }
  }

  IconData _getSignalIcon() {
    switch (meter.signalStrength.toLowerCase()) {
      case 'strong':
        return Icons.signal_cellular_4_bar;
      case 'medium':
        return Icons.network_wifi_3_bar;
      case 'weak':
        return Icons.network_wifi_1_bar;
      default:
        return Icons.signal_cellular_off;
    }
  }

  String _formatLastReading() {
    final now = DateTime.now();
    final difference = now.difference(meter.lastReading);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return DateFormat('dd/MM').format(meter.lastReading);
    }
  }
}
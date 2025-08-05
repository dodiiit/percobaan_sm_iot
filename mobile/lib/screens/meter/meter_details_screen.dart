import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../providers/meter_provider.dart';
import '../../models/water_meter.dart';
import '../../utils/constants.dart';
import '../payment/payment_screen.dart';

class MeterDetailsScreen extends StatefulWidget {
  final WaterMeter meter;

  const MeterDetailsScreen({
    Key? key,
    required this.meter,
  }) : super(key: key);

  @override
  State<MeterDetailsScreen> createState() => _MeterDetailsScreenState();
}

class _MeterDetailsScreenState extends State<MeterDetailsScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late MeterProvider _meterProvider;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _meterProvider = Provider.of<MeterProvider>(context, listen: false);
    _loadMeterData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadMeterData() async {
    await _meterProvider.loadMeterDetails(widget.meter.id);
    await _meterProvider.loadUsageHistory(
      widget.meter.id,
      startDate: DateTime.now().subtract(const Duration(days: 30)),
      endDate: DateTime.now(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Meter ${widget.meter.serialNumber}'),
        backgroundColor: Constants.waterPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMeterData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Usage'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: Consumer<MeterProvider>(
        builder: (context, meterProvider, child) {
          final meter = meterProvider.selectedMeter ?? widget.meter;
          
          if (meterProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(meter),
              _buildUsageTab(meter, meterProvider.usageHistory),
              _buildHistoryTab(meterProvider.usageHistory),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PaymentScreen(selectedMeter: widget.meter),
            ),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Top Up'),
        backgroundColor: Constants.waterPrimary,
      ),
    );
  }

  Widget _buildOverviewTab(WaterMeter meter) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Status Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getStatusColor(meter.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _getStatusIcon(meter.status),
                        color: _getStatusColor(meter.status),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            meter.location,
                            style: Constants.subheadingStyle,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(meter.status),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  meter.status.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                meter.isOnline ? Icons.wifi : Icons.wifi_off,
                                color: meter.isOnline ? Colors.green : Colors.red,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                meter.isOnline ? 'Online' : 'Offline',
                                style: TextStyle(
                                  color: meter.isOnline ? Colors.green : Colors.red,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Balance and Reading Cards
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  title: 'Current Balance',
                  value: NumberFormat.currency(
                    locale: 'id_ID',
                    symbol: Constants.currencySymbol,
                    decimalDigits: 0,
                  ).format(meter.balance),
                  icon: Icons.account_balance_wallet,
                  color: meter.balance < Constants.lowBalanceThreshold
                      ? Constants.waterError
                      : Constants.waterSuccess,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInfoCard(
                  title: 'Current Reading',
                  value: '${meter.currentReading.toStringAsFixed(2)} ${Constants.volumeUnit}',
                  icon: Icons.water_drop,
                  color: Constants.waterPrimary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Usage Cards
          Row(
            children: [
              Expanded(
                child: _buildInfoCard(
                  title: 'Daily Usage',
                  value: '${meter.dailyUsage.toStringAsFixed(2)} ${Constants.volumeUnit}',
                  icon: Icons.today,
                  color: Constants.waterSecondary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInfoCard(
                  title: 'Monthly Usage',
                  value: '${meter.monthlyUsage.toStringAsFixed(2)} ${Constants.volumeUnit}',
                  icon: Icons.calendar_month,
                  color: Constants.waterAccent,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Device Information
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Device Information',
                  style: Constants.subheadingStyle,
                ),
                const SizedBox(height: 16),
                _buildDeviceInfoRow('Serial Number', meter.serialNumber),
                _buildDeviceInfoRow('Location', meter.location),
                _buildDeviceInfoRow(
                  'Last Reading',
                  DateFormat('dd/MM/yyyy HH:mm').format(meter.lastReading),
                ),
                _buildDeviceInfoRow(
                  'Battery Level',
                  '${meter.batteryLevel.toInt()}%',
                ),
                _buildDeviceInfoRow('Signal Strength', meter.signalStrength),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUsageTab(WaterMeter meter, List<UsageHistory> history) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Usage Chart
          Container(
            height: 300,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Usage Trend (Last 7 Days)',
                  style: Constants.subheadingStyle,
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: LineChart(
                    _buildUsageChart(history),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Usage Statistics
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Usage Statistics',
                  style: Constants.subheadingStyle,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        'Average Daily',
                        '${meter.averageUsage.toStringAsFixed(2)} ${Constants.volumeUnit}',
                        Icons.trending_up,
                        Constants.waterPrimary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        'This Month',
                        '${meter.monthlyUsage.toStringAsFixed(2)} ${Constants.volumeUnit}',
                        Icons.calendar_today,
                        Constants.waterSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab(List<UsageHistory> history) {
    return Container(
      color: Colors.grey[50],
      child: history.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No usage history available',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: history.length,
              itemBuilder: (context, index) {
                final usage = history[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(Constants.borderRadiusMedium),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 5,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Constants.waterPrimary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.water_drop,
                        color: Constants.waterPrimary,
                      ),
                    ),
                    title: Text(
                      '${usage.usage.toStringAsFixed(2)} ${Constants.volumeUnit}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      DateFormat('dd/MM/yyyy HH:mm').format(usage.timestamp),
                    ),
                    trailing: Text(
                      NumberFormat.currency(
                        locale: 'id_ID',
                        symbol: Constants.currencySymbol,
                        decimalDigits: 0,
                      ).format(usage.cost),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Constants.waterError,
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(Constants.borderRadiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 5,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: Constants.captionStyle.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Constants.subheadingStyle.copyWith(
              fontSize: 16,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(Constants.borderRadiusMedium),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            title,
            style: Constants.captionStyle.copyWith(
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Constants.bodyStyle.copyWith(
              fontWeight: FontWeight.w600,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Constants.captionStyle.copyWith(
                color: Colors.grey[600],
              ),
            ),
          ),
          const Text(': '),
          Expanded(
            child: Text(
              value,
              style: Constants.bodyStyle.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  LineChartData _buildUsageChart(List<UsageHistory> history) {
    final spots = history
        .take(7)
        .toList()
        .asMap()
        .entries
        .map((entry) => FlSpot(entry.key.toDouble(), entry.value.usage))
        .toList();

    return LineChartData(
      gridData: FlGridData(show: false),
      titlesData: FlTitlesData(
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 40,
            getTitlesWidget: (value, meta) {
              return Text(
                value.toInt().toString(),
                style: const TextStyle(fontSize: 10),
              );
            },
          ),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 30,
            getTitlesWidget: (value, meta) {
              final index = value.toInt();
              if (index >= 0 && index < history.length) {
                return Text(
                  DateFormat('dd/MM').format(history[index].timestamp),
                  style: const TextStyle(fontSize: 10),
                );
              }
              return const Text('');
            },
          ),
        ),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      lineBarsData: [
        LineChartBarData(
          spots: spots,
          isCurved: true,
          color: Constants.waterPrimary,
          barWidth: 3,
          dotData: const FlDotData(show: true),
          belowBarData: BarAreaData(
            show: true,
            color: Constants.waterPrimary.withOpacity(0.1),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Constants.waterSuccess;
      case 'inactive':
        return Constants.waterError;
      case 'maintenance':
        return Constants.waterWarning;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Icons.check_circle;
      case 'inactive':
        return Icons.cancel;
      case 'maintenance':
        return Icons.build;
      default:
        return Icons.help;
    }
  }
}
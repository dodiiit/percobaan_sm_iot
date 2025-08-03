import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../../models/water_meter.dart';

class UsageChart extends StatefulWidget {
  final List<UsageHistory> usageHistory;

  const UsageChart({
    Key? key,
    required this.usageHistory,
  }) : super(key: key);

  @override
  State<UsageChart> createState() => _UsageChartState();
}

class _UsageChartState extends State<UsageChart> {
  String _selectedPeriod = 'Week';
  final List<String> _periods = ['Week', 'Month', '3 Months'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Water Usage',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              DropdownButton<String>(
                value: _selectedPeriod,
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() {
                      _selectedPeriod = newValue;
                    });
                  }
                },
                items: _periods.map<DropdownMenuItem<String>>((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
                underline: Container(),
                icon: const Icon(Icons.keyboard_arrow_down),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: _buildChart(),
          ),
          const SizedBox(height: 16),
          _buildLegend(),
        ],
      ),
    );
  }

  Widget _buildChart() {
    final chartData = _getChartData();
    
    if (chartData.isEmpty) {
      return const Center(
        child: Text(
          'No usage data available',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: _getHorizontalInterval(),
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey[300]!,
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(
          show: true,
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              interval: 1,
              getTitlesWidget: (double value, TitleMeta meta) {
                return _getBottomTitle(value.toInt());
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: _getHorizontalInterval(),
              reservedSize: 42,
              getTitlesWidget: (double value, TitleMeta meta) {
                return Text(
                  '${value.toInt()}L',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(
          show: true,
          border: Border.all(color: Colors.grey[300]!),
        ),
        minX: 0,
        maxX: (chartData.length - 1).toDouble(),
        minY: 0,
        maxY: _getMaxY(),
        lineBarsData: [
          LineChartBarData(
            spots: chartData,
            isCurved: true,
            gradient: LinearGradient(
              colors: [
                Colors.blue[400]!,
                Colors.blue[600]!,
              ],
            ),
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: 4,
                  color: Colors.blue[600]!,
                  strokeWidth: 2,
                  strokeColor: Colors.white,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  Colors.blue[100]!.withOpacity(0.3),
                  Colors.blue[50]!.withOpacity(0.1),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
        lineTouchData: LineTouchData(
          enabled: true,
          touchTooltipData: LineTouchTooltipData(
            tooltipBgColor: Colors.blue[600] ?? Colors.blue,
            tooltipRoundedRadius: 8,
            getTooltipItems: (List<LineBarSpot> touchedBarSpots) {
              return touchedBarSpots.map((barSpot) {
                final flSpot = barSpot;
                return LineTooltipItem(
                  '${flSpot.y.toStringAsFixed(1)} L\n${_getDateForIndex(flSpot.x.toInt())}',
                  const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                );
              }).toList();
            },
          ),
        ),
      ),
    );
  }

  List<FlSpot> _getChartData() {
    final now = DateTime.now();
    final filteredData = <UsageHistory>[];

    // Filter data based on selected period
    switch (_selectedPeriod) {
      case 'Week':
        final weekAgo = now.subtract(const Duration(days: 7));
        filteredData.addAll(
          widget.usageHistory.where((usage) => usage.timestamp.isAfter(weekAgo)),
        );
        break;
      case 'Month':
        final monthAgo = now.subtract(const Duration(days: 30));
        filteredData.addAll(
          widget.usageHistory.where((usage) => usage.timestamp.isAfter(monthAgo)),
        );
        break;
      case '3 Months':
        final threeMonthsAgo = now.subtract(const Duration(days: 90));
        filteredData.addAll(
          widget.usageHistory.where((usage) => usage.timestamp.isAfter(threeMonthsAgo)),
        );
        break;
    }

    // Group data by day and sum usage
    final Map<String, double> dailyUsage = {};
    for (final usage in filteredData) {
      final dateKey = DateFormat('yyyy-MM-dd').format(usage.timestamp);
      dailyUsage[dateKey] = (dailyUsage[dateKey] ?? 0) + usage.usage;
    }

    // Convert to chart data
    final sortedKeys = dailyUsage.keys.toList()..sort();
    final spots = <FlSpot>[];
    
    for (int i = 0; i < sortedKeys.length; i++) {
      final usage = dailyUsage[sortedKeys[i]]!;
      spots.add(FlSpot(i.toDouble(), usage));
    }

    return spots;
  }

  Widget _getBottomTitle(int index) {
    final chartData = _getChartData();
    if (index >= chartData.length) return const Text('');

    final date = _getDateForIndex(index);
    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Text(
        date,
        style: const TextStyle(
          color: Colors.grey,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  String _getDateForIndex(int index) {
    final now = DateTime.now();
    final filteredData = <UsageHistory>[];

    // Filter data based on selected period
    switch (_selectedPeriod) {
      case 'Week':
        final weekAgo = now.subtract(const Duration(days: 7));
        filteredData.addAll(
          widget.usageHistory.where((usage) => usage.timestamp.isAfter(weekAgo)),
        );
        break;
      case 'Month':
        final monthAgo = now.subtract(const Duration(days: 30));
        filteredData.addAll(
          widget.usageHistory.where((usage) => usage.timestamp.isAfter(monthAgo)),
        );
        break;
      case '3 Months':
        final threeMonthsAgo = now.subtract(const Duration(days: 90));
        filteredData.addAll(
          widget.usageHistory.where((usage) => usage.timestamp.isAfter(threeMonthsAgo)),
        );
        break;
    }

    // Group data by day
    final Map<String, double> dailyUsage = {};
    for (final usage in filteredData) {
      final dateKey = DateFormat('yyyy-MM-dd').format(usage.timestamp);
      dailyUsage[dateKey] = (dailyUsage[dateKey] ?? 0) + usage.usage;
    }

    final sortedKeys = dailyUsage.keys.toList()..sort();
    if (index >= sortedKeys.length) return '';

    final date = DateTime.parse(sortedKeys[index]);
    return DateFormat('dd/MM').format(date);
  }

  double _getMaxY() {
    final chartData = _getChartData();
    if (chartData.isEmpty) return 100;
    
    final maxUsage = chartData.map((spot) => spot.y).reduce((a, b) => a > b ? a : b);
    return (maxUsage * 1.2).ceilToDouble();
  }

  double _getHorizontalInterval() {
    final maxY = _getMaxY();
    return (maxY / 5).ceilToDouble();
  }

  Widget _buildLegend() {
    final chartData = _getChartData();
    if (chartData.isEmpty) return const SizedBox.shrink();

    final totalUsage = chartData.fold<double>(0, (sum, spot) => sum + spot.y);
    final averageUsage = totalUsage / chartData.length;
    final maxUsage = chartData.map((spot) => spot.y).reduce((a, b) => a > b ? a : b);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildLegendItem(
          'Total',
          '${totalUsage.toStringAsFixed(1)} L',
          Colors.blue[600]!,
        ),
        _buildLegendItem(
          'Average',
          '${averageUsage.toStringAsFixed(1)} L',
          Colors.green[600]!,
        ),
        _buildLegendItem(
          'Peak',
          '${maxUsage.toStringAsFixed(1)} L',
          Colors.orange[600]!,
        ),
      ],
    );
  }

  Widget _buildLegendItem(String label, String value, Color color) {
    return Column(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
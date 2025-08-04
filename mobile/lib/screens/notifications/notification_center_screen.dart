import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import '../../models/notification.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';

class NotificationCenterScreen extends StatefulWidget {
  const NotificationCenterScreen({Key? key}) : super(key: key);

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen>
    with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final NotificationService _notificationService = NotificationService();
  final RefreshController _refreshController = RefreshController(initialRefresh: false);
  
  List<AppNotification> _notifications = [];
  List<AppNotification> _filteredNotifications = [];
  bool _isLoading = true;
  String? _error;
  String _selectedFilter = 'All';
  bool _showOnlyUnread = false;
  
  final List<String> _filterOptions = ['All', 'Low Balance', 'Payment', 'System', 'Maintenance'];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadNotifications();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _refreshController.dispose();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Load from service first (includes cached data)
      final serviceNotifications = _notificationService.notifications;
      
      // Try to fetch fresh data from API
      try {
        final apiNotifications = await _apiService.getNotifications();
        setState(() {
          _notifications = apiNotifications;
          _isLoading = false;
        });
      } catch (e) {
        // If API fails, use service data
        setState(() {
          _notifications = serviceNotifications;
          _isLoading = false;
        });
      }

      _applyFilters();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    List<AppNotification> filtered = List.from(_notifications);

    // Apply type filter
    if (_selectedFilter != 'All') {
      filtered = filtered.where((notification) {
        switch (_selectedFilter) {
          case 'Low Balance':
            return notification.type == 'low_balance';
          case 'Payment':
            return notification.type.contains('payment');
          case 'System':
            return notification.type == 'system_update' || notification.type == 'general';
          case 'Maintenance':
            return notification.type == 'maintenance_alert' || notification.type == 'meter_offline';
          default:
            return true;
        }
      }).toList();
    }

    // Apply unread filter
    if (_showOnlyUnread) {
      filtered = filtered.where((notification) => !notification.isRead).toList();
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));

    setState(() {
      _filteredNotifications = filtered;
    });
  }

  void _onRefresh() async {
    await _loadNotifications();
    _refreshController.refreshCompleted();
  }

  void _onLoading() async {
    // Load more notifications if needed
    _refreshController.loadComplete();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'mark_all_read':
                  _markAllAsRead();
                  break;
                case 'clear_all':
                  _showClearAllDialog();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'mark_all_read',
                child: Row(
                  children: [
                    Icon(Icons.mark_email_read),
                    SizedBox(width: 8),
                    Text('Mark All as Read'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'clear_all',
                child: Row(
                  children: [
                    Icon(Icons.clear_all),
                    SizedBox(width: 8),
                    Text('Clear All'),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(
              text: 'All (${_notifications.length})',
            ),
            Tab(
              text: 'Unread (${_notifications.where((n) => !n.isRead).length})',
            ),
          ],
          onTap: (index) {
            setState(() {
              _showOnlyUnread = index == 1;
            });
            _applyFilters();
          },
        ),
      ),
      body: Column(
        children: [
          // Filter Section
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Filter by Type',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filterOptions.map((filter) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(filter),
                        selected: _selectedFilter == filter,
                        onSelected: (selected) {
                          setState(() {
                            _selectedFilter = selected ? filter : 'All';
                          });
                          _applyFilters();
                        },
                        selectedColor: Colors.blue[100],
                        checkmarkColor: Colors.blue[700],
                      ),
                    )).toList(),
                  ),
                ),
              ],
            ),
          ),
          
          // Notifications List
          Expanded(
            child: SmartRefresher(
              controller: _refreshController,
              onRefresh: _onRefresh,
              onLoading: _onLoading,
              enablePullDown: true,
              enablePullUp: false,
              header: const WaterDropMaterialHeader(),
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading notifications...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading notifications',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadNotifications,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredNotifications.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredNotifications.length,
      itemBuilder: (context, index) {
        final notification = _filteredNotifications[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: _buildNotificationCard(notification),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    String message;
    IconData icon;
    
    if (_showOnlyUnread) {
      message = 'No unread notifications';
      icon = Icons.mark_email_read;
    } else if (_selectedFilter != 'All') {
      message = 'No $_selectedFilter notifications';
      icon = Icons.filter_list_off;
    } else {
      message = 'No notifications yet';
      icon = Icons.notifications_none;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'You\'ll see notifications here when they arrive',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(AppNotification notification) {
    return Card(
      elevation: notification.isRead ? 1 : 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: notification.isRead ? Colors.transparent : Colors.blue[200]!,
          width: notification.isRead ? 0 : 1,
        ),
      ),
      child: InkWell(
        onTap: () => _onNotificationTap(notification),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: notification.isRead ? Colors.white : Colors.blue[50],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _getNotificationColor(notification.type).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _getNotificationIcon(notification.type),
                      color: _getNotificationColor(notification.type),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                notification.title,
                                style: TextStyle(
                                  fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            if (!notification.isRead)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.blue,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatNotificationTime(notification.createdAt),
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'mark_read':
                          _markAsRead(notification);
                          break;
                        case 'delete':
                          _deleteNotification(notification);
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      if (!notification.isRead)
                        const PopupMenuItem(
                          value: 'mark_read',
                          child: Row(
                            children: [
                              Icon(Icons.mark_email_read, size: 16),
                              SizedBox(width: 8),
                              Text('Mark as Read'),
                            ],
                          ),
                        ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 16),
                            SizedBox(width: 8),
                            Text('Delete'),
                          ],
                        ),
                      ),
                    ],
                    child: Icon(
                      Icons.more_vert,
                      color: Colors.grey[600],
                      size: 16,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Body
              Text(
                notification.body,
                style: TextStyle(
                  color: Colors.grey[800],
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
              
              // Priority indicator
              if (notification.priority == NotificationPriority.high ||
                  notification.priority == NotificationPriority.urgent) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: notification.priority == NotificationPriority.urgent
                        ? Colors.red[100]
                        : Colors.orange[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    notification.priority == NotificationPriority.urgent
                        ? 'URGENT'
                        : 'HIGH PRIORITY',
                    style: TextStyle(
                      color: notification.priority == NotificationPriority.urgent
                          ? Colors.red[700]
                          : Colors.orange[700],
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'low_balance':
        return Colors.red[600]!;
      case 'payment_success':
        return Colors.green[600]!;
      case 'payment_failed':
        return Colors.red[600]!;
      case 'meter_offline':
        return Colors.orange[600]!;
      case 'maintenance_alert':
        return Colors.purple[600]!;
      case 'system_update':
        return Colors.blue[600]!;
      default:
        return Colors.grey[600]!;
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'low_balance':
        return Icons.account_balance_wallet;
      case 'payment_success':
        return Icons.check_circle;
      case 'payment_failed':
        return Icons.error;
      case 'meter_offline':
        return Icons.wifi_off;
      case 'maintenance_alert':
        return Icons.build;
      case 'system_update':
        return Icons.system_update;
      default:
        return Icons.notifications;
    }
  }

  String _formatNotificationTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return DateFormat('dd MMM yyyy').format(dateTime);
    }
  }

  void _onNotificationTap(AppNotification notification) {
    if (!notification.isRead) {
      _markAsRead(notification);
    }

    // Handle navigation based on notification type or action URL
    if (notification.actionUrl != null) {
      // Navigate to specific screen based on action URL
      _handleNotificationAction(notification);
    } else {
      // Show notification details
      _showNotificationDetails(notification);
    }
  }

  void _handleNotificationAction(AppNotification notification) {
    // This would handle navigation based on the notification's action URL
    // For example:
    // - /payment -> Navigate to payment screen
    // - /meter/{id} -> Navigate to meter details
    // - /profile -> Navigate to profile screen
    print('Handle notification action: ${notification.actionUrl}');
  }

  void _showNotificationDetails(AppNotification notification) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: _getNotificationColor(notification.type).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              _getNotificationIcon(notification.type),
                              color: _getNotificationColor(notification.type),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  notification.title,
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  DateFormat('dd MMM yyyy, HH:mm').format(notification.createdAt),
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        notification.body,
                        style: const TextStyle(
                          fontSize: 16,
                          height: 1.5,
                        ),
                      ),
                      if (notification.data != null) ...[
                        const SizedBox(height: 20),
                        Text(
                          'Additional Information',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: Text(
                            notification.data.toString(),
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _markAsRead(AppNotification notification) async {
    try {
      await _notificationService.markAsRead(notification.id);
      await _apiService.markNotificationAsRead(notification.id);
      
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == notification.id);
        if (index != -1) {
          _notifications[index] = notification.copyWith(isRead: true);
        }
      });
      
      _applyFilters();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to mark as read: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _notificationService.markAllAsRead();
      
      setState(() {
        _notifications = _notifications
            .map((n) => n.copyWith(isRead: true))
            .toList();
      });
      
      _applyFilters();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All notifications marked as read'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to mark all as read: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _deleteNotification(AppNotification notification) async {
    try {
      await _notificationService.deleteNotification(notification.id);
      
      setState(() {
        _notifications.removeWhere((n) => n.id == notification.id);
      });
      
      _applyFilters();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Notification deleted'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to delete notification: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showClearAllDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Notifications'),
        content: const Text('Are you sure you want to delete all notifications? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _clearAllNotifications();
            },
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  Future<void> _clearAllNotifications() async {
    try {
      await _notificationService.clearAllNotifications();
      
      setState(() {
        _notifications.clear();
      });
      
      _applyFilters();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('All notifications cleared'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to clear notifications: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
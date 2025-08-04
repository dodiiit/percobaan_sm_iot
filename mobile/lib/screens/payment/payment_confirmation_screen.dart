import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/payment.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../services/qr_service.dart';
import '../qr/qr_generator_screen.dart';

class PaymentConfirmationScreen extends StatefulWidget {
  final Payment payment;

  const PaymentConfirmationScreen({
    Key? key,
    required this.payment,
  }) : super(key: key);

  @override
  State<PaymentConfirmationScreen> createState() => _PaymentConfirmationScreenState();
}

class _PaymentConfirmationScreenState extends State<PaymentConfirmationScreen>
    with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final NotificationService _notificationService = NotificationService();
  final QRService _qrService = QRService();
  
  Payment? _currentPayment;
  bool _isLoading = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _currentPayment = widget.payment;
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeInOut),
      ),
    );
    
    _animationController.forward();
    
    // Start polling for payment status if pending
    if (_currentPayment?.isPending == true) {
      _startPaymentStatusPolling();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _startPaymentStatusPolling() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _currentPayment?.isPending == true) {
        _checkPaymentStatus();
      }
    });
  }

  Future<void> _checkPaymentStatus() async {
    if (_currentPayment == null) return;
    
    try {
      final updatedPayment = await _apiService.getPaymentStatus(_currentPayment!.id);
      
      if (mounted) {
        setState(() {
          _currentPayment = updatedPayment;
        });
        
        if (updatedPayment.isCompleted) {
          _notificationService.showPaymentSuccess(updatedPayment.amount);
        } else if (updatedPayment.isPending) {
          // Continue polling
          _startPaymentStatusPolling();
        }
      }
    } catch (e) {
      print('Error checking payment status: $e');
      // Continue polling on error
      if (mounted && _currentPayment?.isPending == true) {
        _startPaymentStatusPolling();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Payment Confirmation'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Status Icon
            ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: _getStatusColor().withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getStatusIcon(),
                  size: 60,
                  color: _getStatusColor(),
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Status Text
            FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  Text(
                    _getStatusTitle(),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getStatusMessage(),
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 16,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Payment Details Card
            FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                width: double.infinity,
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
                    Text(
                      'Payment Details',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    _buildDetailRow('Payment ID', _currentPayment?.id ?? ''),
                    _buildDetailRow('Amount', 'Rp ${NumberFormat('#,###').format(_currentPayment?.amount ?? 0)}'),
                    _buildDetailRow('Payment Method', _currentPayment?.method ?? ''),
                    _buildDetailRow('Status', _getStatusText()),
                    _buildDetailRow('Created', DateFormat('dd MMM yyyy, HH:mm').format(_currentPayment?.createdAt ?? DateTime.now())),
                    
                    if (_currentPayment?.completedAt != null)
                      _buildDetailRow('Completed', DateFormat('dd MMM yyyy, HH:mm').format(_currentPayment!.completedAt!)),
                    
                    if (_currentPayment?.transactionId != null)
                      _buildDetailRow('Transaction ID', _currentPayment!.transactionId!),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Action Buttons
            FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  // QR Code Button (for pending payments)
                  if (_currentPayment?.isPending == true) ...[
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _showPaymentQR,
                        icon: const Icon(Icons.qr_code),
                        label: const Text('Show Payment QR Code'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue[700],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  
                  // Refresh Status Button (for pending payments)
                  if (_currentPayment?.isPending == true) ...[
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _isLoading ? null : _refreshPaymentStatus,
                        icon: _isLoading 
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.refresh),
                        label: Text(_isLoading ? 'Checking...' : 'Check Payment Status'),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  
                  // Back to Dashboard Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _backToDashboard,
                      icon: const Icon(Icons.home),
                      label: const Text('Back to Dashboard'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green[600],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Make Another Payment Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _makeAnotherPayment,
                      icon: const Icon(Icons.add),
                      label: const Text('Make Another Payment'),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Help Section
            FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue[700]),
                        const SizedBox(width: 8),
                        Text(
                          'Need Help?',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'If you have any issues with your payment, please contact our customer service at support@indowater.com or call +62-21-1234-5678',
                      style: TextStyle(
                        color: Colors.blue[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Text(': '),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    if (_currentPayment == null) return Colors.grey;
    
    if (_currentPayment!.isCompleted) return Colors.green;
    if (_currentPayment!.isFailed) return Colors.red;
    if (_currentPayment!.isCancelled) return Colors.orange;
    return Colors.blue; // pending
  }

  IconData _getStatusIcon() {
    if (_currentPayment == null) return Icons.help_outline;
    
    if (_currentPayment!.isCompleted) return Icons.check_circle;
    if (_currentPayment!.isFailed) return Icons.error;
    if (_currentPayment!.isCancelled) return Icons.cancel;
    return Icons.schedule; // pending
  }

  String _getStatusTitle() {
    if (_currentPayment == null) return 'Unknown Status';
    
    if (_currentPayment!.isCompleted) return 'Payment Successful!';
    if (_currentPayment!.isFailed) return 'Payment Failed';
    if (_currentPayment!.isCancelled) return 'Payment Cancelled';
    return 'Payment Pending';
  }

  String _getStatusMessage() {
    if (_currentPayment == null) return 'Unable to determine payment status';
    
    if (_currentPayment!.isCompleted) {
      return 'Your payment has been processed successfully. Your water meter balance has been updated.';
    }
    if (_currentPayment!.isFailed) {
      return 'Your payment could not be processed. Please try again or contact customer service.';
    }
    if (_currentPayment!.isCancelled) {
      return 'Your payment has been cancelled. No charges have been made.';
    }
    return 'Your payment is being processed. This may take a few minutes.';
  }

  String _getStatusText() {
    if (_currentPayment == null) return 'Unknown';
    return _currentPayment!.status.toUpperCase();
  }

  Future<void> _refreshPaymentStatus() async {
    setState(() {
      _isLoading = true;
    });
    
    await _checkPaymentStatus();
    
    setState(() {
      _isLoading = false;
    });
  }

  void _showPaymentQR() {
    if (_currentPayment == null) return;
    
    // Generate QR code for payment
    final qrData = _qrService.generatePaymentQR(
      paymentId: _currentPayment!.id,
      amount: _currentPayment!.amount,
      meterId: _currentPayment!.meterId,
      userId: _currentPayment!.userId,
    );
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QRGeneratorScreen(
          title: 'Payment QR Code',
          qrData: qrData,
          description: 'Scan this QR code to complete your payment of Rp ${NumberFormat('#,###').format(_currentPayment!.amount)}',
        ),
      ),
    );
  }

  void _backToDashboard() {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void _makeAnotherPayment() {
    Navigator.of(context).pop();
  }
}
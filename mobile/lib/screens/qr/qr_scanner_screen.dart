import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../services/qr_service.dart';
import '../../services/api_service.dart';

class QRScannerScreen extends StatefulWidget {
  final String title;
  final String? description;
  final Function(String)? onScanned;

  const QRScannerScreen({
    Key? key,
    this.title = 'QR Scanner',
    this.description,
    this.onScanned,
  }) : super(key: key);

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with TickerProviderStateMixin {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  final QRService _qrService = QRService();
  final ApiService _apiService = ApiService();
  
  QRViewController? controller;
  bool _isFlashOn = false;
  bool _isProcessing = false;
  String? _lastScannedCode;
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(_animationController);
    _animationController.repeat();
    _requestCameraPermission();
  }

  @override
  void dispose() {
    controller?.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    if (status != PermissionStatus.granted) {
      _showPermissionDialog();
    }
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Camera Permission Required'),
        content: const Text('This app needs camera permission to scan QR codes. Please grant permission in settings.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Settings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off),
            onPressed: _toggleFlash,
          ),
        ],
      ),
      body: Stack(
        children: [
          // QR Scanner View
          QRView(
            key: qrKey,
            onQRViewCreated: _onQRViewCreated,
            overlay: QrScannerOverlayShape(
              borderColor: Colors.blue,
              borderRadius: 10,
              borderLength: 30,
              borderWidth: 10,
              cutOutSize: 250,
            ),
          ),
          
          // Scanning Animation
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return CustomPaint(
                  painter: ScannerLinePainter(_animation.value),
                );
              },
            ),
          ),
          
          // Instructions
          Positioned(
            bottom: 100,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.qr_code_scanner,
                    color: Colors.white,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.description ?? 'Position the QR code within the frame to scan',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (_isProcessing) ...[
                    const SizedBox(height: 16),
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Processing QR code...',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          
          // Manual Input Button
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: ElevatedButton.icon(
              onPressed: _showManualInputDialog,
              icon: const Icon(Icons.keyboard),
              label: const Text('Enter Code Manually'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (!_isProcessing && scanData.code != null && scanData.code != _lastScannedCode) {
        _lastScannedCode = scanData.code;
        _processQRCode(scanData.code!);
      }
    });
  }

  Future<void> _processQRCode(String qrData) async {
    if (_isProcessing) return;
    
    setState(() {
      _isProcessing = true;
    });

    try {
      // Parse QR code
      final parsedData = _qrService.parseQRCode(qrData);
      
      if (parsedData == null) {
        _showErrorDialog('Invalid QR Code', 'The scanned QR code is not valid or not supported.');
        return;
      }

      // Validate with server
      final validationResult = await _apiService.validateQRCode(qrData);
      
      if (validationResult['valid'] == true) {
        // Handle different QR code types
        await _handleQRCodeType(parsedData, qrData);
      } else {
        _showErrorDialog('Invalid QR Code', validationResult['message'] ?? 'QR code validation failed.');
      }
      
    } catch (e) {
      _showErrorDialog('Error', 'Failed to process QR code: $e');
    } finally {
      setState(() {
        _isProcessing = false;
        _lastScannedCode = null;
      });
    }
  }

  Future<void> _handleQRCodeType(QRData qrData, String rawData) async {
    switch (qrData.type) {
      case 'payment':
        final paymentData = qrData as PaymentQRData;
        _showPaymentQRDialog(paymentData);
        break;
        
      case 'technician_access':
        final techData = qrData as TechnicianQRData;
        _showTechnicianAccessDialog(techData);
        break;
        
      case 'meter_registration':
        final meterData = qrData as MeterRegistrationQRData;
        _showMeterRegistrationDialog(meterData);
        break;
        
      default:
        // Call the callback if provided
        if (widget.onScanned != null) {
          widget.onScanned!(rawData);
          Navigator.pop(context, rawData);
        } else {
          _showSuccessDialog('QR Code Scanned', 'QR code processed successfully.');
        }
    }
  }

  void _showPaymentQRDialog(PaymentQRData paymentData) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Payment QR Code'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payment ID: ${paymentData.paymentId}'),
            Text('Amount: Rp ${paymentData.amount.toStringAsFixed(0)}'),
            Text('Meter ID: ${paymentData.meterId}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resumeScanning();
            },
            child: const Text('Continue Scanning'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context, paymentData);
            },
            child: const Text('Process Payment'),
          ),
        ],
      ),
    );
  }

  void _showTechnicianAccessDialog(TechnicianQRData techData) {
    final isExpired = techData.isExpired;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Technician Access',
          style: TextStyle(
            color: isExpired ? Colors.red : Colors.green,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Technician ID: ${techData.technicianId}'),
            Text('Meter ID: ${techData.meterId}'),
            Text('Access Type: ${techData.accessType.toUpperCase()}'),
            Text('Valid Until: ${techData.validUntil}'),
            if (isExpired)
              const Text(
                'This access code has expired!',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resumeScanning();
            },
            child: const Text('Continue Scanning'),
          ),
          if (!isExpired)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context, techData);
              },
              child: const Text('Grant Access'),
            ),
        ],
      ),
    );
  }

  void _showMeterRegistrationDialog(MeterRegistrationQRData meterData) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Meter Registration'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Meter ID: ${meterData.meterId}'),
            Text('Serial Number: ${meterData.serialNumber}'),
            Text('Location: ${meterData.location}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resumeScanning();
            },
            child: const Text('Continue Scanning'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context, meterData);
            },
            child: const Text('Register Meter'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resumeScanning();
            },
            child: const Text('Try Again'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resumeScanning();
            },
            child: const Text('Scan Another'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _showManualInputDialog() {
    final TextEditingController textController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter QR Code'),
        content: TextField(
          controller: textController,
          decoration: const InputDecoration(
            labelText: 'QR Code Data',
            hintText: 'Paste or type QR code content',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              if (textController.text.isNotEmpty) {
                _processQRCode(textController.text);
              }
            },
            child: const Text('Process'),
          ),
        ],
      ),
    );
  }

  void _toggleFlash() async {
    if (controller != null) {
      await controller!.toggleFlash();
      setState(() {
        _isFlashOn = !_isFlashOn;
      });
    }
  }

  void _resumeScanning() {
    controller?.resumeCamera();
  }
}

class ScannerLinePainter extends CustomPainter {
  final double animationValue;

  ScannerLinePainter(this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 2.0;

    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final scanAreaSize = 250.0;
    
    final top = centerY - scanAreaSize / 2;
    final bottom = centerY + scanAreaSize / 2;
    final left = centerX - scanAreaSize / 2;
    final right = centerX + scanAreaSize / 2;
    
    // Calculate line position based on animation
    final lineY = top + (bottom - top) * animationValue;
    
    // Draw scanning line
    canvas.drawLine(
      Offset(left, lineY),
      Offset(right, lineY),
      paint,
    );
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}
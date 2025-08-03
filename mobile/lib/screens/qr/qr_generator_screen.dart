import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
// import 'package:share_plus/share_plus.dart'; // Removed - not in pubspec.yaml
import '../../services/qr_service.dart';

class QRGeneratorScreen extends StatefulWidget {
  final String title;
  final String qrData;
  final String? description;
  final Color? foregroundColor;
  final Color? backgroundColor;

  const QRGeneratorScreen({
    Key? key,
    required this.title,
    required this.qrData,
    this.description,
    this.foregroundColor,
    this.backgroundColor,
  }) : super(key: key);

  @override
  State<QRGeneratorScreen> createState() => _QRGeneratorScreenState();
}

class _QRGeneratorScreenState extends State<QRGeneratorScreen>
    with TickerProviderStateMixin {
  final QRService _qrService = QRService();
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  
  double _qrSize = 250.0;
  Color _foregroundColor = Colors.black;
  Color _backgroundColor = Colors.white;
  bool _showCustomization = false;

  @override
  void initState() {
    super.initState();
    
    _foregroundColor = widget.foregroundColor ?? Colors.black;
    _backgroundColor = widget.backgroundColor ?? Colors.white;
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.elasticOut,
      ),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.3, 1.0, curve: Curves.easeInOut),
      ),
    );
    
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.palette),
            onPressed: () {
              setState(() {
                _showCustomization = !_showCustomization;
              });
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'copy':
                  _copyToClipboard();
                  break;
                case 'share':
                  _shareQRCode();
                  break;
                case 'save':
                  _saveQRCode();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'copy',
                child: Row(
                  children: [
                    Icon(Icons.copy),
                    SizedBox(width: 8),
                    Text('Copy Data'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'share',
                child: Row(
                  children: [
                    Icon(Icons.share),
                    SizedBox(width: 8),
                    Text('Share'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'save',
                child: Row(
                  children: [
                    Icon(Icons.save),
                    SizedBox(width: 8),
                    Text('Save Image'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // QR Code Display
            ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.2),
                      spreadRadius: 2,
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _backgroundColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!),
                      ),
                      child: QrImageView(
                        data: widget.qrData,
                        version: QrVersions.auto,
                        size: _qrSize,
                        foregroundColor: _foregroundColor,
                        backgroundColor: _backgroundColor,
                        errorCorrectionLevel: QrErrorCorrectLevel.M,
                        gapless: false,
                        embeddedImage: null, // Could add logo here
                        embeddedImageStyle: const QrEmbeddedImageStyle(
                          size: Size(40, 40),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      widget.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (widget.description != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        widget.description!,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Customization Panel
            if (_showCustomization)
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
                        'Customize QR Code',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Size Slider
                      Text(
                        'Size: ${_qrSize.toInt()}px',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      Slider(
                        value: _qrSize,
                        min: 150.0,
                        max: 350.0,
                        divisions: 20,
                        onChanged: (value) {
                          setState(() {
                            _qrSize = value;
                          });
                        },
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Color Selection
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Foreground Color',
                                  style: TextStyle(fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 8),
                                _buildColorPicker(
                                  _foregroundColor,
                                  (color) {
                                    setState(() {
                                      _foregroundColor = color;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Background Color',
                                  style: TextStyle(fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 8),
                                _buildColorPicker(
                                  _backgroundColor,
                                  (color) {
                                    setState(() {
                                      _backgroundColor = color;
                                    });
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Reset Button
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _resetCustomization,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Reset to Default'),
                        ),
                      ),
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
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _copyToClipboard,
                      icon: const Icon(Icons.copy),
                      label: const Text('Copy QR Data'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[700],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _shareQRCode,
                          icon: const Icon(Icons.share),
                          label: const Text('Share'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _saveQRCode,
                          icon: const Icon(Icons.save),
                          label: const Text('Save'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // QR Data Preview
            FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.grey[600]),
                        const SizedBox(width: 8),
                        Text(
                          'QR Code Data',
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Text(
                        widget.qrData,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Instructions
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
                        Icon(Icons.lightbulb_outline, color: Colors.blue[700]),
                        const SizedBox(width: 8),
                        Text(
                          'How to Use',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '• Show this QR code to complete your transaction\n'
                      '• Make sure the code is clearly visible and well-lit\n'
                      '• Keep the QR code secure and don\'t share with unauthorized persons\n'
                      '• The QR code may have an expiration time',
                      style: TextStyle(
                        color: Colors.blue[600],
                        fontSize: 14,
                        height: 1.4,
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

  Widget _buildColorPicker(Color currentColor, Function(Color) onColorChanged) {
    final colors = [
      Colors.black,
      Colors.white,
      Colors.blue,
      Colors.red,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.brown,
    ];

    return Wrap(
      spacing: 8,
      children: colors.map((color) {
        final isSelected = currentColor.value == color.value;
        return GestureDetector(
          onTap: () => onColorChanged(color),
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? Colors.blue : Colors.grey[300]!,
                width: isSelected ? 3 : 1,
              ),
            ),
            child: isSelected
                ? Icon(
                    Icons.check,
                    color: color == Colors.white || color == Colors.yellow
                        ? Colors.black
                        : Colors.white,
                    size: 16,
                  )
                : null,
          ),
        );
      }).toList(),
    );
  }

  void _resetCustomization() {
    setState(() {
      _qrSize = 250.0;
      _foregroundColor = widget.foregroundColor ?? Colors.black;
      _backgroundColor = widget.backgroundColor ?? Colors.white;
    });
  }

  void _copyToClipboard() {
    Clipboard.setData(ClipboardData(text: widget.qrData));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR code data copied to clipboard'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _shareQRCode() {
    // Copy QR data to clipboard since share_plus is not available
    Clipboard.setData(ClipboardData(text: widget.qrData));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR data copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _saveQRCode() {
    // This would typically save the QR code as an image
    // For now, we'll show a placeholder message
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR code save functionality would be implemented here'),
        backgroundColor: Colors.blue,
      ),
    );
  }
}
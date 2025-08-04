# IndoWater Valve Control System

## Overview

The IndoWater Valve Control System provides comprehensive remote control functionality for water valves in the IoT-based prepaid water meter system. This system allows automatic and manual control of water valves based on credit levels, emergency situations, and maintenance requirements.

## Features

### Core Functionality
- **Remote Valve Control**: Open, close, partial open, and emergency close commands
- **Automatic Credit-Based Control**: Valves automatically close when credit is low and open when topped up
- **Manual Override**: Temporary manual control for maintenance and emergency situations
- **Real-time Monitoring**: Live status updates and command tracking
- **Command Queue System**: Prioritized command execution with retry mechanisms
- **Alert System**: Comprehensive monitoring and alerting for valve health

### Valve Types Supported
- **Main Valves**: Primary water control valves
- **Secondary Valves**: Backup or zone-specific valves
- **Emergency Valves**: Emergency shutoff valves
- **Bypass Valves**: Maintenance bypass valves

### Command Priorities
- **Emergency**: Immediate execution (emergency close, safety shutoffs)
- **High**: Priority execution (low credit auto-close)
- **Normal**: Standard execution (manual commands)
- **Low**: Background execution (status checks, maintenance)

## Database Schema

### Tables Created
1. **valves**: Main valve information and configuration
2. **valve_commands**: Command queue and execution history
3. **valve_status_history**: Historical valve state changes
4. **valve_alerts**: Alert management and tracking
5. **valve_maintenance**: Maintenance scheduling and records

### Key Relationships
- Valves are linked to meters (1:N relationship)
- Valves are linked to properties for location tracking
- Commands track execution status and responses
- Alerts provide comprehensive monitoring

## API Endpoints

### Valve Management
```
GET    /api/valves                    # List all valves with pagination
GET    /api/valves/overview           # Valve overview with health status
GET    /api/valves/statistics         # System statistics
GET    /api/valves/{id}               # Get specific valve details
POST   /api/valves                    # Create new valve
PUT    /api/valves/{id}               # Update valve information
DELETE /api/valves/{id}               # Delete valve
```

### Valve Control Operations
```
POST   /api/valves/{id}/open          # Open valve
POST   /api/valves/{id}/close         # Close valve
POST   /api/valves/{id}/partial-open  # Partially open valve (with percentage)
POST   /api/valves/{id}/emergency-close # Emergency close valve
POST   /api/valves/{id}/status-check  # Check valve status
```

### Monitoring and History
```
GET    /api/valves/{id}/commands      # Get command history
GET    /api/valves/{id}/history       # Get status change history
GET    /api/valves/{id}/alerts        # Get active alerts
GET    /api/valves/failed-commands    # Get failed commands
```

### Manual Override
```
POST   /api/valves/{id}/enable-override  # Enable manual override
POST   /api/valves/{id}/disable-override # Disable manual override
```

### Alert Management
```
POST   /api/valves/alerts/{alert_id}/acknowledge # Acknowledge alert
POST   /api/valves/alerts/{alert_id}/resolve     # Resolve alert
```

### Bulk Operations
```
POST   /api/valves/bulk-operation     # Perform bulk operations on multiple valves
```

### Device Communication
```
POST   /api/valves/device-response    # Webhook for IoT device responses
```

## Usage Examples

### Opening a Valve
```bash
curl -X POST http://localhost/api/valves/1/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reason": "Manual open for maintenance",
    "priority": "normal"
  }'
```

### Partial Opening
```bash
curl -X POST http://localhost/api/valves/1/partial-open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "percentage": 50,
    "reason": "Reduce flow rate",
    "priority": "normal"
  }'
```

### Emergency Close
```bash
curl -X POST http://localhost/api/valves/1/emergency-close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reason": "Pipe burst detected",
    "priority": "emergency"
  }'
```

### Bulk Operations
```bash
curl -X POST http://localhost/api/valves/bulk-operation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "valve_ids": ["1", "2", "3"],
    "operation": "close",
    "reason": "Scheduled maintenance",
    "priority": "high"
  }'
```

## Frontend Components

### ValveControl Component
Interactive valve control interface with:
- Real-time status display
- Control buttons (Open/Close/Partial/Emergency)
- Device status monitoring (battery, signal, pressure)
- Command history display
- Alert notifications

### ValveDashboard Component
Comprehensive valve management dashboard with:
- System overview and statistics
- Valve list with filtering and search
- Health status monitoring
- Bulk operation controls

## Integration with Payment System

### Midtrans Integration
- **SDK**: `midtrans/midtrans-php` v2.5+
- **Features**: Credit card, bank transfer, e-wallet payments
- **Configuration**: Server key, client key, environment settings
- **Webhook**: Automatic payment status updates

### DOKU Integration
- **SDK**: `doku/doku-php-library` v1.0+
- **Features**: Virtual account payments, bank transfers
- **Configuration**: Private key, public key, client ID
- **Webhook**: Real-time payment notifications

## Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=indowater
DB_USER=username
DB_PASS=password

# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_ENVIRONMENT=sandbox

# DOKU
DOKU_PRIVATE_KEY=your_private_key
DOKU_PUBLIC_KEY=your_public_key
DOKU_CLIENT_ID=your_client_id
DOKU_SECRET_KEY=your_secret_key
DOKU_ENVIRONMENT=sandbox
```

### Valve Configuration
```php
// Valve settings in database
$valveConfig = [
    'auto_close_enabled' => true,        // Auto-close on low credit
    'emergency_close_enabled' => true,   // Allow emergency close
    'low_credit_threshold' => 10.00,     // Credit threshold for auto-close
    'max_pressure' => 10.0,              // Maximum operating pressure
    'command_timeout' => 30,             // Command timeout in seconds
    'max_retries' => 3                   // Maximum command retries
];
```

## Installation and Setup

### 1. Database Migration
```bash
cd api
mysql -u username -p database_name < database/migrations/005_add_valve_control_system.sql
```

### 2. Install Dependencies
```bash
cd api
composer install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Test System
```bash
cd api
php test_valve_system.php
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## IoT Device Integration

### Device Communication Protocol
The system expects IoT devices to communicate via HTTP webhooks:

#### Command Reception (Device → Server)
```json
POST /api/valves/device-response
{
  "command_id": "cmd_123456",
  "valve_id": "VALVE_001",
  "response_data": {
    "status": "success",
    "current_state": "open",
    "battery_level": 85,
    "signal_strength": -65,
    "operating_pressure": 3.2,
    "temperature": 25.5,
    "timestamp": "2024-01-01 12:00:00"
  }
}
```

#### Command Transmission (Server → Device)
Commands are queued in the database and can be retrieved by devices:
```json
GET /api/device/commands/{device_id}
{
  "commands": [
    {
      "command_id": "cmd_123456",
      "command_type": "open",
      "command_value": null,
      "priority": "normal",
      "timeout_seconds": 30,
      "created_at": "2024-01-01 12:00:00"
    }
  ]
}
```

## Security Features

### Authentication
- JWT-based authentication for all API endpoints
- Role-based access control (superadmin, client, customer)
- Command authorization based on user permissions

### Command Validation
- Signature verification for device responses
- Timestamp validation to prevent replay attacks
- Command expiration to prevent stale commands

### Audit Trail
- Complete command history with user tracking
- Status change logging with timestamps
- Alert acknowledgment and resolution tracking

## Monitoring and Alerts

### Health Monitoring
- Battery level monitoring with low battery alerts
- Signal strength monitoring for connectivity issues
- Pressure monitoring for operational safety
- Temperature monitoring for environmental conditions

### Alert Types
- **Low Battery**: Battery level below threshold
- **Communication Lost**: No response from device
- **Pressure High/Low**: Operating pressure outside normal range
- **Temperature High**: Temperature above safe operating range
- **Manual Override**: Manual override mode activated
- **Command Failed**: Command execution failed
- **Maintenance Due**: Scheduled maintenance required

### Real-time Updates
- Server-Sent Events (SSE) for real-time status updates
- WebSocket support for instant command responses
- Polling API for systems that don't support SSE

## Performance Optimization

### Caching Strategy
- Valve status caching with 5-minute TTL
- Command queue caching for faster retrieval
- Statistics caching with 1-hour TTL
- Real-time data caching with 30-second TTL

### Database Optimization
- Indexed queries for fast valve lookups
- Partitioned command history for large datasets
- Optimized joins for complex queries
- Connection pooling for high concurrency

## Testing

### Unit Tests
```bash
cd api
composer test:unit
```

### Integration Tests
```bash
cd api
composer test:integration
```

### System Test
```bash
cd api
php test_valve_system.php
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Troubleshooting

### Common Issues

#### 1. Valve Not Responding
- Check device connectivity and signal strength
- Verify command queue for pending commands
- Check device battery level
- Review error logs for communication issues

#### 2. Commands Failing
- Verify device authentication
- Check command timeout settings
- Review device firmware version
- Validate command parameters

#### 3. Payment Integration Issues
- Verify Midtrans/DOKU credentials
- Check webhook URL configuration
- Review payment gateway logs
- Validate SSL certificates

### Debug Commands
```bash
# Check valve status
curl -X GET http://localhost/api/valves/1

# Check failed commands
curl -X GET http://localhost/api/valves/failed-commands

# Check system statistics
curl -X GET http://localhost/api/valves/statistics

# Check logs
tail -f api/logs/app.log
```

## Deployment

### Production Checklist
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Payment gateway credentials verified
- [ ] Device authentication configured
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery procedures tested
- [ ] Load balancing configured (if needed)
- [ ] Security audit completed

### Scaling Considerations
- Use Redis for caching in production
- Implement message queues for command processing
- Set up database read replicas for reporting
- Use CDN for frontend assets
- Implement horizontal scaling for API servers

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor valve health and battery levels
- Review failed commands and resolve issues
- Update device firmware as needed
- Clean up old command history data
- Review and update alert thresholds

### Monitoring Metrics
- Valve response times
- Command success rates
- Device battery levels
- System uptime
- API response times
- Database performance

## License

This valve control system is part of the IndoWater IoT platform and is proprietary software. All rights reserved.

## Contact

For technical support or questions about the valve control system:
- Email: support@indowater.example.com
- Documentation: https://docs.indowater.example.com
- Issue Tracker: https://github.com/indowater/issues
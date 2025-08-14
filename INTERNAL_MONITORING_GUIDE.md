# 🏠 IndoWater Internal Monitoring System

## 📋 Overview

Sistem monitoring internal IndoWater adalah solusi **self-hosted** yang tidak memerlukan layanan eksternal berbayar. Semua data monitoring disimpan dan diproses di infrastruktur internal Anda sendiri.

## 🎯 Fitur Utama

### ✅ **Yang Sudah Tersedia:**
- ✅ **Error Monitoring** - Tracking dan analisis error secara real-time
- ✅ **Performance Monitoring** - Monitoring response time, memory usage, CPU
- ✅ **Custom Event Logging** - Log custom events dan user actions
- ✅ **System Health Monitoring** - Database, API, dan system health checks
- ✅ **Real-time Dashboard** - Dashboard monitoring real-time dengan WebSocket
- ✅ **Email Alerts** - Notifikasi email untuk critical issues
- ✅ **Log Analysis** - ELK Stack untuk analisis log
- ✅ **Metrics Visualization** - Grafana untuk visualisasi metrics

### 🆕 **Yang Baru Ditambahkan:**
- 🆕 **Database-based Monitoring** - Semua metrics disimpan di database
- 🆕 **Custom Monitoring Dashboard** - Dashboard khusus dengan Node.js
- 🆕 **Internal Event Tracking** - Frontend event tracking tanpa external service
- 🆕 **Automated Health Checks** - Cron jobs untuk monitoring otomatis
- 🆕 **Data Retention Management** - Automatic cleanup old data
- 🆕 **Self-hosted ELK Stack** - Elasticsearch, Logstash, Kibana
- 🆕 **Prometheus + Grafana** - Metrics collection dan visualization

## 🚀 Quick Start

### 1. Setup Monitoring System
```bash
# Jalankan setup script
./setup-monitoring.sh

# Atau manual setup:
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Database Setup
```bash
# Jalankan migration untuk monitoring tables
mysql -u root -p indowater < api/database/migrations/create_monitoring_tables.sql
```

### 3. Access Dashboards
- **Kibana (Log Analysis)**: http://localhost:5601
- **Grafana (Metrics)**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Custom Dashboard**: http://localhost:3002

## 📊 Monitoring Components

### 1. **Frontend Monitoring**
```typescript
// Automatic error monitoring
import internalMonitoring from './services/internalMonitoring';

// Log custom events
internalMonitoring.logCustomEvent('user_login', { userId: 123 });

// Log performance metrics
internalMonitoring.logPerformance({
  name: 'page_load_time',
  value: 1500,
  unit: 'ms'
});

// Monitor API calls
internalMonitoring.monitorApiCall('/api/users', 'GET', startTime, endTime, 200);
```

### 2. **Backend Monitoring**
```php
// Log errors
$monitoring->logError('database_error', 'Connection failed', 'high', [
    'query' => $sql,
    'user_id' => $userId
]);

// Log performance metrics
$monitoring->logPerformanceMetric('api_response_time', 250.5, 'ms', [
    'endpoint' => '/api/users',
    'method' => 'GET'
]);

// Create alerts
$monitoring->createAlert('system_health', 'critical', 'Database Down', 'Cannot connect to database');
```

### 3. **System Health Monitoring**
```bash
# Manual health check
php api/scripts/webhook_monitor.php --check-endpoints

# Automated health checks (cron)
*/5 * * * * /path/to/monitoring/health-check.sh
```

## 📈 Dashboard Features

### 1. **Real-time Monitoring Dashboard**
- System health status
- Error statistics
- Performance metrics
- Active alerts
- Recent logs
- Response time charts
- Error rate charts

### 2. **Kibana Log Analysis**
- Structured log search
- Log aggregation
- Error pattern analysis
- Custom dashboards
- Real-time log streaming

### 3. **Grafana Metrics Visualization**
- Performance metrics
- System resource usage
- API response times
- Error rates
- Custom dashboards

## 🔧 Configuration

### 1. **Monitoring Configuration**
```php
// api/config/settings.php
$settings['monitoring'] = [
    'enabled' => true,
    'alert_email' => 'admin@indowater.com',
    'alert_thresholds' => [
        'error_rate' => 10, // errors per hour
        'response_time' => 5000, // milliseconds
        'memory_usage' => 80, // percentage
    ],
    'retention_days' => 30,
    'sample_rate' => 0.1, // 10% sampling
];
```

### 2. **Frontend Configuration**
```typescript
// Frontend monitoring config
const monitoringConfig = {
  endpoint: '/api/monitoring/events',
  batchSize: 10,
  flushInterval: 30000,
  sampleRate: 0.1
};
```

## 📊 Database Schema

### Monitoring Tables:
- `error_logs` - Error tracking
- `performance_metrics` - Performance data
- `system_health_checks` - Health check results
- `request_logs` - API request logs
- `custom_events` - Custom event tracking
- `monitoring_alerts` - Alert management
- `webhook_monitoring` - Webhook monitoring
- `system_metrics` - System resource metrics

## 🔔 Alert System

### Alert Types:
- **Error Rate Alerts** - High error frequency
- **Performance Alerts** - Slow response times
- **System Health Alerts** - Database/API issues
- **Resource Alerts** - High memory/disk usage

### Alert Channels:
- **Email Notifications** - Critical alerts via email
- **Dashboard Alerts** - Real-time dashboard notifications
- **Log Alerts** - Structured alert logging

## 🧹 Maintenance

### 1. **Data Cleanup**
```bash
# Manual cleanup
./monitoring/cleanup-old-data.sh

# Automated cleanup (cron)
0 2 * * * /path/to/monitoring/cleanup-old-data.sh
```

### 2. **Health Checks**
```bash
# Manual health check
./monitoring/health-check.sh

# Automated health checks (cron)
*/5 * * * * /path/to/monitoring/health-check.sh
```

### 3. **Log Rotation**
```bash
# Log files are automatically rotated
# Old logs (>7 days) are automatically deleted
```

## 📚 API Endpoints

### Monitoring API:
- `GET /api/monitoring/health` - System health status
- `POST /api/monitoring/events` - Log monitoring events
- `GET /api/monitoring/metrics` - Get metrics data
- `GET /api/monitoring/alerts` - Get active alerts
- `GET /api/monitoring/logs/{type}` - Get log data

## 🔒 Security

### Data Privacy:
- ✅ **All data stays internal** - No external services
- ✅ **Configurable sampling** - Control data collection
- ✅ **Data retention policies** - Automatic cleanup
- ✅ **Access control** - Dashboard authentication

## 🎯 Benefits

### ✅ **Cost Effective:**
- No monthly subscription fees
- No external service dependencies
- Self-hosted infrastructure

### ✅ **Data Privacy:**
- Complete data control
- No data sharing with third parties
- Compliance with internal policies

### ✅ **Customizable:**
- Custom dashboards
- Flexible alerting rules
- Tailored to your needs

### ✅ **Scalable:**
- Horizontal scaling support
- Configurable retention policies
- Performance optimized

## 🚨 Troubleshooting

### Common Issues:

1. **Services not starting:**
   ```bash
   docker-compose -f monitoring/docker-compose.monitoring.yml logs
   ```

2. **Database connection issues:**
   ```bash
   php api/scripts/check-db-connection.php
   ```

3. **High disk usage:**
   ```bash
   ./monitoring/cleanup-old-data.sh
   ```

4. **Memory issues:**
   ```bash
   # Adjust Docker memory limits in docker-compose.yml
   ```

## 📞 Support

Untuk bantuan teknis:
1. Check logs di `monitoring/logs/`
2. Review dashboard alerts
3. Run health check scripts
4. Check database monitoring tables

---

## 🎉 Kesimpulan

Sistem monitoring internal IndoWater memberikan:
- **Complete visibility** ke dalam sistem Anda
- **Real-time alerting** untuk issues critical
- **Historical analysis** untuk trend analysis
- **Cost-effective solution** tanpa external dependencies
- **Full data control** dan privacy compliance

**Semua fitur monitoring enterprise-grade tanpa biaya bulanan!** 🚀
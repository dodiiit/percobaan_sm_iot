#!/bin/bash

# IndoWater Internal Monitoring Setup Script
# This script sets up a complete self-hosted monitoring solution

set -e

echo "🚀 Setting up IndoWater Internal Monitoring System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create monitoring directories
print_status "Creating monitoring directories..."
mkdir -p monitoring/logs
mkdir -p monitoring/data/{elasticsearch,prometheus,grafana}
mkdir -p api/logs

# Set permissions
chmod 755 monitoring/logs
chmod 755 api/logs

# Create database monitoring tables
print_status "Setting up database monitoring tables..."
if [ -f "api/database/migrations/create_monitoring_tables.sql" ]; then
    # You would run this against your database
    print_warning "Please run the monitoring tables migration manually:"
    print_warning "mysql -u root -p indowater < api/database/migrations/create_monitoring_tables.sql"
else
    print_error "Monitoring tables migration file not found!"
fi

# Build monitoring dashboard
print_status "Building monitoring dashboard..."
cd monitoring/monitoring-dashboard
if [ -f "package.json" ]; then
    npm install
    print_success "Monitoring dashboard dependencies installed"
else
    print_error "Monitoring dashboard package.json not found!"
fi
cd ../..

# Start monitoring services
print_status "Starting monitoring services..."
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check service status
print_status "Checking service status..."
docker-compose -f docker-compose.monitoring.yml ps

# Test Elasticsearch
print_status "Testing Elasticsearch..."
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    print_success "Elasticsearch is running"
else
    print_warning "Elasticsearch may not be ready yet"
fi

# Test Kibana
print_status "Testing Kibana..."
if curl -s http://localhost:5601/api/status > /dev/null; then
    print_success "Kibana is running"
else
    print_warning "Kibana may not be ready yet"
fi

# Test Prometheus
print_status "Testing Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    print_success "Prometheus is running"
else
    print_warning "Prometheus may not be ready yet"
fi

# Test Grafana
print_status "Testing Grafana..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "Grafana is running"
else
    print_warning "Grafana may not be ready yet"
fi

cd ..

# Create monitoring configuration for API
print_status "Updating API configuration..."
cat >> api/config/settings.php << 'EOF'

// Monitoring configuration
$settings['monitoring'] = [
    'enabled' => true,
    'internal_dashboard' => true,
    'alert_email' => 'admin@indowater.com',
    'alert_thresholds' => [
        'error_rate' => 10, // errors per hour
        'response_time' => 5000, // milliseconds
        'memory_usage' => 80, // percentage
        'disk_usage' => 90, // percentage
    ],
    'retention_days' => 30,
    'sample_rate' => 0.1, // 10% sampling in production
];
EOF

# Create monitoring middleware registration
print_status "Registering monitoring middleware..."
cat >> api/src/middleware.php << 'EOF'

// Register monitoring middleware
$app->add(new \IndoWater\Api\Middleware\MonitoringMiddleware($container->get('monitoring')));
EOF

# Update frontend to use internal monitoring
print_status "Updating frontend monitoring..."
cat >> frontend/src/main.tsx << 'EOF'

// Initialize internal monitoring
import internalMonitoring from './services/internalMonitoring';

// The monitoring service is automatically initialized
console.log('Internal monitoring initialized:', internalMonitoring.getStats());
EOF

# Create monitoring cron jobs
print_status "Setting up monitoring cron jobs..."
cat > monitoring/cron-jobs.sh << 'EOF'
#!/bin/bash

# Monitoring maintenance cron jobs
# Add these to your system crontab:

# Clean old monitoring data (daily at 2 AM)
# 0 2 * * * /path/to/monitoring/cleanup-old-data.sh

# Health check (every 5 minutes)
# */5 * * * * /path/to/monitoring/health-check.sh

# Generate monitoring reports (daily at 6 AM)
# 0 6 * * * /path/to/monitoring/generate-reports.sh

# Backup monitoring data (weekly)
# 0 3 * * 0 /path/to/monitoring/backup-data.sh
EOF

chmod +x monitoring/cron-jobs.sh

# Create health check script
cat > monitoring/health-check.sh << 'EOF'
#!/bin/bash

# Health check script
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
if [ "$API_STATUS" != "200" ]; then
    echo "[$TIMESTAMP] API health check failed: HTTP $API_STATUS" >> monitoring/logs/health-check.log
fi

# Check database connection
DB_STATUS=$(php api/scripts/check-db-connection.php)
if [ "$DB_STATUS" != "OK" ]; then
    echo "[$TIMESTAMP] Database health check failed: $DB_STATUS" >> monitoring/logs/health-check.log
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "[$TIMESTAMP] High disk usage: ${DISK_USAGE}%" >> monitoring/logs/health-check.log
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "[$TIMESTAMP] High memory usage: ${MEMORY_USAGE}%" >> monitoring/logs/health-check.log
fi
EOF

chmod +x monitoring/health-check.sh

# Create cleanup script
cat > monitoring/cleanup-old-data.sh << 'EOF'
#!/bin/bash

# Cleanup old monitoring data
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting monitoring data cleanup..."

# Clean database monitoring data (older than 30 days)
mysql -u root -p indowater << 'SQL'
DELETE FROM error_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
DELETE FROM performance_metrics WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
DELETE FROM system_health_checks WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
DELETE FROM request_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
DELETE FROM custom_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
SQL

# Clean log files (keep last 7 days)
find api/logs -name "*.log" -mtime +7 -delete
find monitoring/logs -name "*.log" -mtime +7 -delete

echo "[$TIMESTAMP] Monitoring data cleanup completed"
EOF

chmod +x monitoring/cleanup-old-data.sh

# Print final instructions
print_success "🎉 IndoWater Internal Monitoring System setup completed!"
echo ""
echo "📊 Access your monitoring dashboards:"
echo "   • Kibana (Log Analysis):     http://localhost:5601"
echo "   • Grafana (Metrics):         http://localhost:3001 (admin/admin123)"
echo "   • Prometheus (Raw Metrics):  http://localhost:9090"
echo "   • Custom Dashboard:          http://localhost:3002"
echo ""
echo "🔧 Next steps:"
echo "   1. Run database migrations: mysql -u root -p indowater < api/database/migrations/create_monitoring_tables.sql"
echo "   2. Add cron jobs: crontab -e and add jobs from monitoring/cron-jobs.sh"
echo "   3. Configure email alerts in api/config/settings.php"
echo "   4. Test the monitoring system with some API calls"
echo ""
echo "📚 Documentation:"
echo "   • Monitoring logs: monitoring/logs/"
echo "   • Health checks: monitoring/health-check.sh"
echo "   • Data cleanup: monitoring/cleanup-old-data.sh"
echo ""
print_warning "Note: This is a self-hosted solution that doesn't require external services!"
print_warning "All data stays within your infrastructure."
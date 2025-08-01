# Deployment and Maintenance Procedures

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [Production Deployment](#production-deployment)
4. [Maintenance Procedures](#maintenance-procedures)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Backup and Recovery](#backup-and-recovery)
7. [Security Procedures](#security-procedures)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Emergency Procedures](#emergency-procedures)

## Deployment Overview

The IndoWater IoT Smart Monitoring System uses a containerized deployment approach with Docker and Docker Compose, supporting both development and production environments.

### Architecture Components
- **Frontend**: React.js application (Port 3000)
- **Backend API**: PHP Slim framework (Port 8000)
- **Database**: MySQL 8.0 (Port 3306)
- **Cache**: Redis (Port 6379)
- **Web Server**: Nginx (Production)
- **Process Manager**: PM2 (Production)

### Deployment Environments
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

## Environment Setup

### Prerequisites

#### System Requirements
- **OS**: Ubuntu 20.04 LTS or CentOS 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Stable internet connection

#### Software Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for frontend builds)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PHP (for API development)
sudo apt install php8.1 php8.1-cli php8.1-fpm php8.1-mysql php8.1-redis php8.1-curl php8.1-json php8.1-mbstring php8.1-xml composer
```

### Environment Configuration

#### Development Environment
```bash
# Clone repository
git clone https://github.com/dodiiit/percobaan_sm_iot.git
cd percobaan_sm_iot

# Copy environment files
cp .env.example .env
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env

# Start development environment
docker-compose up -d

# Install dependencies
cd api && composer install
cd ../frontend && npm install
```

#### Environment Variables

##### Backend (.env)
```bash
# Application
APP_NAME=IndoWater
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.indowater.com
APP_TIMEZONE=Asia/Jakarta

# Database
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=indowater
DB_USERNAME=indowater
DB_PASSWORD=secure_password_here

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_PASSWORD=redis_password_here

# Cache
CACHE_DRIVER=redis
CACHE_PREFIX=indowater:
CACHE_DEFAULT_TTL=3600
CACHE_ENABLED=true

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_TTL=3600
JWT_REFRESH_TTL=604800

# Mail
MAIL_DRIVER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls

# Payment Gateways
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_ENVIRONMENT=production

DOKU_CLIENT_ID=your_doku_client_id
DOKU_SECRET_KEY=your_doku_secret_key
DOKU_ENVIRONMENT=production

# Security
CORS_ALLOWED_ORIGINS=https://app.indowater.com,https://admin.indowater.com
RATE_LIMIT_REQUESTS=120
RATE_LIMIT_PER_MINUTE=1
```

##### Frontend (.env)
```bash
# API Configuration
REACT_APP_API_URL=https://api.indowater.com/api
REACT_APP_WS_URL=wss://api.indowater.com/ws

# Application
REACT_APP_NAME=IndoWater
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true

# External Services
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
REACT_APP_SENTRY_DSN=your_sentry_dsn
```

## Production Deployment

### Pre-deployment Checklist

#### Code Quality
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Documentation updated

#### Infrastructure
- [ ] Server resources adequate
- [ ] SSL certificates valid
- [ ] Domain DNS configured
- [ ] Firewall rules configured
- [ ] Backup systems operational

#### Configuration
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] Cache configuration verified
- [ ] Monitoring tools configured
- [ ] Log rotation configured

### Deployment Steps

#### 1. Server Preparation
```bash
# Create application directory
sudo mkdir -p /opt/indowater
sudo chown $USER:$USER /opt/indowater
cd /opt/indowater

# Clone production code
git clone -b main https://github.com/dodiiit/percobaan_sm_iot.git .

# Set permissions
sudo chown -R www-data:www-data storage/
sudo chmod -R 755 storage/
```

#### 2. Database Setup
```bash
# Create production database
mysql -u root -p
CREATE DATABASE indowater CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'indowater'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON indowater.* TO 'indowater'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
cd api
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder
```

#### 3. Application Deployment
```bash
# Install backend dependencies
cd api
composer install --no-dev --optimize-autoloader

# Build frontend
cd ../frontend
npm ci
npm run build

# Copy built files to web directory
sudo cp -r build/* /var/www/html/
```

#### 4. Docker Production Setup
```bash
# Use production docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps
```

#### 5. Nginx Configuration
```nginx
# /etc/nginx/sites-available/indowater
server {
    listen 80;
    server_name api.indowater.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.indowater.com;

    ssl_certificate /etc/ssl/certs/indowater.crt;
    ssl_certificate_key /etc/ssl/private/indowater.key;

    root /opt/indowater/api/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}

# Frontend configuration
server {
    listen 443 ssl http2;
    server_name app.indowater.com;

    ssl_certificate /etc/ssl/certs/indowater.crt;
    ssl_certificate_key /etc/ssl/private/indowater.key;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 6. SSL Certificate Setup
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.indowater.com -d app.indowater.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 7. Process Management
```bash
# Install PM2
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'indowater-api',
    cwd: '/opt/indowater/api',
    script: 'public/index.php',
    interpreter: 'php',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      APP_ENV: 'production'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Post-deployment Verification

#### Health Checks
```bash
# API health check
curl -f https://api.indowater.com/health || exit 1

# Database connectivity
mysql -h localhost -u indowater -p indowater -e "SELECT 1;"

# Redis connectivity
redis-cli ping

# Cache functionality
curl -H "Authorization: Bearer token" https://api.indowater.com/api/cache/health
```

#### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.indowater.com/api/meters

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.indowater.com/api/meters
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks
- [ ] Check system health dashboards
- [ ] Review error logs
- [ ] Monitor disk space usage
- [ ] Verify backup completion
- [ ] Check SSL certificate status

#### Weekly Tasks
- [ ] Update system packages
- [ ] Review performance metrics
- [ ] Clean up old log files
- [ ] Test backup restoration
- [ ] Security scan

#### Monthly Tasks
- [ ] Update application dependencies
- [ ] Review and rotate API keys
- [ ] Performance optimization review
- [ ] Capacity planning assessment
- [ ] Security audit

### System Updates

#### Application Updates
```bash
# Create maintenance page
sudo cp maintenance.html /var/www/html/index.html

# Backup current version
sudo tar -czf /opt/backups/indowater-$(date +%Y%m%d).tar.gz /opt/indowater

# Pull latest code
cd /opt/indowater
git fetch origin
git checkout main
git pull origin main

# Update dependencies
cd api && composer install --no-dev --optimize-autoloader
cd ../frontend && npm ci && npm run build

# Run migrations
php artisan migrate --force

# Clear cache
php artisan cache:clear
redis-cli flushdb

# Restart services
sudo systemctl restart nginx php8.1-fpm
pm2 restart all

# Remove maintenance page
sudo rm /var/www/html/index.html
```

#### System Package Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Update Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Restart services
sudo systemctl restart docker
docker-compose -f docker-compose.prod.yml restart
```

### Database Maintenance

#### Regular Database Tasks
```bash
# Optimize tables
mysql -u indowater -p indowater -e "OPTIMIZE TABLE meters, users, properties, payments;"

# Update statistics
mysql -u indowater -p indowater -e "ANALYZE TABLE meters, users, properties, payments;"

# Check for corruption
mysql -u indowater -p indowater -e "CHECK TABLE meters, users, properties, payments;"

# Clean up old data
mysql -u indowater -p indowater -e "DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);"
```

#### Database Backup
```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/database"
DB_NAME="indowater"
DB_USER="indowater"
DB_PASS="secure_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/indowater_$DATE.sql.gz

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/indowater_$DATE.sql.gz s3://indowater-backups/database/
```

### Cache Maintenance

#### Redis Maintenance
```bash
# Check Redis memory usage
redis-cli info memory

# Clear specific cache patterns
redis-cli --scan --pattern "indowater:api:*" | xargs redis-cli del

# Optimize Redis
redis-cli bgrewriteaof

# Monitor Redis performance
redis-cli --latency-history -i 1
```

#### Application Cache
```bash
# Clear application cache
cd /opt/indowater/api
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Warm up cache
curl -X POST -H "Authorization: Bearer admin_token" https://api.indowater.com/api/cache/warmup
```

### Log Management

#### Log Rotation Configuration
```bash
# /etc/logrotate.d/indowater
/opt/indowater/api/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload php8.1-fpm
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        systemctl reload nginx
    endscript
}
```

#### Log Analysis
```bash
# Check error logs
tail -f /opt/indowater/api/logs/error.log

# Analyze access patterns
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Monitor API response times
grep "response_time" /opt/indowater/api/logs/app.log | awk '{sum+=$NF; count++} END {print "Average:", sum/count}'
```

## Monitoring and Alerting

### System Monitoring

#### Server Metrics
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# System resource monitoring script
#!/bin/bash
# /opt/scripts/system-monitor.sh

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

# Memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# Send alerts if thresholds exceeded
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "High CPU usage: $CPU_USAGE%" | mail -s "Server Alert" admin@indowater.com
fi

if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
    echo "High memory usage: $MEM_USAGE%" | mail -s "Server Alert" admin@indowater.com
fi

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "High disk usage: $DISK_USAGE%" | mail -s "Server Alert" admin@indowater.com
fi
```

#### Application Monitoring
```bash
# API health monitoring
#!/bin/bash
# /opt/scripts/api-monitor.sh

API_URL="https://api.indowater.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$RESPONSE" != "200" ]; then
    echo "API health check failed: HTTP $RESPONSE" | mail -s "API Alert" admin@indowater.com
fi

# Database connectivity
mysql -h localhost -u indowater -p$DB_PASS -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Database connection failed" | mail -s "Database Alert" admin@indowater.com
fi

# Redis connectivity
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Redis connection failed" | mail -s "Redis Alert" admin@indowater.com
fi
```

### Alerting Setup

#### Email Alerts
```bash
# Install mail utilities
sudo apt install mailutils postfix

# Configure postfix for Gmail SMTP
sudo nano /etc/postfix/main.cf
# Add:
# relayhost = [smtp.gmail.com]:587
# smtp_sasl_auth_enable = yes
# smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
# smtp_sasl_security_options = noanonymous
# smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt
# smtp_use_tls = yes

# Create password file
echo "[smtp.gmail.com]:587 your_email@gmail.com:your_app_password" | sudo tee /etc/postfix/sasl_passwd
sudo postmap /etc/postfix/sasl_passwd
sudo chmod 400 /etc/postfix/sasl_passwd

sudo systemctl restart postfix
```

#### Cron Jobs for Monitoring
```bash
# Add to crontab
crontab -e

# System monitoring every 5 minutes
*/5 * * * * /opt/scripts/system-monitor.sh

# API monitoring every minute
* * * * * /opt/scripts/api-monitor.sh

# Daily backup
0 2 * * * /opt/scripts/backup-database.sh

# Weekly log cleanup
0 3 * * 0 /opt/scripts/cleanup-logs.sh
```

## Backup and Recovery

### Backup Strategy

#### Full System Backup
```bash
#!/bin/bash
# /opt/scripts/full-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/full"
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u indowater -p$DB_PASS indowater | gzip > $BACKUP_DIR/database_$DATE.sql.gz

# Application files backup
tar -czf $BACKUP_DIR/application_$DATE.tar.gz /opt/indowater --exclude=/opt/indowater/node_modules

# Configuration backup
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx /etc/php /etc/mysql

# Upload to cloud storage
aws s3 sync $BACKUP_DIR s3://indowater-backups/full/

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

#### Incremental Backup
```bash
#!/bin/bash
# /opt/scripts/incremental-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/incremental"
LAST_BACKUP="/opt/backups/.last_backup"

mkdir -p $BACKUP_DIR

# Find files changed since last backup
if [ -f $LAST_BACKUP ]; then
    find /opt/indowater -newer $LAST_BACKUP -type f | tar -czf $BACKUP_DIR/incremental_$DATE.tar.gz -T -
else
    tar -czf $BACKUP_DIR/incremental_$DATE.tar.gz /opt/indowater
fi

# Update last backup timestamp
touch $LAST_BACKUP

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/incremental_$DATE.tar.gz s3://indowater-backups/incremental/
```

### Recovery Procedures

#### Database Recovery
```bash
# Stop application
pm2 stop all
sudo systemctl stop nginx

# Restore database
mysql -u indowater -p$DB_PASS indowater < backup_file.sql

# Verify data integrity
mysql -u indowater -p$DB_PASS indowater -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM meters;"

# Start application
sudo systemctl start nginx
pm2 start all
```

#### Application Recovery
```bash
# Backup current state
sudo mv /opt/indowater /opt/indowater.backup

# Extract backup
sudo tar -xzf application_backup.tar.gz -C /

# Set permissions
sudo chown -R www-data:www-data /opt/indowater/storage
sudo chmod -R 755 /opt/indowater/storage

# Clear cache
cd /opt/indowater/api
php artisan cache:clear
redis-cli flushdb

# Restart services
sudo systemctl restart nginx php8.1-fpm
pm2 restart all
```

#### Disaster Recovery
```bash
#!/bin/bash
# /opt/scripts/disaster-recovery.sh

echo "Starting disaster recovery process..."

# Download latest backups from cloud
aws s3 sync s3://indowater-backups/full/ /tmp/recovery/

# Find latest backup
LATEST_DB=$(ls -t /tmp/recovery/database_*.sql.gz | head -1)
LATEST_APP=$(ls -t /tmp/recovery/application_*.tar.gz | head -1)

# Restore database
echo "Restoring database..."
gunzip -c $LATEST_DB | mysql -u indowater -p$DB_PASS indowater

# Restore application
echo "Restoring application..."
sudo tar -xzf $LATEST_APP -C /

# Set permissions
sudo chown -R www-data:www-data /opt/indowater
sudo chmod -R 755 /opt/indowater/storage

# Restart all services
echo "Restarting services..."
sudo systemctl restart mysql nginx php8.1-fpm redis
pm2 restart all

echo "Disaster recovery completed!"
```

## Security Procedures

### Security Hardening

#### Server Security
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### Application Security
```bash
# Set secure file permissions
sudo chown -R www-data:www-data /opt/indowater
sudo chmod -R 755 /opt/indowater
sudo chmod -R 644 /opt/indowater/api/config
sudo chmod 600 /opt/indowater/api/.env

# Secure sensitive files
sudo chmod 600 /etc/ssl/private/*
sudo chown root:root /etc/ssl/private/*
```

### Security Monitoring

#### Log Monitoring
```bash
# Monitor failed login attempts
sudo tail -f /var/log/auth.log | grep "Failed password"

# Monitor web attacks
sudo tail -f /var/log/nginx/access.log | grep -E "(SELECT|UNION|DROP|INSERT|UPDATE|DELETE)"

# Monitor file changes
sudo apt install aide
sudo aide --init
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

#### Vulnerability Scanning
```bash
# Install security tools
sudo apt install nmap lynis chkrootkit rkhunter

# Run security audit
sudo lynis audit system

# Check for rootkits
sudo chkrootkit
sudo rkhunter --check

# Network security scan
nmap -sS -O localhost
```

### SSL/TLS Management

#### Certificate Renewal
```bash
# Check certificate expiry
openssl x509 -in /etc/ssl/certs/indowater.crt -text -noout | grep "Not After"

# Renew Let's Encrypt certificates
sudo certbot renew --dry-run
sudo certbot renew

# Test SSL configuration
curl -I https://api.indowater.com
openssl s_client -connect api.indowater.com:443 -servername api.indowater.com
```

## Performance Optimization

### Database Optimization

#### Query Optimization
```sql
-- Analyze slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check query performance
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- Optimize tables
OPTIMIZE TABLE meters, users, properties, payments;

-- Update table statistics
ANALYZE TABLE meters, users, properties, payments;
```

#### Index Optimization
```sql
-- Check index usage
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    SEQ_IN_INDEX,
    COLUMN_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'indowater';

-- Add missing indexes
CREATE INDEX idx_meters_status ON meters(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_users_role ON users(role);
```

### Application Optimization

#### PHP Optimization
```bash
# Configure PHP-FPM
sudo nano /etc/php/8.1/fpm/pool.d/www.conf

# Optimize settings:
# pm = dynamic
# pm.max_children = 50
# pm.start_servers = 5
# pm.min_spare_servers = 5
# pm.max_spare_servers = 35
# pm.max_requests = 500

# Enable OPcache
sudo nano /etc/php/8.1/fpm/conf.d/10-opcache.ini

# Add:
# opcache.enable=1
# opcache.memory_consumption=128
# opcache.interned_strings_buffer=8
# opcache.max_accelerated_files=4000
# opcache.revalidate_freq=2
# opcache.fast_shutdown=1
```

#### Redis Optimization
```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Optimize settings:
# maxmemory 1gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

sudo systemctl restart redis
```

### Frontend Optimization

#### Build Optimization
```bash
# Optimize React build
cd /opt/indowater/frontend

# Install build tools
npm install --save-dev webpack-bundle-analyzer

# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Enable gzip compression in Nginx
sudo nano /etc/nginx/nginx.conf

# Add:
# gzip on;
# gzip_vary on;
# gzip_min_length 1024;
# gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## Troubleshooting Guide

### Common Issues

#### High CPU Usage
```bash
# Identify CPU-intensive processes
top -c
htop

# Check for runaway processes
ps aux --sort=-%cpu | head -10

# Monitor PHP-FPM processes
sudo tail -f /var/log/php8.1-fpm.log

# Solutions:
# - Optimize database queries
# - Increase PHP-FPM pool size
# - Enable caching
# - Scale horizontally
```

#### Memory Issues
```bash
# Check memory usage
free -h
cat /proc/meminfo

# Identify memory-intensive processes
ps aux --sort=-%mem | head -10

# Check for memory leaks
valgrind --tool=memcheck --leak-check=full php script.php

# Solutions:
# - Increase server memory
# - Optimize application code
# - Configure swap space
# - Implement memory limits
```

#### Database Performance
```bash
# Check database connections
mysql -u indowater -p -e "SHOW PROCESSLIST;"

# Monitor slow queries
mysql -u indowater -p -e "SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;"

# Check table locks
mysql -u indowater -p -e "SHOW OPEN TABLES WHERE In_use > 0;"

# Solutions:
# - Optimize queries
# - Add indexes
# - Increase connection pool
# - Partition large tables
```

#### Cache Issues
```bash
# Check Redis status
redis-cli info

# Monitor cache hit ratio
redis-cli info stats | grep keyspace

# Check cache memory usage
redis-cli info memory

# Clear problematic cache
redis-cli flushdb

# Solutions:
# - Increase cache memory
# - Optimize cache keys
# - Implement cache warming
# - Review TTL settings
```

### Error Resolution

#### 500 Internal Server Error
```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /opt/indowater/api/logs/error.log

# Check PHP-FPM status
sudo systemctl status php8.1-fpm

# Verify file permissions
ls -la /opt/indowater/api/

# Common fixes:
# - Fix file permissions
# - Check PHP syntax errors
# - Verify database connectivity
# - Clear application cache
```

#### Database Connection Errors
```bash
# Test database connectivity
mysql -h localhost -u indowater -p

# Check MySQL status
sudo systemctl status mysql

# Verify configuration
cat /opt/indowater/api/.env | grep DB_

# Check connection limits
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"

# Solutions:
# - Restart MySQL service
# - Check credentials
# - Increase connection limits
# - Verify network connectivity
```

## Emergency Procedures

### Service Outage Response

#### Immediate Response (0-5 minutes)
1. **Assess Impact**
   - Check service status dashboard
   - Identify affected components
   - Estimate user impact

2. **Initial Communication**
   - Post status update
   - Notify stakeholders
   - Activate incident response team

3. **Quick Fixes**
   - Restart failed services
   - Check recent deployments
   - Verify infrastructure status

#### Short-term Response (5-30 minutes)
1. **Detailed Investigation**
   - Analyze error logs
   - Check system metrics
   - Identify root cause

2. **Implement Workarounds**
   - Enable maintenance mode
   - Redirect traffic if needed
   - Scale resources if required

3. **Communication Updates**
   - Provide status updates
   - Estimate resolution time
   - Keep stakeholders informed

#### Long-term Response (30+ minutes)
1. **Permanent Fix**
   - Implement proper solution
   - Test thoroughly
   - Deploy fix

2. **Service Restoration**
   - Gradually restore services
   - Monitor system stability
   - Verify full functionality

3. **Post-incident Review**
   - Document incident
   - Identify improvements
   - Update procedures

### Disaster Recovery

#### Data Center Failure
1. **Activate DR Site**
   - Switch DNS to backup location
   - Restore from latest backups
   - Verify data integrity

2. **Service Migration**
   - Update configuration
   - Test all functionality
   - Monitor performance

3. **Communication**
   - Notify users of temporary service location
   - Provide updates on primary site restoration
   - Document lessons learned

#### Security Breach
1. **Immediate Response**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Assessment**
   - Determine breach scope
   - Identify compromised data
   - Assess damage

3. **Recovery**
   - Patch vulnerabilities
   - Reset credentials
   - Restore from clean backups

4. **Communication**
   - Notify affected users
   - Report to authorities if required
   - Provide security updates

### Contact Information

#### Emergency Contacts
- **System Administrator**: +62-XXX-XXXX-XXXX
- **Database Administrator**: +62-XXX-XXXX-XXXX
- **Security Team**: security@indowater.com
- **Management**: management@indowater.com

#### Vendor Support
- **Hosting Provider**: support@hostingprovider.com
- **SSL Certificate**: support@sslprovider.com
- **Payment Gateway**: support@midtrans.com
- **Monitoring Service**: support@monitoring.com

---

*This document should be reviewed and updated quarterly to ensure accuracy and relevance.*
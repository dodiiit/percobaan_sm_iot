#!/bin/bash

# IndoWater Backup Setup Script
# This script sets up the backup system and schedules automated backups

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

log "Setting up IndoWater backup system..."

# 1. Create necessary directories
log "Creating backup directories..."
mkdir -p "${PROJECT_ROOT}/backups/database"
mkdir -p "${PROJECT_ROOT}/backups/database/weekly"
mkdir -p "${PROJECT_ROOT}/backups/database/monthly"
mkdir -p "${PROJECT_ROOT}/backups/redis"
mkdir -p "${PROJECT_ROOT}/backups/full-system"
mkdir -p "${PROJECT_ROOT}/logs"

success "Backup directories created"

# 2. Make scripts executable
log "Making backup scripts executable..."
chmod +x "${SCRIPT_DIR}/database-backup.sh"
chmod +x "${SCRIPT_DIR}/database-restore.sh"
chmod +x "${SCRIPT_DIR}/redis-backup.sh"
chmod +x "${SCRIPT_DIR}/full-system-backup.sh"
chmod +x "${PROJECT_ROOT}/scripts/disaster-recovery/assess-database.sh"
chmod +x "${PROJECT_ROOT}/scripts/disaster-recovery/health-check.sh"
chmod +x "${PROJECT_ROOT}/scripts/disaster-recovery/restore-redis.sh"

success "Scripts made executable"

# 3. Check dependencies
log "Checking system dependencies..."

MISSING_DEPS=()

# Check for required commands
REQUIRED_COMMANDS=("mysqldump" "mysql" "gzip" "tar" "find" "docker" "docker-compose")

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        MISSING_DEPS+=("$cmd")
        error "$cmd is not installed"
    else
        success "$cmd is available"
    fi
done

# Check for optional commands
OPTIONAL_COMMANDS=("redis-cli" "curl" "mail" "aws")

for cmd in "${OPTIONAL_COMMANDS[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        warning "$cmd is not installed (optional)"
    else
        success "$cmd is available"
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    error "Missing required dependencies: ${MISSING_DEPS[*]}"
    echo ""
    echo "Please install the missing dependencies:"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-client redis-tools"
    echo "  CentOS/RHEL: sudo yum install mysql redis"
    echo "  macOS: brew install mysql redis"
    exit 1
fi

# 4. Test database connection
log "Testing database connection..."
if [ -f "${PROJECT_ROOT}/api/.env" ]; then
    source "${PROJECT_ROOT}/api/.env"
    
    if mysql -h"${DB_HOST:-localhost}" -P"${DB_PORT:-3306}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" -e "SELECT 1;" "${DB_DATABASE}" &>/dev/null; then
        success "Database connection successful"
    else
        warning "Database connection failed. Please check your .env configuration."
    fi
else
    warning ".env file not found. Please create it from .env.example"
fi

# 5. Test Redis connection
log "Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping &>/dev/null; then
        success "Redis connection successful"
    else
        warning "Redis connection failed. Please check your Redis configuration."
    fi
else
    warning "redis-cli not available. Redis backups will be skipped."
fi

# 6. Create initial test backup
log "Creating initial test backup..."
if bash "${SCRIPT_DIR}/database-backup.sh"; then
    success "Initial database backup created successfully"
else
    error "Initial backup failed. Please check the logs."
fi

# 7. Setup cron jobs
log "Setting up automated backup schedule..."

# Update the cron configuration with the correct project path
CRON_FILE="${SCRIPT_DIR}/backup-cron.conf"
TEMP_CRON="/tmp/indowater-backup-cron.conf"

sed "s|PROJECT_ROOT=/path/to/IndoWater|PROJECT_ROOT=${PROJECT_ROOT}|g" "${CRON_FILE}" > "${TEMP_CRON}"

echo ""
echo "Cron job configuration has been prepared at: ${TEMP_CRON}"
echo ""
echo "To install the cron jobs, run one of the following commands:"
echo ""
echo "1. Install all cron jobs (replaces existing crontab):"
echo "   crontab ${TEMP_CRON}"
echo ""
echo "2. Add to existing crontab:"
echo "   crontab -l > /tmp/current-cron"
echo "   cat ${TEMP_CRON} >> /tmp/current-cron"
echo "   crontab /tmp/current-cron"
echo ""
echo "3. Manual installation:"
echo "   crontab -e"
echo "   # Then copy and paste the contents of ${TEMP_CRON}"
echo ""

read -p "Would you like to install the cron jobs now? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if crontab "${TEMP_CRON}"; then
        success "Cron jobs installed successfully"
        echo ""
        echo "Current crontab:"
        crontab -l
    else
        error "Failed to install cron jobs"
    fi
else
    warning "Cron jobs not installed. You can install them manually later."
fi

# 8. Create backup configuration file
log "Creating backup configuration file..."
CONFIG_FILE="${PROJECT_ROOT}/backup-config.conf"

cat > "${CONFIG_FILE}" << EOF
# IndoWater Backup Configuration
# This file contains configuration settings for the backup system

# Email notifications (optional)
BACKUP_NOTIFICATION_EMAIL=""
RESTORE_NOTIFICATION_EMAIL=""
HEALTH_CHECK_NOTIFICATION_EMAIL=""

# AWS S3 backup storage (optional)
AWS_S3_BACKUP_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_DEFAULT_REGION="us-east-1"

# Backup retention settings (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=30
MONTHLY_RETENTION=365

# Backup compression
BACKUP_COMPRESSION=true

# Health check settings
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=3600  # seconds

# Monitoring settings
DISK_USAGE_THRESHOLD=90     # percentage
MEMORY_USAGE_THRESHOLD=80   # percentage

# Backup verification
VERIFY_BACKUPS=true
BACKUP_INTEGRITY_CHECK=true
EOF

success "Backup configuration created: ${CONFIG_FILE}"

# 9. Create backup status dashboard
log "Creating backup status script..."
STATUS_SCRIPT="${SCRIPT_DIR}/backup-status.sh"

cat > "${STATUS_SCRIPT}" << 'EOF'
#!/bin/bash

# IndoWater Backup Status Dashboard
# This script displays the current status of backups and system health

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "IndoWater Backup System Status"
echo "=============================="
echo "Date: $(date)"
echo "Host: $(hostname)"
echo ""

# Database backups
echo "Database Backups:"
if [ -d "${PROJECT_ROOT}/backups/database" ]; then
    BACKUP_COUNT=$(find "${PROJECT_ROOT}/backups/database" -name "*.sql.gz" | wc -l)
    echo "  Total backups: ${BACKUP_COUNT}"
    
    if [ ${BACKUP_COUNT} -gt 0 ]; then
        LATEST_BACKUP=$(find "${PROJECT_ROOT}/backups/database" -name "*.sql.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        BACKUP_SIZE=$(du -h "${LATEST_BACKUP}" | cut -f1)
        BACKUP_DATE=$(stat -c %y "${LATEST_BACKUP}" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  Latest backup: $(basename "${LATEST_BACKUP}") (${BACKUP_SIZE}, ${BACKUP_DATE})"
    fi
else
    echo "  No backup directory found"
fi

echo ""

# Redis backups
echo "Redis Backups:"
if [ -d "${PROJECT_ROOT}/backups/redis" ]; then
    REDIS_BACKUP_COUNT=$(find "${PROJECT_ROOT}/backups/redis" -name "*.rdb.gz" | wc -l)
    echo "  Total backups: ${REDIS_BACKUP_COUNT}"
    
    if [ ${REDIS_BACKUP_COUNT} -gt 0 ]; then
        LATEST_REDIS=$(find "${PROJECT_ROOT}/backups/redis" -name "*.rdb.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        REDIS_SIZE=$(du -h "${LATEST_REDIS}" | cut -f1)
        REDIS_DATE=$(stat -c %y "${LATEST_REDIS}" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  Latest backup: $(basename "${LATEST_REDIS}") (${REDIS_SIZE}, ${REDIS_DATE})"
    fi
else
    echo "  No Redis backup directory found"
fi

echo ""

# Full system backups
echo "Full System Backups:"
if [ -d "${PROJECT_ROOT}/backups" ]; then
    FULL_BACKUP_COUNT=$(find "${PROJECT_ROOT}/backups" -name "full-system-backup_*.tar.gz" | wc -l)
    echo "  Total backups: ${FULL_BACKUP_COUNT}"
    
    if [ ${FULL_BACKUP_COUNT} -gt 0 ]; then
        LATEST_FULL=$(find "${PROJECT_ROOT}/backups" -name "full-system-backup_*.tar.gz" -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        FULL_SIZE=$(du -h "${LATEST_FULL}" | cut -f1)
        FULL_DATE=$(stat -c %y "${LATEST_FULL}" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  Latest backup: $(basename "${LATEST_FULL}") (${FULL_SIZE}, ${FULL_DATE})"
    fi
else
    echo "  No full backup directory found"
fi

echo ""

# Disk usage
echo "Storage Usage:"
TOTAL_BACKUP_SIZE=$(du -sh "${PROJECT_ROOT}/backups" 2>/dev/null | cut -f1 || echo "0")
echo "  Total backup size: ${TOTAL_BACKUP_SIZE}"

DISK_USAGE=$(df -h "${PROJECT_ROOT}" | awk 'NR==2 {print $5}')
echo "  Disk usage: ${DISK_USAGE}"

echo ""

# Cron jobs
echo "Scheduled Jobs:"
if crontab -l 2>/dev/null | grep -q "IndoWater\|indowater"; then
    echo "  Cron jobs are configured"
    CRON_COUNT=$(crontab -l 2>/dev/null | grep -c "IndoWater\|indowater" || echo "0")
    echo "  Active backup jobs: ${CRON_COUNT}"
else
    echo "  No cron jobs found"
fi

echo ""
echo "=============================="
EOF

chmod +x "${STATUS_SCRIPT}"
success "Backup status script created: ${STATUS_SCRIPT}"

# 10. Display setup summary
echo ""
echo "=============================="
echo "Backup System Setup Complete!"
echo "=============================="
echo ""
echo "What was set up:"
success "Backup directories created"
success "Backup scripts made executable"
success "Dependencies checked"
success "Initial test backup created"
success "Backup configuration file created"
success "Backup status dashboard created"
echo ""
echo "Next steps:"
echo "1. Edit ${CONFIG_FILE} to configure email notifications and cloud storage"
echo "2. Install cron jobs for automated backups (see instructions above)"
echo "3. Test the disaster recovery procedures"
echo "4. Review and customize backup retention policies"
echo ""
echo "Useful commands:"
echo "  View backup status: ${STATUS_SCRIPT}"
echo "  Manual database backup: ${SCRIPT_DIR}/database-backup.sh"
echo "  Manual full backup: ${SCRIPT_DIR}/full-system-backup.sh"
echo "  System health check: ${PROJECT_ROOT}/scripts/disaster-recovery/health-check.sh"
echo "  Database assessment: ${PROJECT_ROOT}/scripts/disaster-recovery/assess-database.sh"
echo ""
echo "Documentation:"
echo "  Disaster Recovery Plan: ${PROJECT_ROOT}/scripts/disaster-recovery/disaster-recovery-plan.md"
echo "  Backup logs: ${PROJECT_ROOT}/logs/"
echo ""
echo "=============================="
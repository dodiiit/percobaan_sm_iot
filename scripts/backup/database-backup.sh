#!/bin/bash

# IndoWater Database Backup Script
# This script creates automated backups of the MySQL database with rotation

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/database"
LOG_FILE="${PROJECT_ROOT}/logs/backup.log"

# Load environment variables
if [ -f "${PROJECT_ROOT}/api/.env" ]; then
    source "${PROJECT_ROOT}/api/.env"
else
    echo "Error: .env file not found at ${PROJECT_ROOT}/api/.env"
    exit 1
fi

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_DATABASE:-indowater}"
DB_USER="${DB_USERNAME:-indowater}"
DB_PASS="${DB_PASSWORD}"

# Backup configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/indowater_backup_${TIMESTAMP}.sql"
COMPRESSED_BACKUP="${BACKUP_FILE}.gz"

# Retention settings (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=30
MONTHLY_RETENTION=365

# Create necessary directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if mysqldump is available
if ! command -v mysqldump &> /dev/null; then
    error_exit "mysqldump command not found. Please install MySQL client tools."
fi

# Check if gzip is available
if ! command -v gzip &> /dev/null; then
    error_exit "gzip command not found. Please install gzip."
fi

# Validate database connection
log "Testing database connection..."
if ! mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT 1;" "${DB_NAME}" &>/dev/null; then
    error_exit "Cannot connect to database. Please check your credentials."
fi

log "Starting database backup for ${DB_NAME}..."

# Create database backup
log "Creating backup: ${BACKUP_FILE}"
mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-database \
    --add-drop-table \
    --create-options \
    --disable-keys \
    --extended-insert \
    --quick \
    --lock-tables=false \
    --databases "${DB_NAME}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    log "Database backup created successfully"
else
    error_exit "Failed to create database backup"
fi

# Compress the backup
log "Compressing backup..."
gzip "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    log "Backup compressed successfully: ${COMPRESSED_BACKUP}"
    BACKUP_SIZE=$(du -h "${COMPRESSED_BACKUP}" | cut -f1)
    log "Backup size: ${BACKUP_SIZE}"
else
    error_exit "Failed to compress backup"
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gzip -t "${COMPRESSED_BACKUP}"; then
    log "Backup integrity verified"
else
    error_exit "Backup integrity check failed"
fi

# Cleanup old backups based on retention policy
cleanup_backups() {
    local retention_days=$1
    local pattern=$2
    
    log "Cleaning up backups older than ${retention_days} days (pattern: ${pattern})"
    
    find "${BACKUP_DIR}" -name "${pattern}" -type f -mtime +${retention_days} -delete
    
    local deleted_count=$(find "${BACKUP_DIR}" -name "${pattern}" -type f -mtime +${retention_days} | wc -l)
    if [ ${deleted_count} -gt 0 ]; then
        log "Deleted ${deleted_count} old backup files"
    fi
}

# Apply retention policy
log "Applying retention policy..."
cleanup_backups ${DAILY_RETENTION} "indowater_backup_*.sql.gz"

# Create weekly and monthly backups
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

if [ "${DAY_OF_WEEK}" -eq 7 ]; then  # Sunday
    WEEKLY_BACKUP="${BACKUP_DIR}/weekly/indowater_weekly_${TIMESTAMP}.sql.gz"
    mkdir -p "${BACKUP_DIR}/weekly"
    cp "${COMPRESSED_BACKUP}" "${WEEKLY_BACKUP}"
    log "Weekly backup created: ${WEEKLY_BACKUP}"
    
    # Cleanup old weekly backups
    cleanup_backups ${WEEKLY_RETENTION} "weekly/indowater_weekly_*.sql.gz"
fi

if [ "${DAY_OF_MONTH}" -eq "01" ]; then  # First day of month
    MONTHLY_BACKUP="${BACKUP_DIR}/monthly/indowater_monthly_${TIMESTAMP}.sql.gz"
    mkdir -p "${BACKUP_DIR}/monthly"
    cp "${COMPRESSED_BACKUP}" "${MONTHLY_BACKUP}"
    log "Monthly backup created: ${MONTHLY_BACKUP}"
    
    # Cleanup old monthly backups
    cleanup_backups ${MONTHLY_RETENTION} "monthly/indowater_monthly_*.sql.gz"
fi

# Send notification (if configured)
if [ -n "${BACKUP_NOTIFICATION_EMAIL}" ]; then
    SUBJECT="IndoWater Database Backup Completed - $(date '+%Y-%m-%d')"
    BODY="Database backup completed successfully.

Backup Details:
- Database: ${DB_NAME}
- Timestamp: ${TIMESTAMP}
- File: ${COMPRESSED_BACKUP}
- Size: ${BACKUP_SIZE}
- Host: $(hostname)

Backup location: ${COMPRESSED_BACKUP}"

    echo "${BODY}" | mail -s "${SUBJECT}" "${BACKUP_NOTIFICATION_EMAIL}"
    log "Notification sent to ${BACKUP_NOTIFICATION_EMAIL}"
fi

# Upload to cloud storage (if configured)
if [ -n "${AWS_S3_BACKUP_BUCKET}" ] && command -v aws &> /dev/null; then
    log "Uploading backup to AWS S3..."
    S3_KEY="database-backups/$(basename "${COMPRESSED_BACKUP}")"
    
    if aws s3 cp "${COMPRESSED_BACKUP}" "s3://${AWS_S3_BACKUP_BUCKET}/${S3_KEY}"; then
        log "Backup uploaded to S3: s3://${AWS_S3_BACKUP_BUCKET}/${S3_KEY}"
    else
        log "WARNING: Failed to upload backup to S3"
    fi
fi

log "Database backup completed successfully"
log "----------------------------------------"

# Display backup summary
echo ""
echo "=== Backup Summary ==="
echo "Database: ${DB_NAME}"
echo "Backup File: ${COMPRESSED_BACKUP}"
echo "Backup Size: ${BACKUP_SIZE}"
echo "Timestamp: ${TIMESTAMP}"
echo "======================"
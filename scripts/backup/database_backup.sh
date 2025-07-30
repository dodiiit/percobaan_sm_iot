#!/bin/bash
# IndoWater Database Backup Script
# This script creates a backup of the IndoWater database and stores it in a specified location
# It also manages backup rotation and can upload backups to a remote storage

# Load environment variables from .env file
if [ -f "/path/to/indowater/.env" ]; then
    source "/path/to/indowater/.env"
else
    echo "Error: .env file not found"
    exit 1
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/indowater/database}"
REMOTE_BACKUP_DIR="${REMOTE_BACKUP_DIR:-/mnt/backup-storage/indowater/database}"
S3_BUCKET="${S3_BUCKET:-indowater-backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_RETENTION_WEEKS="${BACKUP_RETENTION_WEEKS:-12}"
BACKUP_RETENTION_MONTHS="${BACKUP_RETENTION_MONTHS:-24}"

# Database credentials from .env
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-indowater}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"

# Create backup directories if they don't exist
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"

# Get current date and time
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H-%M-%S")
DAY_OF_WEEK=$(date +"%u")
DAY_OF_MONTH=$(date +"%d")

# Determine backup type (daily, weekly, monthly)
if [ "$DAY_OF_MONTH" = "01" ]; then
    BACKUP_TYPE="monthly"
    BACKUP_SUBDIR="monthly"
elif [ "$DAY_OF_WEEK" = "7" ]; then
    BACKUP_TYPE="weekly"
    BACKUP_SUBDIR="weekly"
else
    BACKUP_TYPE="daily"
    BACKUP_SUBDIR="daily"
fi

# Set backup filename
BACKUP_FILENAME="${DB_NAME}_${BACKUP_TYPE}_${DATE}_${TIME}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_SUBDIR}/${BACKUP_FILENAME}"

# Log file
LOG_FILE="${BACKUP_DIR}/backup_log.txt"

# Function to log messages
log_message() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> "$LOG_FILE"
    echo "$1"
}

# Start backup process
log_message "Starting ${BACKUP_TYPE} backup of ${DB_NAME} database"

# Create database backup
if mysqldump --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASSWORD" \
    --single-transaction --quick --lock-tables=false "$DB_NAME" | gzip > "$BACKUP_PATH"; then
    log_message "Database backup completed successfully: $BACKUP_PATH"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log_message "Backup size: $BACKUP_SIZE"
else
    log_message "Error: Database backup failed"
    exit 1
fi

# Copy backup to remote storage if configured
if [ -d "$REMOTE_BACKUP_DIR" ]; then
    log_message "Copying backup to remote storage"
    mkdir -p "${REMOTE_BACKUP_DIR}/${BACKUP_SUBDIR}"
    
    if cp "$BACKUP_PATH" "${REMOTE_BACKUP_DIR}/${BACKUP_SUBDIR}/"; then
        log_message "Backup copied to remote storage: ${REMOTE_BACKUP_DIR}/${BACKUP_SUBDIR}/${BACKUP_FILENAME}"
    else
        log_message "Error: Failed to copy backup to remote storage"
    fi
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    log_message "Uploading backup to S3"
    
    if aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/${BACKUP_SUBDIR}/${BACKUP_FILENAME}"; then
        log_message "Backup uploaded to S3: s3://${S3_BUCKET}/${BACKUP_SUBDIR}/${BACKUP_FILENAME}"
    else
        log_message "Error: Failed to upload backup to S3"
    fi
fi

# Cleanup old backups
log_message "Cleaning up old backups"

# Remove old daily backups
find "${BACKUP_DIR}/daily" -name "${DB_NAME}_daily_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete
# Remove old weekly backups
find "${BACKUP_DIR}/weekly" -name "${DB_NAME}_weekly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_WEEKS * 7)) -delete
# Remove old monthly backups
find "${BACKUP_DIR}/monthly" -name "${DB_NAME}_monthly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_MONTHS * 30)) -delete

# Also clean up remote storage if configured
if [ -d "$REMOTE_BACKUP_DIR" ]; then
    find "${REMOTE_BACKUP_DIR}/daily" -name "${DB_NAME}_daily_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete
    find "${REMOTE_BACKUP_DIR}/weekly" -name "${DB_NAME}_weekly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_WEEKS * 7)) -delete
    find "${REMOTE_BACKUP_DIR}/monthly" -name "${DB_NAME}_monthly_*.sql.gz" -type f -mtime +$((BACKUP_RETENTION_MONTHS * 30)) -delete
fi

# Clean up S3 if configured
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    # List and delete old daily backups
    aws s3 ls "s3://${S3_BUCKET}/daily/" --recursive | grep "${DB_NAME}_daily_" | sort | head -n -${BACKUP_RETENTION_DAYS} | 
    while read -r line; do
        filename=$(echo "$line" | awk '{print $4}')
        aws s3 rm "s3://${S3_BUCKET}/$filename"
    done
    
    # List and delete old weekly backups
    aws s3 ls "s3://${S3_BUCKET}/weekly/" --recursive | grep "${DB_NAME}_weekly_" | sort | head -n -${BACKUP_RETENTION_WEEKS} | 
    while read -r line; do
        filename=$(echo "$line" | awk '{print $4}')
        aws s3 rm "s3://${S3_BUCKET}/$filename"
    done
    
    # List and delete old monthly backups
    aws s3 ls "s3://${S3_BUCKET}/monthly/" --recursive | grep "${DB_NAME}_monthly_" | sort | head -n -${BACKUP_RETENTION_MONTHS} | 
    while read -r line; do
        filename=$(echo "$line" | awk '{print $4}')
        aws s3 rm "s3://${S3_BUCKET}/$filename"
    done
fi

log_message "Backup process completed"
exit 0
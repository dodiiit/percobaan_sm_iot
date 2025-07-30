#!/bin/bash

# IndoWater Full System Backup Script
# This script creates a complete backup of the entire system

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/logs/full-backup.log"

# Backup configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FULL_BACKUP_DIR="${BACKUP_ROOT}/full-system/${TIMESTAMP}"

# Create necessary directories
mkdir -p "${FULL_BACKUP_DIR}"
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

log "Starting full system backup..."
log "Backup directory: ${FULL_BACKUP_DIR}"

# 1. Database Backup
log "Creating database backup..."
if [ -f "${SCRIPT_DIR}/database-backup.sh" ]; then
    bash "${SCRIPT_DIR}/database-backup.sh"
    
    # Copy latest database backup to full backup directory
    LATEST_DB_BACKUP=$(find "${BACKUP_ROOT}/database" -name "indowater_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "${LATEST_DB_BACKUP}" ]; then
        cp "${LATEST_DB_BACKUP}" "${FULL_BACKUP_DIR}/"
        log "Database backup included: $(basename "${LATEST_DB_BACKUP}")"
    fi
else
    log "WARNING: Database backup script not found"
fi

# 2. Redis Backup
log "Creating Redis backup..."
if [ -f "${SCRIPT_DIR}/redis-backup.sh" ]; then
    bash "${SCRIPT_DIR}/redis-backup.sh"
    
    # Copy latest Redis backup to full backup directory
    LATEST_REDIS_BACKUP=$(find "${BACKUP_ROOT}/redis" -name "redis_backup_*.rdb.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "${LATEST_REDIS_BACKUP}" ]; then
        cp "${LATEST_REDIS_BACKUP}" "${FULL_BACKUP_DIR}/"
        log "Redis backup included: $(basename "${LATEST_REDIS_BACKUP}")"
    fi
else
    log "WARNING: Redis backup script not found"
fi

# 3. Application Files Backup
log "Creating application files backup..."
APP_BACKUP_FILE="${FULL_BACKUP_DIR}/application_files_${TIMESTAMP}.tar.gz"

# Exclude unnecessary files and directories
EXCLUDE_PATTERNS=(
    "--exclude=node_modules"
    "--exclude=vendor"
    "--exclude=.git"
    "--exclude=backups"
    "--exclude=logs"
    "--exclude=storage/cache"
    "--exclude=storage/sessions"
    "--exclude=storage/tmp"
    "--exclude=*.log"
    "--exclude=.env"
    "--exclude=.DS_Store"
    "--exclude=Thumbs.db"
)

tar czf "${APP_BACKUP_FILE}" \
    "${EXCLUDE_PATTERNS[@]}" \
    -C "${PROJECT_ROOT}" \
    api frontend mobile scripts docker-compose.yml README.md

if [ $? -eq 0 ]; then
    APP_BACKUP_SIZE=$(du -h "${APP_BACKUP_FILE}" | cut -f1)
    log "Application files backup created: ${APP_BACKUP_FILE} (${APP_BACKUP_SIZE})"
else
    error_exit "Failed to create application files backup"
fi

# 4. Configuration Files Backup
log "Creating configuration backup..."
CONFIG_BACKUP_DIR="${FULL_BACKUP_DIR}/config"
mkdir -p "${CONFIG_BACKUP_DIR}"

# Copy configuration files (excluding sensitive data)
if [ -f "${PROJECT_ROOT}/api/.env.example" ]; then
    cp "${PROJECT_ROOT}/api/.env.example" "${CONFIG_BACKUP_DIR}/"
fi

if [ -f "${PROJECT_ROOT}/frontend/.env.example" ]; then
    cp "${PROJECT_ROOT}/frontend/.env.example" "${CONFIG_BACKUP_DIR}/"
fi

if [ -f "${PROJECT_ROOT}/docker-compose.yml" ]; then
    cp "${PROJECT_ROOT}/docker-compose.yml" "${CONFIG_BACKUP_DIR}/"
fi

# Copy any custom configuration files
find "${PROJECT_ROOT}" -name "*.conf" -o -name "*.ini" -o -name "*.yaml" -o -name "*.yml" | \
    grep -v node_modules | grep -v vendor | grep -v .git | \
    xargs -I {} cp {} "${CONFIG_BACKUP_DIR}/" 2>/dev/null || true

log "Configuration files backed up to: ${CONFIG_BACKUP_DIR}"

# 5. Logs Backup (last 30 days)
log "Creating logs backup..."
LOGS_BACKUP_DIR="${FULL_BACKUP_DIR}/logs"
mkdir -p "${LOGS_BACKUP_DIR}"

if [ -d "${PROJECT_ROOT}/logs" ]; then
    find "${PROJECT_ROOT}/logs" -name "*.log" -mtime -30 -exec cp {} "${LOGS_BACKUP_DIR}/" \;
    log "Recent logs backed up to: ${LOGS_BACKUP_DIR}"
fi

# 6. Create backup manifest
log "Creating backup manifest..."
MANIFEST_FILE="${FULL_BACKUP_DIR}/backup_manifest.txt"

cat > "${MANIFEST_FILE}" << EOF
IndoWater Full System Backup Manifest
=====================================

Backup Date: $(date)
Backup Directory: ${FULL_BACKUP_DIR}
Hostname: $(hostname)
System: $(uname -a)

Backup Contents:
EOF

# List all files in backup with sizes
find "${FULL_BACKUP_DIR}" -type f -exec ls -lh {} \; | awk '{print $9 " (" $5 ")"}' >> "${MANIFEST_FILE}"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "${FULL_BACKUP_DIR}" | cut -f1)
echo "" >> "${MANIFEST_FILE}"
echo "Total Backup Size: ${TOTAL_SIZE}" >> "${MANIFEST_FILE}"

log "Backup manifest created: ${MANIFEST_FILE}"

# 7. Create compressed archive of full backup
log "Creating compressed archive of full backup..."
ARCHIVE_FILE="${BACKUP_ROOT}/full-system-backup_${TIMESTAMP}.tar.gz"

tar czf "${ARCHIVE_FILE}" -C "${BACKUP_ROOT}/full-system" "${TIMESTAMP}"

if [ $? -eq 0 ]; then
    ARCHIVE_SIZE=$(du -h "${ARCHIVE_FILE}" | cut -f1)
    log "Full system backup archive created: ${ARCHIVE_FILE} (${ARCHIVE_SIZE})"
    
    # Remove the uncompressed directory to save space
    rm -rf "${FULL_BACKUP_DIR}"
    log "Temporary backup directory cleaned up"
else
    error_exit "Failed to create backup archive"
fi

# 8. Upload to cloud storage (if configured)
if [ -n "${AWS_S3_BACKUP_BUCKET}" ] && command -v aws &> /dev/null; then
    log "Uploading full backup to AWS S3..."
    S3_KEY="full-system-backups/$(basename "${ARCHIVE_FILE}")"
    
    if aws s3 cp "${ARCHIVE_FILE}" "s3://${AWS_S3_BACKUP_BUCKET}/${S3_KEY}"; then
        log "Full backup uploaded to S3: s3://${AWS_S3_BACKUP_BUCKET}/${S3_KEY}"
    else
        log "WARNING: Failed to upload full backup to S3"
    fi
fi

# 9. Cleanup old full backups (keep last 5)
log "Cleaning up old full system backups..."
cd "${BACKUP_ROOT}"
ls -t full-system-backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
log "Old full system backups cleaned up"

# 10. Send notification
if [ -n "${BACKUP_NOTIFICATION_EMAIL}" ]; then
    SUBJECT="IndoWater Full System Backup Completed - $(date '+%Y-%m-%d')"
    BODY="Full system backup completed successfully.

Backup Details:
- Timestamp: ${TIMESTAMP}
- Archive File: ${ARCHIVE_FILE}
- Archive Size: ${ARCHIVE_SIZE}
- Total Size: ${TOTAL_SIZE}
- Host: $(hostname)

Backup includes:
- Database backup
- Redis backup
- Application files
- Configuration files
- Recent logs (30 days)

Archive location: ${ARCHIVE_FILE}"

    echo "${BODY}" | mail -s "${SUBJECT}" "${BACKUP_NOTIFICATION_EMAIL}"
    log "Notification sent to ${BACKUP_NOTIFICATION_EMAIL}"
fi

log "Full system backup completed successfully"
log "=========================================="

# Display backup summary
echo ""
echo "=== Full System Backup Summary ==="
echo "Timestamp: ${TIMESTAMP}"
echo "Archive File: ${ARCHIVE_FILE}"
echo "Archive Size: ${ARCHIVE_SIZE}"
echo "Total Backup Size: ${TOTAL_SIZE}"
echo "=================================="
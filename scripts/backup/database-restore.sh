#!/bin/bash

# IndoWater Database Restore Script
# This script restores the MySQL database from a backup file

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/database"
LOG_FILE="${PROJECT_ROOT}/logs/restore.log"

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

# Create necessary directories
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

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS] <backup_file>"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -l, --list              List available backup files"
    echo "  -f, --force             Force restore without confirmation"
    echo "  -c, --create-db         Create database if it doesn't exist"
    echo ""
    echo "Examples:"
    echo "  $0 indowater_backup_20250730_120000.sql.gz"
    echo "  $0 --list"
    echo "  $0 --force backup.sql.gz"
    exit 1
}

# List available backups
list_backups() {
    echo "Available backup files in ${BACKUP_DIR}:"
    echo ""
    
    if [ -d "${BACKUP_DIR}" ]; then
        find "${BACKUP_DIR}" -name "*.sql.gz" -o -name "*.sql" | sort -r | while read -r backup_file; do
            if [ -f "${backup_file}" ]; then
                size=$(du -h "${backup_file}" | cut -f1)
                date=$(stat -c %y "${backup_file}" | cut -d' ' -f1,2 | cut -d'.' -f1)
                echo "  $(basename "${backup_file}") (${size}, ${date})"
            fi
        done
    else
        echo "  No backup directory found: ${BACKUP_DIR}"
    fi
    echo ""
}

# Parse command line arguments
FORCE_RESTORE=false
CREATE_DB=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -f|--force)
            FORCE_RESTORE=true
            shift
            ;;
        -c|--create-db)
            CREATE_DB=true
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            usage
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Check if backup file is provided
if [ -z "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not specified"
    echo ""
    list_backups
    usage
fi

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    # Try to find the file in backup directory
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        error_exit "Backup file not found: ${BACKUP_FILE}"
    fi
fi

# Check if mysql is available
if ! command -v mysql &> /dev/null; then
    error_exit "mysql command not found. Please install MySQL client tools."
fi

# Validate database connection
log "Testing database connection..."
if ! mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT 1;" &>/dev/null; then
    error_exit "Cannot connect to database server. Please check your credentials."
fi

# Create database if requested
if [ "${CREATE_DB}" = true ]; then
    log "Creating database ${DB_NAME} if it doesn't exist..."
    mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"
fi

# Check if database exists
if ! mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "USE \`${DB_NAME}\`;" &>/dev/null; then
    error_exit "Database ${DB_NAME} does not exist. Use --create-db option to create it."
fi

# Get backup file info
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
BACKUP_DATE=$(stat -c %y "${BACKUP_FILE}" | cut -d' ' -f1,2 | cut -d'.' -f1)

# Confirmation prompt
if [ "${FORCE_RESTORE}" = false ]; then
    echo ""
    echo "=== RESTORE CONFIRMATION ==="
    echo "Database: ${DB_NAME}"
    echo "Host: ${DB_HOST}:${DB_PORT}"
    echo "Backup File: ${BACKUP_FILE}"
    echo "Backup Size: ${BACKUP_SIZE}"
    echo "Backup Date: ${BACKUP_DATE}"
    echo ""
    echo "WARNING: This will COMPLETELY REPLACE the current database!"
    echo "All existing data will be lost."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
fi

log "Starting database restore for ${DB_NAME}..."
log "Backup file: ${BACKUP_FILE}"
log "Backup size: ${BACKUP_SIZE}"

# Create a backup of current database before restore
CURRENT_BACKUP="${BACKUP_DIR}/pre-restore-backup_$(date +"%Y%m%d_%H%M%S").sql.gz"
log "Creating backup of current database before restore..."

mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases "${DB_NAME}" | gzip > "${CURRENT_BACKUP}"

if [ $? -eq 0 ]; then
    log "Current database backed up to: ${CURRENT_BACKUP}"
else
    log "WARNING: Failed to backup current database"
fi

# Determine if backup file is compressed
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    RESTORE_COMMAND="zcat '${BACKUP_FILE}' | mysql -h'${DB_HOST}' -P'${DB_PORT}' -u'${DB_USER}' -p'${DB_PASS}'"
else
    RESTORE_COMMAND="mysql -h'${DB_HOST}' -P'${DB_PORT}' -u'${DB_USER}' -p'${DB_PASS}' < '${BACKUP_FILE}'"
fi

# Perform the restore
log "Restoring database from backup..."
START_TIME=$(date +%s)

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    zcat "${BACKUP_FILE}" | mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}"
else
    mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" < "${BACKUP_FILE}"
fi

RESTORE_EXIT_CODE=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ ${RESTORE_EXIT_CODE} -eq 0 ]; then
    log "Database restore completed successfully in ${DURATION} seconds"
else
    error_exit "Database restore failed with exit code ${RESTORE_EXIT_CODE}"
fi

# Verify restore
log "Verifying database restore..."
TABLE_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${DB_NAME}';" -s -N)

if [ "${TABLE_COUNT}" -gt 0 ]; then
    log "Verification successful: ${TABLE_COUNT} tables found in database"
else
    log "WARNING: No tables found in database after restore"
fi

# Send notification (if configured)
if [ -n "${RESTORE_NOTIFICATION_EMAIL}" ]; then
    SUBJECT="IndoWater Database Restore Completed - $(date '+%Y-%m-%d')"
    BODY="Database restore completed successfully.

Restore Details:
- Database: ${DB_NAME}
- Backup File: ${BACKUP_FILE}
- Backup Size: ${BACKUP_SIZE}
- Duration: ${DURATION} seconds
- Tables Restored: ${TABLE_COUNT}
- Host: $(hostname)

Pre-restore backup: ${CURRENT_BACKUP}"

    echo "${BODY}" | mail -s "${SUBJECT}" "${RESTORE_NOTIFICATION_EMAIL}"
    log "Notification sent to ${RESTORE_NOTIFICATION_EMAIL}"
fi

log "Database restore completed successfully"
log "----------------------------------------"

# Display restore summary
echo ""
echo "=== Restore Summary ==="
echo "Database: ${DB_NAME}"
echo "Backup File: ${BACKUP_FILE}"
echo "Backup Size: ${BACKUP_SIZE}"
echo "Duration: ${DURATION} seconds"
echo "Tables Restored: ${TABLE_COUNT}"
echo "Pre-restore Backup: ${CURRENT_BACKUP}"
echo "======================"
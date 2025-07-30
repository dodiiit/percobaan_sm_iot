#!/bin/bash

# IndoWater Redis Restore Script
# This script restores Redis data from a backup file

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/redis"
LOG_FILE="${PROJECT_ROOT}/logs/redis-restore.log"

# Load environment variables
if [ -f "${PROJECT_ROOT}/api/.env" ]; then
    source "${PROJECT_ROOT}/api/.env"
fi

# Redis configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

# Create log directory
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
    echo ""
    echo "Examples:"
    echo "  $0 redis_backup_20250730_120000.rdb.gz"
    echo "  $0 --list"
    echo "  $0 --force backup.rdb.gz"
    exit 1
}

# List available backups
list_backups() {
    echo "Available Redis backup files in ${BACKUP_DIR}:"
    echo ""
    
    if [ -d "${BACKUP_DIR}" ]; then
        find "${BACKUP_DIR}" -name "*.rdb.gz" -o -name "*.rdb" | sort -r | while read -r backup_file; do
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

# Check if redis-cli is available
if ! command -v redis-cli &> /dev/null; then
    error_exit "redis-cli command not found. Please install Redis client tools."
fi

# Test Redis connection
log "Testing Redis connection..."
REDIS_CMD="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT}"
if [ -n "${REDIS_PASSWORD}" ]; then
    REDIS_CMD="${REDIS_CMD} -a ${REDIS_PASSWORD}"
fi

if ! ${REDIS_CMD} ping &>/dev/null; then
    error_exit "Cannot connect to Redis server at ${REDIS_HOST}:${REDIS_PORT}"
fi

# Get backup file info
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
BACKUP_DATE=$(stat -c %y "${BACKUP_FILE}" | cut -d' ' -f1,2 | cut -d'.' -f1)

# Confirmation prompt
if [ "${FORCE_RESTORE}" = false ]; then
    echo ""
    echo "=== REDIS RESTORE CONFIRMATION ==="
    echo "Redis Server: ${REDIS_HOST}:${REDIS_PORT}"
    echo "Backup File: ${BACKUP_FILE}"
    echo "Backup Size: ${BACKUP_SIZE}"
    echo "Backup Date: ${BACKUP_DATE}"
    echo ""
    echo "WARNING: This will FLUSH all current Redis data!"
    echo "All existing cache and session data will be lost."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
fi

log "Starting Redis restore..."
log "Backup file: ${BACKUP_FILE}"
log "Backup size: ${BACKUP_SIZE}"

# Create a backup of current Redis data
log "Creating backup of current Redis data..."
CURRENT_BACKUP="${BACKUP_DIR}/pre-restore-redis_$(date +"%Y%m%d_%H%M%S").rdb"

# Save current Redis data
${REDIS_CMD} BGSAVE
sleep 2  # Wait for background save to complete

# Get Redis data directory and copy current dump
REDIS_DATA_DIR=$(${REDIS_CMD} CONFIG GET dir | tail -1)
CURRENT_RDB="${REDIS_DATA_DIR}/dump.rdb"

if [ -f "${CURRENT_RDB}" ]; then
    cp "${CURRENT_RDB}" "${CURRENT_BACKUP}"
    log "Current Redis data backed up to: ${CURRENT_BACKUP}"
else
    log "WARNING: Could not backup current Redis data"
fi

# Stop Redis to perform restore
log "Stopping Redis service for restore..."
if command -v docker-compose &> /dev/null && [ -f "${PROJECT_ROOT}/docker-compose.yml" ]; then
    cd "${PROJECT_ROOT}"
    docker-compose stop redis
    REDIS_STOPPED_BY_SCRIPT=true
else
    log "WARNING: Could not stop Redis service automatically. Please stop Redis manually."
    read -p "Press Enter when Redis is stopped..."
fi

# Prepare backup file for restore
TEMP_RDB="/tmp/redis_restore_$(date +%s).rdb"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    log "Decompressing backup file..."
    zcat "${BACKUP_FILE}" > "${TEMP_RDB}"
else
    cp "${BACKUP_FILE}" "${TEMP_RDB}"
fi

# Replace Redis dump file
log "Replacing Redis dump file..."
if [ -f "${CURRENT_RDB}" ]; then
    mv "${CURRENT_RDB}" "${CURRENT_RDB}.backup"
fi

cp "${TEMP_RDB}" "${CURRENT_RDB}"
chown redis:redis "${CURRENT_RDB}" 2>/dev/null || true
chmod 660 "${CURRENT_RDB}" 2>/dev/null || true

# Clean up temporary file
rm -f "${TEMP_RDB}"

# Start Redis service
log "Starting Redis service..."
if [ "${REDIS_STOPPED_BY_SCRIPT}" = true ]; then
    cd "${PROJECT_ROOT}"
    docker-compose start redis
    
    # Wait for Redis to start
    log "Waiting for Redis to start..."
    for i in {1..30}; do
        if ${REDIS_CMD} ping &>/dev/null; then
            log "Redis started successfully"
            break
        fi
        sleep 1
    done
    
    if ! ${REDIS_CMD} ping &>/dev/null; then
        error_exit "Redis failed to start after restore"
    fi
else
    log "Please start Redis service manually"
    read -p "Press Enter when Redis is started..."
fi

# Verify restore
log "Verifying Redis restore..."
KEY_COUNT=$(${REDIS_CMD} DBSIZE)
REDIS_INFO=$(${REDIS_CMD} INFO server | grep "redis_version" | cut -d: -f2 | tr -d '\r')

log "Verification results:"
log "- Redis version: ${REDIS_INFO}"
log "- Keys restored: ${KEY_COUNT}"

if [ "${KEY_COUNT}" -gt 0 ]; then
    log "✓ Redis restore completed successfully"
else
    log "⚠ Warning: No keys found in restored Redis database"
fi

# Send notification (if configured)
if [ -n "${RESTORE_NOTIFICATION_EMAIL}" ]; then
    SUBJECT="IndoWater Redis Restore Completed - $(date '+%Y-%m-%d')"
    BODY="Redis restore completed successfully.

Restore Details:
- Redis Server: ${REDIS_HOST}:${REDIS_PORT}
- Backup File: ${BACKUP_FILE}
- Backup Size: ${BACKUP_SIZE}
- Keys Restored: ${KEY_COUNT}
- Host: $(hostname)

Pre-restore backup: ${CURRENT_BACKUP}"

    echo "${BODY}" | mail -s "${SUBJECT}" "${RESTORE_NOTIFICATION_EMAIL}"
    log "Notification sent to ${RESTORE_NOTIFICATION_EMAIL}"
fi

log "Redis restore completed successfully"
log "===================================="

# Display restore summary
echo ""
echo "=== Redis Restore Summary ==="
echo "Redis Server: ${REDIS_HOST}:${REDIS_PORT}"
echo "Backup File: ${BACKUP_FILE}"
echo "Backup Size: ${BACKUP_SIZE}"
echo "Keys Restored: ${KEY_COUNT}"
echo "Pre-restore Backup: ${CURRENT_BACKUP}"
echo "============================="
#!/bin/bash

# IndoWater Redis Backup Script
# This script creates automated backups of Redis data

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/redis"
LOG_FILE="${PROJECT_ROOT}/logs/redis-backup.log"

# Load environment variables
if [ -f "${PROJECT_ROOT}/api/.env" ]; then
    source "${PROJECT_ROOT}/api/.env"
fi

# Redis configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

# Backup configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/redis_backup_${TIMESTAMP}.rdb"
COMPRESSED_BACKUP="${BACKUP_FILE}.gz"

# Retention settings (days)
RETENTION_DAYS=30

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

log "Starting Redis backup..."

# Create Redis backup using BGSAVE
log "Initiating background save..."
${REDIS_CMD} BGSAVE

# Wait for background save to complete
log "Waiting for background save to complete..."
while [ "$(${REDIS_CMD} LASTSAVE)" = "$(${REDIS_CMD} LASTSAVE)" ]; do
    sleep 1
done

# Get Redis data directory
REDIS_DATA_DIR=$(${REDIS_CMD} CONFIG GET dir | tail -1)
REDIS_RDB_FILE="${REDIS_DATA_DIR}/dump.rdb"

# Copy the RDB file to backup location
if [ -f "${REDIS_RDB_FILE}" ]; then
    cp "${REDIS_RDB_FILE}" "${BACKUP_FILE}"
    log "Redis backup created: ${BACKUP_FILE}"
else
    error_exit "Redis RDB file not found: ${REDIS_RDB_FILE}"
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

# Cleanup old backups
log "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "redis_backup_*.rdb.gz" -type f -mtime +${RETENTION_DAYS} -delete

log "Redis backup completed successfully"
#!/bin/bash
# IndoWater Backup Restoration Script
# This script restores database and file backups in case of a disaster

# Load environment variables from .env file
if [ -f "/path/to/indowater/.env" ]; then
    source "/path/to/indowater/.env"
else
    echo "Error: .env file not found"
    exit 1
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/indowater}"
DB_BACKUP_DIR="${BACKUP_DIR}/database"
FILE_BACKUP_DIR="${BACKUP_DIR}/files"
APP_DIR="${APP_DIR:-/var/www/indowater}"
RESTORE_LOG="${BACKUP_DIR}/restore_log.txt"

# Database credentials from .env
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-indowater}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"

# Function to log messages
log_message() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> "$RESTORE_LOG"
    echo "$1"
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Restore IndoWater backups"
    echo ""
    echo "Options:"
    echo "  -d, --database BACKUP_FILE    Restore database from specific backup file"
    echo "  -f, --files BACKUP_FILE       Restore files from specific backup file"
    echo "  --latest-db                   Restore database from latest backup"
    echo "  --latest-files                Restore files from latest backup"
    echo "  -h, --help                    Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --latest-db --latest-files"
    echo "  $0 -d /path/to/database_backup.sql.gz -f /path/to/files_backup.tar.gz"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--database)
            DB_BACKUP_FILE="$2"
            shift 2
            ;;
        -f|--files)
            FILE_BACKUP_FILE="$2"
            shift 2
            ;;
        --latest-db)
            LATEST_DB=true
            shift
            ;;
        --latest-files)
            LATEST_FILES=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check if at least one restore option is specified
if [ -z "$DB_BACKUP_FILE" ] && [ -z "$FILE_BACKUP_FILE" ] && [ -z "$LATEST_DB" ] && [ -z "$LATEST_FILES" ]; then
    echo "Error: No restore option specified"
    usage
    exit 1
fi

# Start restoration process
log_message "Starting backup restoration process"

# Find the latest database backup if requested
if [ "$LATEST_DB" = true ]; then
    DB_BACKUP_FILE=$(find "$DB_BACKUP_DIR" -type f -name "*.sql.gz" -print0 | xargs -0 ls -t | head -n1)
    if [ -z "$DB_BACKUP_FILE" ]; then
        log_message "Error: No database backup found"
        exit 1
    fi
    log_message "Using latest database backup: $DB_BACKUP_FILE"
fi

# Find the latest file backup if requested
if [ "$LATEST_FILES" = true ]; then
    FILE_BACKUP_FILE=$(find "$FILE_BACKUP_DIR" -type f -name "*.tar.gz" -print0 | xargs -0 ls -t | head -n1)
    if [ -z "$FILE_BACKUP_FILE" ]; then
        log_message "Error: No file backup found"
        exit 1
    fi
    log_message "Using latest file backup: $FILE_BACKUP_FILE"
fi

# Restore database if specified
if [ -n "$DB_BACKUP_FILE" ]; then
    log_message "Restoring database from backup: $DB_BACKUP_FILE"
    
    # Check if file exists
    if [ ! -f "$DB_BACKUP_FILE" ]; then
        log_message "Error: Database backup file does not exist: $DB_BACKUP_FILE"
        exit 1
    fi
    
    # Create a temporary directory
    TEMP_DIR=$(mktemp -d)
    
    # Decompress the backup file
    log_message "Decompressing database backup file"
    if ! gunzip -c "$DB_BACKUP_FILE" > "${TEMP_DIR}/backup.sql"; then
        log_message "Error: Failed to decompress database backup file"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Restore the database
    log_message "Restoring database"
    if mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASSWORD" "$DB_NAME" < "${TEMP_DIR}/backup.sql"; then
        log_message "Database restoration completed successfully"
    else
        log_message "Error: Database restoration failed"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Clean up
    rm -rf "$TEMP_DIR"
fi

# Restore files if specified
if [ -n "$FILE_BACKUP_FILE" ]; then
    log_message "Restoring files from backup: $FILE_BACKUP_FILE"
    
    # Check if file exists
    if [ ! -f "$FILE_BACKUP_FILE" ]; then
        log_message "Error: File backup file does not exist: $FILE_BACKUP_FILE"
        exit 1
    fi
    
    # Create a backup of current files
    CURRENT_BACKUP="${APP_DIR}_pre_restore_$(date +"%Y-%m-%d_%H-%M-%S")"
    log_message "Creating backup of current files: $CURRENT_BACKUP"
    if ! cp -a "$APP_DIR" "$CURRENT_BACKUP"; then
        log_message "Warning: Failed to create backup of current files"
    fi
    
    # Restore the files
    log_message "Restoring files"
    if tar -xzf "$FILE_BACKUP_FILE" -C "$(dirname "$APP_DIR")"; then
        log_message "File restoration completed successfully"
    else
        log_message "Error: File restoration failed"
        exit 1
    fi
    
    # Fix permissions
    log_message "Fixing file permissions"
    find "$APP_DIR" -type f -exec chmod 644 {} \;
    find "$APP_DIR" -type d -exec chmod 755 {} \;
    
    # Set proper ownership (adjust as needed)
    if [ -n "$WEB_USER" ]; then
        log_message "Setting file ownership to $WEB_USER"
        chown -R "$WEB_USER:$WEB_USER" "$APP_DIR"
    fi
fi

log_message "Restoration process completed"
exit 0
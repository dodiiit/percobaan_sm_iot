#!/bin/bash
# IndoWater Backup Verification Script
# This script verifies the integrity of database and file backups

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
VERIFICATION_LOG="${BACKUP_DIR}/verification_log.txt"

# Function to log messages
log_message() {
    echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> "$VERIFICATION_LOG"
    echo "$1"
}

# Start verification process
log_message "Starting backup verification process"

# Function to verify database backup
verify_db_backup() {
    local backup_file="$1"
    local temp_dir=$(mktemp -d)
    
    log_message "Verifying database backup: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        log_message "Error: Backup file does not exist: $backup_file"
        return 1
    fi
    
    # Check if file is readable
    if [ ! -r "$backup_file" ]; then
        log_message "Error: Backup file is not readable: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(du -b "$backup_file" | cut -f1)
    if [ "$file_size" -lt 1000 ]; then
        log_message "Warning: Backup file is suspiciously small: $file_size bytes"
    else
        log_message "Backup file size: $file_size bytes"
    fi
    
    # Try to decompress and check SQL syntax
    if gunzip -c "$backup_file" > "${temp_dir}/backup.sql"; then
        log_message "Successfully decompressed backup file"
        
        # Check for common SQL statements that should be present
        if grep -q "CREATE TABLE" "${temp_dir}/backup.sql" && 
           grep -q "INSERT INTO" "${temp_dir}/backup.sql"; then
            log_message "Backup file contains expected SQL statements"
        else
            log_message "Warning: Backup file may not contain expected SQL statements"
        fi
    else
        log_message "Error: Failed to decompress backup file"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    log_message "Database backup verification completed: $backup_file"
    return 0
}

# Function to verify file backup
verify_file_backup() {
    local backup_file="$1"
    
    log_message "Verifying file backup: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        log_message "Error: Backup file does not exist: $backup_file"
        return 1
    fi
    
    # Check if file is readable
    if [ ! -r "$backup_file" ]; then
        log_message "Error: Backup file is not readable: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(du -b "$backup_file" | cut -f1)
    if [ "$file_size" -lt 10000 ]; then
        log_message "Warning: Backup file is suspiciously small: $file_size bytes"
    else
        log_message "Backup file size: $file_size bytes"
    fi
    
    # Test archive integrity
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_message "Backup archive integrity check passed"
        
        # Check for expected files/directories in the archive
        if tar -tzf "$backup_file" | grep -q "index.php" && 
           tar -tzf "$backup_file" | grep -q "composer.json"; then
            log_message "Backup archive contains expected files"
        else
            log_message "Warning: Backup archive may not contain expected files"
        fi
    else
        log_message "Error: Backup archive integrity check failed"
        return 1
    fi
    
    log_message "File backup verification completed: $backup_file"
    return 0
}

# Find the most recent database backup
latest_db_backup=$(find "$DB_BACKUP_DIR" -type f -name "*.sql.gz" -print0 | xargs -0 ls -t | head -n1)

if [ -n "$latest_db_backup" ]; then
    verify_db_backup "$latest_db_backup"
    db_verify_result=$?
else
    log_message "Error: No database backup found"
    db_verify_result=1
fi

# Find the most recent file backup
latest_file_backup=$(find "$FILE_BACKUP_DIR" -type f -name "*.tar.gz" -print0 | xargs -0 ls -t | head -n1)

if [ -n "$latest_file_backup" ]; then
    verify_file_backup "$latest_file_backup"
    file_verify_result=$?
else
    log_message "Error: No file backup found"
    file_verify_result=1
fi

# Overall verification result
if [ $db_verify_result -eq 0 ] && [ $file_verify_result -eq 0 ]; then
    log_message "Backup verification completed successfully"
    exit 0
else
    log_message "Backup verification failed"
    exit 1
fi
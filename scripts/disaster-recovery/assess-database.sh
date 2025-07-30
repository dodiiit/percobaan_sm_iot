#!/bin/bash

# IndoWater Database Assessment Script
# This script assesses the current state of the database during disaster recovery

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/dr-assessment.log"

# Load environment variables
if [ -f "${PROJECT_ROOT}/api/.env" ]; then
    source "${PROJECT_ROOT}/api/.env"
else
    echo "Warning: .env file not found, using defaults"
fi

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_DATABASE:-indowater}"
DB_USER="${DB_USERNAME:-indowater}"
DB_PASS="${DB_PASSWORD}"

# Create log directory
mkdir -p "$(dirname "${LOG_FILE}")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Assessment results
ASSESSMENT_RESULTS=()

log "Starting database assessment..."

# 1. Check if MySQL client is available
if command -v mysql &> /dev/null; then
    log "✓ MySQL client is available"
    ASSESSMENT_RESULTS+=("MySQL client: Available")
else
    log "✗ MySQL client is not available"
    ASSESSMENT_RESULTS+=("MySQL client: NOT AVAILABLE")
fi

# 2. Test database server connectivity
log "Testing database server connectivity..."
if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT 1;" &>/dev/null; then
    log "✓ Database server is reachable"
    ASSESSMENT_RESULTS+=("Database connectivity: OK")
    
    # 3. Check if database exists
    if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "USE \`${DB_NAME}\`;" &>/dev/null; then
        log "✓ Database '${DB_NAME}' exists"
        ASSESSMENT_RESULTS+=("Database existence: OK")
        
        # 4. Count tables
        TABLE_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${DB_NAME}';" -s -N)
        log "✓ Database contains ${TABLE_COUNT} tables"
        ASSESSMENT_RESULTS+=("Table count: ${TABLE_COUNT}")
        
        # 5. Check critical tables
        CRITICAL_TABLES=("users" "clients" "customers" "meters" "payments" "properties")
        MISSING_TABLES=()
        
        for table in "${CRITICAL_TABLES[@]}"; do
            if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "DESCRIBE \`${table}\`;" "${DB_NAME}" &>/dev/null; then
                log "✓ Critical table '${table}' exists"
            else
                log "✗ Critical table '${table}' is missing"
                MISSING_TABLES+=("${table}")
            fi
        done
        
        if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
            ASSESSMENT_RESULTS+=("Critical tables: All present")
        else
            ASSESSMENT_RESULTS+=("Critical tables: Missing (${MISSING_TABLES[*]})")
        fi
        
        # 6. Check data integrity
        log "Checking data integrity..."
        
        # Check for users
        USER_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT COUNT(*) FROM users;" "${DB_NAME}" -s -N 2>/dev/null || echo "0")
        log "Users count: ${USER_COUNT}"
        ASSESSMENT_RESULTS+=("Users count: ${USER_COUNT}")
        
        # Check for clients
        CLIENT_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT COUNT(*) FROM clients;" "${DB_NAME}" -s -N 2>/dev/null || echo "0")
        log "Clients count: ${CLIENT_COUNT}"
        ASSESSMENT_RESULTS+=("Clients count: ${CLIENT_COUNT}")
        
        # Check for customers
        CUSTOMER_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT COUNT(*) FROM customers;" "${DB_NAME}" -s -N 2>/dev/null || echo "0")
        log "Customers count: ${CUSTOMER_COUNT}"
        ASSESSMENT_RESULTS+=("Customers count: ${CUSTOMER_COUNT}")
        
        # 7. Check database size
        DB_SIZE=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='${DB_NAME}';" -s -N)
        log "Database size: ${DB_SIZE} MB"
        ASSESSMENT_RESULTS+=("Database size: ${DB_SIZE} MB")
        
        # 8. Check last backup timestamp (if backup table exists)
        LAST_BACKUP=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "SELECT MAX(created_at) FROM backup_log;" "${DB_NAME}" -s -N 2>/dev/null || echo "No backup log found")
        log "Last backup: ${LAST_BACKUP}"
        ASSESSMENT_RESULTS+=("Last backup: ${LAST_BACKUP}")
        
    else
        log "✗ Database '${DB_NAME}' does not exist"
        ASSESSMENT_RESULTS+=("Database existence: NOT FOUND")
    fi
    
else
    log "✗ Cannot connect to database server"
    ASSESSMENT_RESULTS+=("Database connectivity: FAILED")
fi

# 9. Check available backups
log "Checking available backups..."
BACKUP_DIR="${PROJECT_ROOT}/backups/database"

if [ -d "${BACKUP_DIR}" ]; then
    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" -o -name "*.sql" | wc -l)
    log "Available backups: ${BACKUP_COUNT}"
    ASSESSMENT_RESULTS+=("Available backups: ${BACKUP_COUNT}")
    
    if [ ${BACKUP_COUNT} -gt 0 ]; then
        LATEST_BACKUP=$(find "${BACKUP_DIR}" -name "*.sql.gz" -o -name "*.sql" | sort -r | head -1)
        BACKUP_SIZE=$(du -h "${LATEST_BACKUP}" | cut -f1)
        BACKUP_DATE=$(stat -c %y "${LATEST_BACKUP}" | cut -d' ' -f1,2 | cut -d'.' -f1)
        log "Latest backup: $(basename "${LATEST_BACKUP}") (${BACKUP_SIZE}, ${BACKUP_DATE})"
        ASSESSMENT_RESULTS+=("Latest backup: $(basename "${LATEST_BACKUP}") (${BACKUP_SIZE})")
    fi
else
    log "✗ Backup directory not found: ${BACKUP_DIR}"
    ASSESSMENT_RESULTS+=("Backup directory: NOT FOUND")
fi

# 10. Generate assessment report
REPORT_FILE="${PROJECT_ROOT}/logs/database-assessment-$(date +%Y%m%d_%H%M%S).txt"

cat > "${REPORT_FILE}" << EOF
IndoWater Database Assessment Report
===================================

Assessment Date: $(date)
Database Host: ${DB_HOST}:${DB_PORT}
Database Name: ${DB_NAME}

Assessment Results:
EOF

for result in "${ASSESSMENT_RESULTS[@]}"; do
    echo "- ${result}" >> "${REPORT_FILE}"
done

cat >> "${REPORT_FILE}" << EOF

Recommendations:
EOF

# Generate recommendations based on assessment
if [[ " ${ASSESSMENT_RESULTS[*]} " =~ "Database connectivity: FAILED" ]]; then
    echo "- CRITICAL: Database server is not accessible. Check network connectivity and server status." >> "${REPORT_FILE}"
fi

if [[ " ${ASSESSMENT_RESULTS[*]} " =~ "Database existence: NOT FOUND" ]]; then
    echo "- CRITICAL: Database does not exist. Full restore from backup required." >> "${REPORT_FILE}"
fi

if [[ " ${ASSESSMENT_RESULTS[*]} " =~ "Missing" ]]; then
    echo "- HIGH: Critical tables are missing. Database restore recommended." >> "${REPORT_FILE}"
fi

if [[ " ${ASSESSMENT_RESULTS[*]} " =~ "Available backups: 0" ]]; then
    echo "- CRITICAL: No backups available. Recovery may not be possible." >> "${REPORT_FILE}"
fi

echo "" >> "${REPORT_FILE}"
echo "Assessment completed at: $(date)" >> "${REPORT_FILE}"

log "Assessment report generated: ${REPORT_FILE}"

# Display summary
echo ""
echo "=== Database Assessment Summary ==="
for result in "${ASSESSMENT_RESULTS[@]}"; do
    echo "- ${result}"
done
echo ""
echo "Full report: ${REPORT_FILE}"
echo "=================================="
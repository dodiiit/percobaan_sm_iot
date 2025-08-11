#!/bin/bash

# IndoWater System Health Check Script
# This script performs comprehensive health checks on all system components

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/health-check.log"

# Load environment variables
if [ -f "${PROJECT_ROOT}/api/.env" ]; then
    source "${PROJECT_ROOT}/api/.env"
fi

# Service configuration
API_URL="${APP_URL:-http://localhost:8000}"
FRONTEND_URL="http://localhost:3000"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Create log directory
mkdir -p "$(dirname "${LOG_FILE}")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Health check results
HEALTH_RESULTS=()
FAILED_CHECKS=0

log "Starting comprehensive health check..."

# 1. Database Health Check
log "Checking database health..."
if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" -e "SELECT 1;" "${DB_DATABASE}" &>/dev/null; then
    log "✓ Database is accessible"
    
    # Check database performance
    QUERY_TIME=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USERNAME}" -p"${DB_PASSWORD}" -e "SELECT BENCHMARK(1000, MD5('test'));" "${DB_DATABASE}" 2>&1 | grep "Query OK" | awk '{print $3}' || echo "unknown")
    log "Database query performance: ${QUERY_TIME}"
    HEALTH_RESULTS+=("Database: OK (${QUERY_TIME})")
else
    log "✗ Database is not accessible"
    HEALTH_RESULTS+=("Database: FAILED")
    ((FAILED_CHECKS++))
fi

# 2. Redis Health Check
log "Checking Redis health..."
if command -v redis-cli &> /dev/null; then
    if redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" ping &>/dev/null; then
        log "✓ Redis is accessible"
        
        # Check Redis memory usage
        REDIS_MEMORY=$(redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" INFO memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        log "Redis memory usage: ${REDIS_MEMORY}"
        HEALTH_RESULTS+=("Redis: OK (Memory: ${REDIS_MEMORY})")
    else
        log "✗ Redis is not accessible"
        HEALTH_RESULTS+=("Redis: FAILED")
        ((FAILED_CHECKS++))
    fi
else
    log "⚠ Redis client not available, skipping Redis check"
    HEALTH_RESULTS+=("Redis: SKIPPED (client not available)")
fi

# 3. API Health Check
log "Checking API health..."
if command -v curl &> /dev/null; then
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" --connect-timeout 10 || echo "000")
    
    if [ "${API_RESPONSE}" = "200" ]; then
        log "✓ API is responding (HTTP ${API_RESPONSE})"
        
        # Check API response time
        API_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${API_URL}/health" --connect-timeout 10 || echo "timeout")
        log "API response time: ${API_TIME}s"
        HEALTH_RESULTS+=("API: OK (${API_TIME}s)")
    else
        log "✗ API is not responding (HTTP ${API_RESPONSE})"
        HEALTH_RESULTS+=("API: FAILED (HTTP ${API_RESPONSE})")
        ((FAILED_CHECKS++))
    fi
else
    log "⚠ curl not available, skipping API check"
    HEALTH_RESULTS+=("API: SKIPPED (curl not available)")
fi

# 4. Frontend Health Check
log "Checking frontend health..."
if command -v curl &> /dev/null; then
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" --connect-timeout 10 || echo "000")
    
    if [ "${FRONTEND_RESPONSE}" = "200" ]; then
        log "✓ Frontend is responding (HTTP ${FRONTEND_RESPONSE})"
        HEALTH_RESULTS+=("Frontend: OK")
    else
        log "✗ Frontend is not responding (HTTP ${FRONTEND_RESPONSE})"
        HEALTH_RESULTS+=("Frontend: FAILED (HTTP ${FRONTEND_RESPONSE})")
        ((FAILED_CHECKS++))
    fi
else
    log "⚠ curl not available, skipping frontend check"
    HEALTH_RESULTS+=("Frontend: SKIPPED (curl not available)")
fi

# 5. Docker Services Health Check
log "Checking Docker services..."
if command -v docker &> /dev/null; then
    cd "${PROJECT_ROOT}"
    
    # Check if docker-compose is running
    if docker-compose ps &>/dev/null; then
        RUNNING_SERVICES=$(docker-compose ps --services --filter "status=running" | wc -l)
        TOTAL_SERVICES=$(docker-compose ps --services | wc -l)
        
        log "Docker services: ${RUNNING_SERVICES}/${TOTAL_SERVICES} running"
        
        if [ "${RUNNING_SERVICES}" -eq "${TOTAL_SERVICES}" ]; then
            HEALTH_RESULTS+=("Docker Services: OK (${RUNNING_SERVICES}/${TOTAL_SERVICES})")
        else
            HEALTH_RESULTS+=("Docker Services: PARTIAL (${RUNNING_SERVICES}/${TOTAL_SERVICES})")
            ((FAILED_CHECKS++))
        fi
        
        # List service status
        log "Service status details:"
        docker-compose ps | while read -r line; do
            log "  ${line}"
        done
    else
        log "✗ Docker Compose services not running"
        HEALTH_RESULTS+=("Docker Services: NOT RUNNING")
        ((FAILED_CHECKS++))
    fi
else
    log "⚠ Docker not available, skipping Docker check"
    HEALTH_RESULTS+=("Docker Services: SKIPPED (Docker not available)")
fi

# 6. Disk Space Check
log "Checking disk space..."
DISK_USAGE=$(df -h "${PROJECT_ROOT}" | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "${DISK_USAGE}" -lt 90 ]; then
    log "✓ Disk space usage: ${DISK_USAGE}%"
    HEALTH_RESULTS+=("Disk Space: OK (${DISK_USAGE}%)")
elif [ "${DISK_USAGE}" -lt 95 ]; then
    log "⚠ Disk space usage: ${DISK_USAGE}% (Warning)"
    HEALTH_RESULTS+=("Disk Space: WARNING (${DISK_USAGE}%)")
else
    log "✗ Disk space usage: ${DISK_USAGE}% (Critical)"
    HEALTH_RESULTS+=("Disk Space: CRITICAL (${DISK_USAGE}%)")
    ((FAILED_CHECKS++))
fi

# 7. Memory Usage Check
log "Checking memory usage..."
if command -v free &> /dev/null; then
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "${MEMORY_USAGE}" -lt 80 ]; then
        log "✓ Memory usage: ${MEMORY_USAGE}%"
        HEALTH_RESULTS+=("Memory: OK (${MEMORY_USAGE}%)")
    elif [ "${MEMORY_USAGE}" -lt 90 ]; then
        log "⚠ Memory usage: ${MEMORY_USAGE}% (Warning)"
        HEALTH_RESULTS+=("Memory: WARNING (${MEMORY_USAGE}%)")
    else
        log "✗ Memory usage: ${MEMORY_USAGE}% (Critical)"
        HEALTH_RESULTS+=("Memory: CRITICAL (${MEMORY_USAGE}%)")
        ((FAILED_CHECKS++))
    fi
else
    log "⚠ free command not available, skipping memory check"
    HEALTH_RESULTS+=("Memory: SKIPPED (free not available)")
fi

# 8. Log Files Check
log "Checking log files..."
LOG_DIR="${PROJECT_ROOT}/logs"

if [ -d "${LOG_DIR}" ]; then
    LOG_SIZE=$(du -sh "${LOG_DIR}" | cut -f1)
    ERROR_COUNT=$(find "${LOG_DIR}" -name "*.log" -exec grep -l "ERROR\|CRITICAL\|FATAL" {} \; 2>/dev/null | wc -l)
    
    log "Log directory size: ${LOG_SIZE}"
    log "Log files with errors: ${ERROR_COUNT}"
    
    if [ "${ERROR_COUNT}" -eq 0 ]; then
        HEALTH_RESULTS+=("Logs: OK (Size: ${LOG_SIZE})")
    else
        HEALTH_RESULTS+=("Logs: ERRORS FOUND (${ERROR_COUNT} files, Size: ${LOG_SIZE})")
        ((FAILED_CHECKS++))
    fi
else
    log "⚠ Log directory not found: ${LOG_DIR}"
    HEALTH_RESULTS+=("Logs: DIRECTORY NOT FOUND")
fi

# 9. SSL Certificate Check (if HTTPS is configured)
if [[ "${API_URL}" == https* ]]; then
    log "Checking SSL certificate..."
    
    DOMAIN=$(echo "${API_URL}" | sed 's|https://||' | cut -d'/' -f1)
    SSL_EXPIRY=$(echo | openssl s_client -servername "${DOMAIN}" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
    
    if [ -n "${SSL_EXPIRY}" ]; then
        SSL_DAYS=$(( ($(date -d "${SSL_EXPIRY}" +%s) - $(date +%s)) / 86400 ))
        
        if [ "${SSL_DAYS}" -gt 30 ]; then
            log "✓ SSL certificate expires in ${SSL_DAYS} days"
            HEALTH_RESULTS+=("SSL Certificate: OK (${SSL_DAYS} days)")
        elif [ "${SSL_DAYS}" -gt 7 ]; then
            log "⚠ SSL certificate expires in ${SSL_DAYS} days (Warning)"
            HEALTH_RESULTS+=("SSL Certificate: WARNING (${SSL_DAYS} days)")
        else
            log "✗ SSL certificate expires in ${SSL_DAYS} days (Critical)"
            HEALTH_RESULTS+=("SSL Certificate: CRITICAL (${SSL_DAYS} days)")
            ((FAILED_CHECKS++))
        fi
    else
        log "✗ Could not check SSL certificate"
        HEALTH_RESULTS+=("SSL Certificate: CHECK FAILED")
        ((FAILED_CHECKS++))
    fi
fi

# 10. Generate health report
REPORT_FILE="${PROJECT_ROOT}/logs/health-check-$(date +%Y%m%d_%H%M%S).txt"

cat > "${REPORT_FILE}" << EOF
IndoWater System Health Check Report
===================================

Check Date: $(date)
System: $(uname -a)
Hostname: $(hostname)

Health Check Results:
EOF

for result in "${HEALTH_RESULTS[@]}"; do
    echo "- ${result}" >> "${REPORT_FILE}"
done

cat >> "${REPORT_FILE}" << EOF

Summary:
- Total Checks: ${#HEALTH_RESULTS[@]}
- Failed Checks: ${FAILED_CHECKS}
- Success Rate: $(( (${#HEALTH_RESULTS[@]} - ${FAILED_CHECKS}) * 100 / ${#HEALTH_RESULTS[@]} ))%

Overall Status: $([ ${FAILED_CHECKS} -eq 0 ] && echo "HEALTHY" || echo "ISSUES DETECTED")

Health check completed at: $(date)
EOF

log "Health check report generated: ${REPORT_FILE}"

# Determine overall health status
if [ ${FAILED_CHECKS} -eq 0 ]; then
    OVERALL_STATUS="HEALTHY"
    EXIT_CODE=0
elif [ ${FAILED_CHECKS} -le 2 ]; then
    OVERALL_STATUS="WARNING"
    EXIT_CODE=1
else
    OVERALL_STATUS="CRITICAL"
    EXIT_CODE=2
fi

# Display summary
echo ""
echo "=== System Health Check Summary ==="
echo "Overall Status: ${OVERALL_STATUS}"
echo "Total Checks: ${#HEALTH_RESULTS[@]}"
echo "Failed Checks: ${FAILED_CHECKS}"
echo "Success Rate: $(( (${#HEALTH_RESULTS[@]} - ${FAILED_CHECKS}) * 100 / ${#HEALTH_RESULTS[@]} ))%"
echo ""
echo "Component Status:"
for result in "${HEALTH_RESULTS[@]}"; do
    echo "- ${result}"
done
echo ""
echo "Full report: ${REPORT_FILE}"
echo "==================================="

# Send notification if there are failures
if [ ${FAILED_CHECKS} -gt 0 ] && [ -n "${HEALTH_CHECK_NOTIFICATION_EMAIL}" ]; then
    SUBJECT="IndoWater Health Check Alert - ${OVERALL_STATUS}"
    BODY="System health check detected ${FAILED_CHECKS} issues.

Overall Status: ${OVERALL_STATUS}
Failed Checks: ${FAILED_CHECKS}/${#HEALTH_RESULTS[@]}

Component Status:
$(printf '%s\n' "${HEALTH_RESULTS[@]}")

Please review the full report: ${REPORT_FILE}

Host: $(hostname)
Check Time: $(date)"

    echo "${BODY}" | mail -s "${SUBJECT}" "${HEALTH_CHECK_NOTIFICATION_EMAIL}"
    log "Alert notification sent to ${HEALTH_CHECK_NOTIFICATION_EMAIL}"
fi

exit ${EXIT_CODE}
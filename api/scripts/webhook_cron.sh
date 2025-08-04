#!/bin/bash

# Webhook Retry Cron Job
# Add this to your crontab to process webhook retries every 5 minutes:
# */5 * * * * /path/to/your/project/api/scripts/webhook_cron.sh

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Log file
LOG_FILE="$PROJECT_DIR/logs/webhook_retry.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Run webhook retry processor
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting webhook retry processing" >> "$LOG_FILE"

php scripts/process_webhook_retries.php >> "$LOG_FILE" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') - Webhook retry processing completed" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Optional: Clean up old log entries (keep last 1000 lines)
tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
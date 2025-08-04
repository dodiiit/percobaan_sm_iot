#!/bin/bash

# Webhook Cron Job Setup Script
# This script helps set up the cron job for webhook retry processing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== Webhook Cron Job Setup ===${NC}"
echo "Project Directory: $PROJECT_DIR"
echo ""

# Check if crontab command exists
if ! command -v crontab &> /dev/null; then
    echo -e "${YELLOW}Warning: crontab command not found. You may need to install cron.${NC}"
    echo "On Ubuntu/Debian: sudo apt-get install cron"
    echo "On CentOS/RHEL: sudo yum install cronie"
    exit 1
fi

# Create the cron job entry
CRON_ENTRY="*/5 * * * * $PROJECT_DIR/scripts/webhook_cron.sh"

echo "The following cron job will be added:"
echo ""
echo "$CRON_ENTRY"
echo ""
echo "This will process webhook retries every 5 minutes."
echo ""

# Ask for confirmation
read -p "Do you want to add this cron job? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup current crontab
    echo "Backing up current crontab..."
    crontab -l > "$PROJECT_DIR/crontab_backup_$(date +%Y%m%d_%H%M%S).txt" 2>/dev/null || true
    
    # Add the new cron job
    (crontab -l 2>/dev/null || true; echo "$CRON_ENTRY") | crontab -
    
    echo -e "${GREEN}✓ Cron job added successfully!${NC}"
    echo ""
    echo "Current crontab:"
    crontab -l
    echo ""
    echo "To remove this cron job later, run:"
    echo "crontab -e"
    echo "And delete the line containing 'webhook_cron.sh'"
    
else
    echo "Cron job not added."
    echo ""
    echo "To add it manually later, run:"
    echo "crontab -e"
    echo ""
    echo "And add this line:"
    echo "$CRON_ENTRY"
fi

echo ""
echo -e "${BLUE}Additional Setup:${NC}"
echo ""
echo "1. Ensure the webhook_cron.sh script is executable:"
echo "   chmod +x $PROJECT_DIR/scripts/webhook_cron.sh"
echo ""
echo "2. Test the cron script manually:"
echo "   $PROJECT_DIR/scripts/webhook_cron.sh"
echo ""
echo "3. Monitor the cron job logs:"
echo "   tail -f $PROJECT_DIR/logs/webhook_retry.log"
echo ""
echo "4. Check cron job status:"
echo "   sudo systemctl status cron  # Ubuntu/Debian"
echo "   sudo systemctl status crond # CentOS/RHEL"
echo ""

# Make sure the webhook_cron.sh script is executable
chmod +x "$PROJECT_DIR/scripts/webhook_cron.sh"

echo -e "${GREEN}Setup complete!${NC}"
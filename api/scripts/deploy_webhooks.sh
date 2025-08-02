#!/bin/bash

# Webhook Deployment Script
# This script helps deploy and configure the webhook system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== IndoWater Webhook Deployment Script ===${NC}"
echo "Project Directory: $PROJECT_DIR"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Change to project directory
cd "$PROJECT_DIR"

print_status "Checking project structure..."

# Check required directories
REQUIRED_DIRS=("src" "config" "public" "scripts" "logs")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ ! -d "$dir" ]]; then
        print_error "Required directory '$dir' not found!"
        exit 1
    fi
done

print_status "✓ Project structure looks good"

# Check PHP version
print_status "Checking PHP version..."
PHP_VERSION=$(php -r "echo PHP_VERSION;")
PHP_MAJOR=$(php -r "echo PHP_MAJOR_VERSION;")
PHP_MINOR=$(php -r "echo PHP_MINOR_VERSION;")

if [[ $PHP_MAJOR -lt 8 ]] || [[ $PHP_MAJOR -eq 8 && $PHP_MINOR -lt 0 ]]; then
    print_error "PHP 8.0 or higher required. Current version: $PHP_VERSION"
    exit 1
fi

print_status "✓ PHP version: $PHP_VERSION"

# Check required PHP extensions
print_status "Checking PHP extensions..."
REQUIRED_EXTENSIONS=("curl" "json" "pdo" "pdo_mysql" "openssl" "hash" "mbstring")
MISSING_EXTENSIONS=()

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if ! php -m | grep -q "^$ext$"; then
        MISSING_EXTENSIONS+=("$ext")
    fi
done

if [[ ${#MISSING_EXTENSIONS[@]} -gt 0 ]]; then
    print_error "Missing PHP extensions: ${MISSING_EXTENSIONS[*]}"
    print_error "Install missing extensions and try again"
    exit 1
fi

print_status "✓ All required PHP extensions are installed"

# Check Composer
print_status "Checking Composer dependencies..."
if [[ ! -f "composer.json" ]]; then
    print_error "composer.json not found!"
    exit 1
fi

if [[ ! -d "vendor" ]]; then
    print_warning "Vendor directory not found. Running composer install..."
    composer install --no-dev --optimize-autoloader
fi

print_status "✓ Composer dependencies ready"

# Check environment file
print_status "Checking environment configuration..."
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found. Creating from template..."
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration"
    else
        print_error "No .env.example template found!"
        exit 1
    fi
fi

# Run configuration checker
print_status "Running configuration validation..."
php scripts/check_webhook_config.php

if [[ $? -ne 0 ]]; then
    print_error "Configuration validation failed. Please fix the issues above."
    exit 1
fi

print_status "✓ Configuration validation passed"

# Set up directories and permissions
print_status "Setting up directories and permissions..."

# Create logs directory if it doesn't exist
mkdir -p logs
chmod 755 logs

# Create cache directory if it doesn't exist  
mkdir -p cache
chmod 755 cache

# Set proper permissions for scripts
chmod +x scripts/*.sh
chmod +x scripts/*.php

print_status "✓ Directories and permissions configured"

# Test webhook endpoints
print_status "Testing webhook endpoints..."

# Check if web server is running
if command -v curl &> /dev/null; then
    APP_URL=$(grep "^APP_URL=" .env | cut -d'=' -f2 | tr -d '"' || echo "http://localhost")
    
    if [[ "$APP_URL" != "http://localhost" ]]; then
        print_status "Testing webhook status endpoint..."
        
        if curl -s -f "$APP_URL/api/webhooks/status" > /dev/null; then
            print_status "✓ Webhook status endpoint is accessible"
        else
            print_warning "Webhook status endpoint not accessible. Check web server configuration."
        fi
    else
        print_warning "APP_URL not configured. Skipping endpoint tests."
    fi
else
    print_warning "curl not available. Skipping endpoint tests."
fi

# Set up cron job (optional)
print_status "Cron job setup..."
echo ""
echo -e "${BLUE}To set up automatic webhook retry processing, add this to your crontab:${NC}"
echo ""
echo "# Process webhook retries every 5 minutes"
echo "*/5 * * * * $PROJECT_DIR/scripts/webhook_cron.sh"
echo ""
echo -e "${BLUE}Run 'crontab -e' to edit your crontab${NC}"
echo ""

# Display webhook URLs for gateway configuration
print_status "Webhook URLs for gateway configuration:"
APP_URL=$(grep "^APP_URL=" .env | cut -d'=' -f2 | tr -d '"' || echo "https://your-domain.com")

echo ""
echo -e "${BLUE}Configure these URLs in your payment gateway dashboards:${NC}"
echo ""
echo -e "${GREEN}Midtrans Dashboard:${NC}"
echo "  Payment Notification URL: $APP_URL/api/webhooks/payment/midtrans"
echo ""
echo -e "${GREEN}DOKU Dashboard:${NC}"
echo "  Notification URL: $APP_URL/api/webhooks/payment/doku"
echo ""

# Display monitoring information
echo -e "${BLUE}Monitoring and Management:${NC}"
echo ""
echo "Webhook Status: $APP_URL/api/webhooks/status"
echo "Monitor Dashboard: $APP_URL/webhook-monitor.html"
echo ""
echo "Command Line Tools:"
echo "  Check configuration: php scripts/check_webhook_config.php"
echo "  Monitor webhooks: php scripts/webhook_monitor.php"
echo "  Process retries: php scripts/process_webhook_retries.php"
echo "  Test webhooks: php scripts/test_webhooks.php"
echo ""

# Final recommendations
echo -e "${BLUE}=== Deployment Complete ===${NC}"
echo ""
echo -e "${GREEN}✓ Webhook system is ready for use${NC}"
echo ""
echo "Next steps:"
echo "1. Configure webhook URLs in your payment gateway dashboards (URLs shown above)"
echo "2. Set up the cron job for retry processing (command shown above)"
echo "3. Test your webhook endpoints using the testing script"
echo "4. Monitor webhook health via the status endpoint or web dashboard"
echo ""
echo "For troubleshooting, check:"
echo "- Application logs: $PROJECT_DIR/logs/app.log"
echo "- Webhook retry logs: $PROJECT_DIR/logs/webhook_retry.log"
echo "- Configuration guide: $PROJECT_DIR/WEBHOOK_SETUP_GUIDE.md"
echo ""

print_status "Deployment completed successfully!"
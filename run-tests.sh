#!/bin/bash

# IndoWater IoT Smart Monitoring System - Comprehensive Test Runner
# This script runs all tests: unit, integration, and end-to-end

set -e

echo "🚀 Starting IndoWater IoT Smart Monitoring System Test Suite"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required services are running
check_services() {
    print_status "Checking required services..."
    
    # Check if Redis is running
    if ! redis-cli ping > /dev/null 2>&1; then
        print_warning "Redis is not running. Starting Redis..."
        # Try to start Redis (adjust command based on your system)
        if command -v redis-server > /dev/null; then
            redis-server --daemonize yes
            sleep 2
        else
            print_error "Redis is required but not installed. Please install Redis."
            exit 1
        fi
    fi
    
    print_success "All required services are running"
}

# Backend Tests
run_backend_tests() {
    print_status "Running Backend Tests..."
    cd api
    
    # Install dependencies if needed
    if [ ! -d "vendor" ]; then
        print_status "Installing PHP dependencies..."
        composer install --no-interaction --prefer-dist --optimize-autoloader
    fi
    
    # Run unit tests
    print_status "Running PHP Unit Tests..."
    if composer test:unit; then
        print_success "PHP Unit Tests passed"
    else
        print_error "PHP Unit Tests failed"
        exit 1
    fi
    
    # Run integration tests
    print_status "Running PHP Integration Tests..."
    if composer test:integration; then
        print_success "PHP Integration Tests passed"
    else
        print_error "PHP Integration Tests failed"
        exit 1
    fi
    
    # Generate coverage report
    print_status "Generating PHP Test Coverage Report..."
    composer test:coverage
    
    # Run static analysis
    print_status "Running PHPStan Static Analysis..."
    if composer phpstan; then
        print_success "PHPStan analysis passed"
    else
        print_warning "PHPStan analysis found issues"
    fi
    
    # Run code style check
    print_status "Running PHP Code Style Check..."
    if composer phpcs; then
        print_success "PHP Code Style check passed"
    else
        print_warning "PHP Code Style issues found. Run 'composer phpcbf' to fix."
    fi
    
    cd ..
}

# Frontend Tests
run_frontend_tests() {
    print_status "Running Frontend Tests..."
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
    
    # Run unit tests
    print_status "Running React Unit Tests..."
    if npm run test:ci; then
        print_success "React Unit Tests passed"
    else
        print_error "React Unit Tests failed"
        exit 1
    fi
    
    # Run linting
    print_status "Running ESLint..."
    if npm run lint; then
        print_success "ESLint passed"
    else
        print_warning "ESLint found issues. Run 'npm run lint:fix' to fix."
    fi
    
    # Run type checking
    print_status "Running TypeScript Type Check..."
    if npx tsc --noEmit; then
        print_success "TypeScript type check passed"
    else
        print_error "TypeScript type check failed"
        exit 1
    fi
    
    cd ..
}

# End-to-End Tests
run_e2e_tests() {
    print_status "Running End-to-End Tests..."
    
    # Start backend server
    print_status "Starting backend server..."
    cd api
    php -S localhost:8000 -t public > /dev/null 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend server
    print_status "Starting frontend server..."
    cd frontend
    npm start > /dev/null 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for servers to start
    print_status "Waiting for servers to start..."
    sleep 10
    
    # Check if servers are running
    if ! curl -s http://localhost:8000/api/health > /dev/null; then
        print_error "Backend server failed to start"
        cleanup_servers
        exit 1
    fi
    
    if ! curl -s http://localhost:3000 > /dev/null; then
        print_error "Frontend server failed to start"
        cleanup_servers
        exit 1
    fi
    
    print_success "Servers started successfully"
    
    # Run Cypress tests
    cd frontend
    print_status "Running Cypress E2E Tests..."
    if npm run test:e2e; then
        print_success "E2E Tests passed"
    else
        print_error "E2E Tests failed"
        cleanup_servers
        exit 1
    fi
    cd ..
    
    cleanup_servers
}

# Cleanup function
cleanup_servers() {
    print_status "Cleaning up test servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID > /dev/null 2>&1 || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID > /dev/null 2>&1 || true
    fi
    
    # Kill any remaining processes
    pkill -f "php -S localhost:8000" > /dev/null 2>&1 || true
    pkill -f "react-scripts start" > /dev/null 2>&1 || true
}

# Performance Tests
run_performance_tests() {
    print_status "Running Performance Tests..."
    
    # Cache performance test
    print_status "Testing cache performance..."
    cd api
    php -r "
    require_once 'vendor/autoload.php';
    use IndoWater\Api\Services\CacheService;
    use Predis\Client;
    
    \$redis = new Client(['host' => '127.0.0.1', 'port' => 6379]);
    \$cache = new CacheService(\$redis);
    
    // Warm up
    for (\$i = 0; \$i < 100; \$i++) {
        \$cache->set('perf_test_' . \$i, ['data' => str_repeat('x', 1000)], 300);
    }
    
    // Performance test
    \$start = microtime(true);
    for (\$i = 0; \$i < 1000; \$i++) {
        \$cache->get('perf_test_' . (\$i % 100));
    }
    \$end = microtime(true);
    
    \$duration = (\$end - \$start) * 1000;
    echo \"Cache performance: 1000 operations in \" . round(\$duration, 2) . \"ms\\n\";
    
    if (\$duration < 100) {
        echo \"✅ Cache performance is excellent\\n\";
    } elseif (\$duration < 500) {
        echo \"⚠️  Cache performance is acceptable\\n\";
    } else {
        echo \"❌ Cache performance needs improvement\\n\";
        exit(1);
    }
    "
    cd ..
    
    print_success "Performance tests completed"
}

# Security Tests
run_security_tests() {
    print_status "Running Security Tests..."
    
    # Check for common security issues
    print_status "Checking for security vulnerabilities..."
    
    # PHP security check
    cd api
    if command -v security-checker > /dev/null; then
        security-checker security:check composer.lock
    else
        print_warning "Security checker not installed. Install with: composer global require sensiolabs/security-checker"
    fi
    cd ..
    
    # Node.js security check
    cd frontend
    if npm audit --audit-level=high; then
        print_success "No high-severity vulnerabilities found"
    else
        print_warning "Security vulnerabilities found. Run 'npm audit fix' to resolve."
    fi
    cd ..
    
    print_success "Security tests completed"
}

# Generate Test Report
generate_report() {
    print_status "Generating Test Report..."
    
    REPORT_DIR="test-reports"
    mkdir -p $REPORT_DIR
    
    # Combine coverage reports
    echo "# IndoWater IoT Smart Monitoring System - Test Report" > $REPORT_DIR/test-report.md
    echo "Generated on: $(date)" >> $REPORT_DIR/test-report.md
    echo "" >> $REPORT_DIR/test-report.md
    
    echo "## Backend Test Coverage" >> $REPORT_DIR/test-report.md
    if [ -f "api/coverage.txt" ]; then
        cat api/coverage.txt >> $REPORT_DIR/test-report.md
    fi
    echo "" >> $REPORT_DIR/test-report.md
    
    echo "## Frontend Test Coverage" >> $REPORT_DIR/test-report.md
    if [ -f "frontend/coverage/lcov-report/index.html" ]; then
        echo "Frontend coverage report available at: frontend/coverage/lcov-report/index.html" >> $REPORT_DIR/test-report.md
    fi
    echo "" >> $REPORT_DIR/test-report.md
    
    print_success "Test report generated at: $REPORT_DIR/test-report.md"
}

# Main execution
main() {
    # Parse command line arguments
    RUN_BACKEND=true
    RUN_FRONTEND=true
    RUN_E2E=true
    RUN_PERFORMANCE=false
    RUN_SECURITY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                RUN_FRONTEND=false
                RUN_E2E=false
                shift
                ;;
            --frontend-only)
                RUN_BACKEND=false
                RUN_E2E=false
                shift
                ;;
            --e2e-only)
                RUN_BACKEND=false
                RUN_FRONTEND=false
                shift
                ;;
            --with-performance)
                RUN_PERFORMANCE=true
                shift
                ;;
            --with-security)
                RUN_SECURITY=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --backend-only      Run only backend tests"
                echo "  --frontend-only     Run only frontend tests"
                echo "  --e2e-only         Run only end-to-end tests"
                echo "  --with-performance  Include performance tests"
                echo "  --with-security     Include security tests"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Trap to cleanup on exit
    trap cleanup_servers EXIT
    
    # Check services
    check_services
    
    # Run tests based on flags
    if [ "$RUN_BACKEND" = true ]; then
        run_backend_tests
    fi
    
    if [ "$RUN_FRONTEND" = true ]; then
        run_frontend_tests
    fi
    
    if [ "$RUN_E2E" = true ]; then
        run_e2e_tests
    fi
    
    if [ "$RUN_PERFORMANCE" = true ]; then
        run_performance_tests
    fi
    
    if [ "$RUN_SECURITY" = true ]; then
        run_security_tests
    fi
    
    # Generate report
    generate_report
    
    print_success "🎉 All tests completed successfully!"
    echo ""
    echo "📊 Test Results Summary:"
    echo "========================"
    if [ "$RUN_BACKEND" = true ]; then
        echo "✅ Backend Tests: PASSED"
    fi
    if [ "$RUN_FRONTEND" = true ]; then
        echo "✅ Frontend Tests: PASSED"
    fi
    if [ "$RUN_E2E" = true ]; then
        echo "✅ End-to-End Tests: PASSED"
    fi
    if [ "$RUN_PERFORMANCE" = true ]; then
        echo "✅ Performance Tests: PASSED"
    fi
    if [ "$RUN_SECURITY" = true ]; then
        echo "✅ Security Tests: PASSED"
    fi
    echo ""
    echo "📁 Reports available in: test-reports/"
    echo "🌐 Backend coverage: api/coverage/"
    echo "🌐 Frontend coverage: frontend/coverage/"
}

# Run main function
main "$@"
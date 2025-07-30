#!/bin/bash
# IndoWater Security Audit Script
# This script performs a security audit of the IndoWater system

# Set colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set paths
PROJECT_ROOT="/workspace/IndoWater"
REPORT_DIR="$PROJECT_ROOT/security/reports"
REPORT_FILE="$REPORT_DIR/security_audit_$(date +"%Y-%m-%d").txt"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Start report
echo "IndoWater Security Audit Report" > "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "----------------------------------------" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to check for sensitive data in files
check_sensitive_data() {
    echo -e "${BLUE}Checking for sensitive data in files...${NC}"
    echo "Checking for sensitive data in files:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "password"
        "secret"
        "api[_-]?key"
        "token"
        "auth"
        "credential"
        "private[_-]?key"
        "BEGIN PRIVATE KEY"
        "BEGIN RSA PRIVATE KEY"
        "ssh-rsa"
        "access[_-]?key"
        "aws[_-]?key"
        "firebase"
        "stripe"
        "paypal"
        "midtrans"
        "doku"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        echo -e "${YELLOW}Searching for pattern: $pattern${NC}"
        echo "Pattern: $pattern" >> "$REPORT_FILE"
        
        # Find files containing the pattern
        grep -r --include="*.php" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.env*" --include="*.xml" --include="*.conf" --include="*.ini" -i "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
        
        echo "" >> "$REPORT_FILE"
    done
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for security vulnerabilities in dependencies
check_dependencies() {
    echo -e "${BLUE}Checking for security vulnerabilities in dependencies...${NC}"
    echo "Checking for security vulnerabilities in dependencies:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check if composer is installed
    if command -v composer &> /dev/null; then
        echo -e "${YELLOW}Checking PHP dependencies...${NC}"
        echo "PHP Dependencies:" >> "$REPORT_FILE"
        
        # Check if composer.json exists
        if [ -f "$PROJECT_ROOT/composer.json" ]; then
            cd "$PROJECT_ROOT"
            composer audit --format=plain >> "$REPORT_FILE" 2>&1
        else
            echo "No composer.json found" >> "$REPORT_FILE"
        fi
        
        echo "" >> "$REPORT_FILE"
    else
        echo "Composer not installed" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    # Check if npm is installed
    if command -v npm &> /dev/null; then
        echo -e "${YELLOW}Checking JavaScript dependencies...${NC}"
        echo "JavaScript Dependencies:" >> "$REPORT_FILE"
        
        # Check if package.json exists
        if [ -f "$PROJECT_ROOT/package.json" ]; then
            cd "$PROJECT_ROOT"
            npm audit --json | jq >> "$REPORT_FILE" 2>&1
        else
            echo "No package.json found" >> "$REPORT_FILE"
        fi
        
        echo "" >> "$REPORT_FILE"
    else
        echo "npm not installed" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for insecure configurations
check_configurations() {
    echo -e "${BLUE}Checking for insecure configurations...${NC}"
    echo "Checking for insecure configurations:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for .env files
    echo -e "${YELLOW}Checking .env files...${NC}"
    echo "Environment Files:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -name ".env*" -type f | grep -v "vendor/" | grep -v "node_modules/" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for configuration files
    echo -e "${YELLOW}Checking configuration files...${NC}"
    echo "Configuration Files:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -name "*.conf" -o -name "*.ini" -o -name "*.config" -o -name "*.xml" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | grep -v "vendor/" | grep -v "node_modules/" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for debug mode
    echo -e "${YELLOW}Checking for debug mode...${NC}"
    echo "Debug Mode:" >> "$REPORT_FILE"
    grep -r --include="*.php" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.env*" -i "debug.*=.*true\|debug.*:.*true" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for insecure code patterns
check_code_patterns() {
    echo -e "${BLUE}Checking for insecure code patterns...${NC}"
    echo "Checking for insecure code patterns:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "eval\s*\("
        "exec\s*\("
        "shell_exec\s*\("
        "system\s*\("
        "passthru\s*\("
        "popen\s*\("
        "proc_open\s*\("
        "unserialize\s*\("
        "include\s*\(\s*\$"
        "require\s*\(\s*\$"
        "include_once\s*\(\s*\$"
        "require_once\s*\(\s*\$"
        "mysql_query"
        "mysqli_query"
        "pg_query"
        "echo\s*\$_"
        "print\s*\$_"
        "var_dump\s*\("
        "print_r\s*\("
        "phpinfo\s*\("
        "error_reporting\s*\(0\)"
        "error_reporting\s*\(E_ALL\s*&\s*~E_"
        "@error_reporting"
        "@include"
        "@require"
        "chmod\s*\([^,]*,\s*0777\)"
        "chmod\s*\([^,]*,\s*777\)"
        "fopen\s*\([^,]*,\s*['\"]w['\"]"
        "fopen\s*\([^,]*,\s*['\"]a['\"]"
        "file_put_contents"
        "file_get_contents\s*\(\s*\$"
        "move_uploaded_file"
        "curl_exec"
        "curl_setopt\s*\([^,]*,\s*CURLOPT_SSL_VERIFYPEER,\s*false"
        "curl_setopt\s*\([^,]*,\s*CURLOPT_SSL_VERIFYHOST,\s*0"
        "hash\s*\(['\"]md5['\"]"
        "hash\s*\(['\"]sha1['\"]"
        "md5\s*\("
        "sha1\s*\("
        "rand\s*\("
        "mt_rand\s*\("
        "srand\s*\("
        "mt_srand\s*\("
        "header\s*\(['\"]Location:\s*\$"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        echo -e "${YELLOW}Searching for pattern: $pattern${NC}"
        echo "Pattern: $pattern" >> "$REPORT_FILE"
        
        # Find files containing the pattern
        grep -r --include="*.php" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
        
        echo "" >> "$REPORT_FILE"
    done
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for file permissions
check_file_permissions() {
    echo -e "${BLUE}Checking for insecure file permissions...${NC}"
    echo "Checking for insecure file permissions:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for world-writable files
    echo -e "${YELLOW}Checking for world-writable files...${NC}"
    echo "World-Writable Files:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -type f -perm -o+w | grep -v "vendor/" | grep -v "node_modules/" | grep -v ".git/" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for world-writable directories
    echo -e "${YELLOW}Checking for world-writable directories...${NC}"
    echo "World-Writable Directories:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -type d -perm -o+w | grep -v "vendor/" | grep -v "node_modules/" | grep -v ".git/" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for setuid/setgid files
    echo -e "${YELLOW}Checking for setuid/setgid files...${NC}"
    echo "Setuid/Setgid Files:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -type f -perm /u+s,g+s | grep -v "vendor/" | grep -v "node_modules/" | grep -v ".git/" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for database security
check_database_security() {
    echo -e "${BLUE}Checking for database security issues...${NC}"
    echo "Checking for database security issues:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for SQL injection vulnerabilities
    echo -e "${YELLOW}Checking for potential SQL injection vulnerabilities...${NC}"
    echo "Potential SQL Injection Vulnerabilities:" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "SELECT.*FROM.*\$"
        "INSERT.*INTO.*\$"
        "UPDATE.*SET.*\$"
        "DELETE.*FROM.*\$"
        "query\s*\(.*\$"
        "exec\s*\(.*\$"
        "execute\s*\(.*\$"
        "prepare\s*\(.*\$"
        "->where\s*\(.*\$"
        "->orWhere\s*\(.*\$"
        "->whereRaw\s*\(.*\$"
        "->orWhereRaw\s*\(.*\$"
        "->havingRaw\s*\(.*\$"
        "->orHavingRaw\s*\(.*\$"
        "->orderByRaw\s*\(.*\$"
        "->groupByRaw\s*\(.*\$"
        "->selectRaw\s*\(.*\$"
        "->fromRaw\s*\(.*\$"
        "->joinRaw\s*\(.*\$"
        "->leftJoinRaw\s*\(.*\$"
        "->rightJoinRaw\s*\(.*\$"
        "->DB::raw\s*\(.*\$"
        "->DB::select\s*\(.*\$"
        "->DB::insert\s*\(.*\$"
        "->DB::update\s*\(.*\$"
        "->DB::delete\s*\(.*\$"
        "->DB::statement\s*\(.*\$"
        "->DB::unprepared\s*\(.*\$"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        grep -r --include="*.php" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for XSS vulnerabilities
check_xss_vulnerabilities() {
    echo -e "${BLUE}Checking for XSS vulnerabilities...${NC}"
    echo "Checking for XSS vulnerabilities:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "echo\s*\$_"
        "print\s*\$_"
        "echo\s*\$.*\$_"
        "print\s*\$.*\$_"
        "<\?=\s*\$_"
        "innerHTML.*\$"
        "outerHTML.*\$"
        "document\.write.*\$"
        "\.html\s*\(.*\$"
        "\.append\s*\(.*\$"
        "\.prepend\s*\(.*\$"
        "\.after\s*\(.*\$"
        "\.before\s*\(.*\$"
        "\.insertAdjacentHTML.*\$"
        "\.insertBefore.*\$"
        "\.insertAfter.*\$"
        "\.replaceWith.*\$"
        "\.replace\s*\(.*\$"
        "eval\s*\(.*\$"
        "setTimeout\s*\(.*\$"
        "setInterval\s*\(.*\$"
        "new\s+Function\s*\(.*\$"
        "location\.href.*\$"
        "location\.hash.*\$"
        "location\.search.*\$"
        "location\.pathname.*\$"
        "location\.replace.*\$"
        "location\.assign.*\$"
        "window\.open.*\$"
        "document\.cookie.*\$"
        "\.attr\s*\(['\"]src['\"].*\$"
        "\.attr\s*\(['\"]href['\"].*\$"
        "\.attr\s*\(['\"]onclick['\"].*\$"
        "\.attr\s*\(['\"]onerror['\"].*\$"
        "\.attr\s*\(['\"]onload['\"].*\$"
        "\.attr\s*\(['\"]onmouseover['\"].*\$"
        "\.attr\s*\(['\"]onmouseout['\"].*\$"
        "\.attr\s*\(['\"]onkeyup['\"].*\$"
        "\.attr\s*\(['\"]onkeydown['\"].*\$"
        "\.attr\s*\(['\"]onkeypress['\"].*\$"
        "\.attr\s*\(['\"]onchange['\"].*\$"
        "\.attr\s*\(['\"]onsubmit['\"].*\$"
        "\.attr\s*\(['\"]onreset['\"].*\$"
        "\.attr\s*\(['\"]onselect['\"].*\$"
        "\.attr\s*\(['\"]onfocus['\"].*\$"
        "\.attr\s*\(['\"]onblur['\"].*\$"
        "\.attr\s*\(['\"]style['\"].*\$"
        "\.css\s*\(.*\$"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        grep -r --include="*.php" --include="*.js" --include="*.html" --include="*.twig" --include="*.blade.php" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for CSRF vulnerabilities
check_csrf_vulnerabilities() {
    echo -e "${BLUE}Checking for CSRF vulnerabilities...${NC}"
    echo "Checking for CSRF vulnerabilities:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for forms without CSRF protection
    echo -e "${YELLOW}Checking for forms without CSRF protection...${NC}"
    echo "Forms without CSRF protection:" >> "$REPORT_FILE"
    
    # Find forms in PHP files
    grep -r --include="*.php" --include="*.html" --include="*.twig" --include="*.blade.php" -A 10 "<form" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "_token" | grep -v "csrf" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    # Check for AJAX requests without CSRF protection
    echo -e "${YELLOW}Checking for AJAX requests without CSRF protection...${NC}"
    echo "AJAX requests without CSRF protection:" >> "$REPORT_FILE"
    
    # Find AJAX requests in JavaScript files
    grep -r --include="*.js" -A 5 "\$.ajax\|\$.post\|\$.get\|axios\|fetch" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "_token" | grep -v "csrf" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for security headers
check_security_headers() {
    echo -e "${BLUE}Checking for security headers...${NC}"
    echo "Checking for security headers:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Define headers to search for
    headers=(
        "Content-Security-Policy"
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Referrer-Policy"
        "Feature-Policy"
        "Permissions-Policy"
    )
    
    # Search for headers in files
    for header in "${headers[@]}"; do
        echo -e "${YELLOW}Searching for header: $header${NC}"
        echo "Header: $header" >> "$REPORT_FILE"
        
        # Find files containing the header
        grep -r --include="*.php" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.conf" --include="*.ini" -i "$header" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
        
        echo "" >> "$REPORT_FILE"
    done
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for error handling
check_error_handling() {
    echo -e "${BLUE}Checking for error handling...${NC}"
    echo "Checking for error handling:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for try-catch blocks
    echo -e "${YELLOW}Checking for try-catch blocks...${NC}"
    echo "Try-catch blocks:" >> "$REPORT_FILE"
    
    # Count try-catch blocks in PHP files
    echo "PHP try-catch blocks:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -name "*.php" -type f -exec grep -l "try\s*{" {} \; 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | wc -l >> "$REPORT_FILE"
    
    # Count try-catch blocks in JavaScript files
    echo "JavaScript try-catch blocks:" >> "$REPORT_FILE"
    find "$PROJECT_ROOT" -name "*.js" -type f -exec grep -l "try\s*{" {} \; 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | wc -l >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    # Check for error suppression
    echo -e "${YELLOW}Checking for error suppression...${NC}"
    echo "Error suppression:" >> "$REPORT_FILE"
    
    # Find error suppression in PHP files
    grep -r --include="*.php" -E "@[a-zA-Z0-9_]+\s*\(" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    # Check for error reporting
    echo -e "${YELLOW}Checking for error reporting...${NC}"
    echo "Error reporting:" >> "$REPORT_FILE"
    
    # Find error reporting in PHP files
    grep -r --include="*.php" -E "error_reporting|display_errors|log_errors" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for logging
check_logging() {
    echo -e "${BLUE}Checking for logging...${NC}"
    echo "Checking for logging:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for logging in PHP files
    echo -e "${YELLOW}Checking for logging in PHP files...${NC}"
    echo "Logging in PHP files:" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "log\s*\("
        "logger\s*\("
        "->log\s*\("
        "->logger\s*\("
        "->info\s*\("
        "->error\s*\("
        "->warning\s*\("
        "->debug\s*\("
        "->critical\s*\("
        "->alert\s*\("
        "->emergency\s*\("
        "->notice\s*\("
        "Log::"
        "Logger::"
        "Monolog"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        grep -r --include="*.php" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    # Check for logging in JavaScript files
    echo -e "${YELLOW}Checking for logging in JavaScript files...${NC}"
    echo "Logging in JavaScript files:" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "console\.log"
        "console\.error"
        "console\.warn"
        "console\.info"
        "console\.debug"
        "logger\."
        "log\."
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        grep -r --include="*.js" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to check for input validation
check_input_validation() {
    echo -e "${BLUE}Checking for input validation...${NC}"
    echo "Checking for input validation:" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for input validation in PHP files
    echo -e "${YELLOW}Checking for input validation in PHP files...${NC}"
    echo "Input validation in PHP files:" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "filter_var"
        "filter_input"
        "htmlspecialchars"
        "htmlentities"
        "strip_tags"
        "validate"
        "validation"
        "sanitize"
        "escape"
        "->validate"
        "->sanitize"
        "->escape"
        "Validator"
        "Request::validate"
        "Request::input"
        "Request::get"
        "Request::post"
        "Request::all"
        "Request::only"
        "Request::except"
        "Request::has"
        "Request::filled"
        "Request::missing"
        "Request::exists"
        "Request::isMethod"
        "Request::is"
        "Request::ajax"
        "Request::pjax"
        "Request::secure"
        "Request::ip"
        "Request::userAgent"
        "Request::url"
        "Request::fullUrl"
        "Request::path"
        "Request::segments"
        "Request::segment"
        "Request::header"
        "Request::bearerToken"
        "Request::cookie"
        "Request::file"
        "Request::hasFile"
        "Request::isJson"
        "Request::wantsJson"
        "Request::accepts"
        "Request::acceptsJson"
        "Request::acceptsHtml"
        "Request::format"
        "Request::expectsJson"
        "Request::isXmlHttpRequest"
        "Request::fingerprint"
        "Request::user"
        "Request::route"
        "Request::routeIs"
        "Request::routeIsNot"
        "Request::fullUrlIs"
        "Request::fullUrlIsNot"
        "Request::session"
        "Request::hasSession"
        "Request::getSession"
        "Request::flash"
        "Request::flashOnly"
        "Request::flashExcept"
        "Request::old"
        "Request::hasOldInput"
        "Request::flush"
        "Request::merge"
        "Request::replace"
        "Request::offsetGet"
        "Request::offsetSet"
        "Request::offsetUnset"
        "Request::offsetExists"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        grep -r --include="*.php" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    # Check for input validation in JavaScript files
    echo -e "${YELLOW}Checking for input validation in JavaScript files...${NC}"
    echo "Input validation in JavaScript files:" >> "$REPORT_FILE"
    
    # Define patterns to search for
    patterns=(
        "validate"
        "validation"
        "sanitize"
        "escape"
        "encodeURI"
        "encodeURIComponent"
        "decodeURI"
        "decodeURIComponent"
        "parseInt"
        "parseFloat"
        "Number"
        "String"
        "Boolean"
        "isNaN"
        "isFinite"
        "typeof"
        "instanceof"
        "test\s*\("
        "match\s*\("
        "replace\s*\("
        "search\s*\("
        "split\s*\("
        "trim\s*\("
        "toLowerCase\s*\("
        "toUpperCase\s*\("
        "substring\s*\("
        "substr\s*\("
        "slice\s*\("
        "charAt\s*\("
        "charCodeAt\s*\("
        "concat\s*\("
        "join\s*\("
        "reverse\s*\("
        "sort\s*\("
        "filter\s*\("
        "map\s*\("
        "reduce\s*\("
        "reduceRight\s*\("
        "every\s*\("
        "some\s*\("
        "indexOf\s*\("
        "lastIndexOf\s*\("
        "includes\s*\("
        "find\s*\("
        "findIndex\s*\("
        "forEach\s*\("
        "keys\s*\("
        "values\s*\("
        "entries\s*\("
        "hasOwnProperty\s*\("
        "propertyIsEnumerable\s*\("
        "isPrototypeOf\s*\("
        "toString\s*\("
        "valueOf\s*\("
        "toLocaleString\s*\("
        "toFixed\s*\("
        "toPrecision\s*\("
        "toExponential\s*\("
        "toLocaleLowerCase\s*\("
        "toLocaleUpperCase\s*\("
        "localeCompare\s*\("
        "normalize\s*\("
        "repeat\s*\("
        "startsWith\s*\("
        "endsWith\s*\("
        "padStart\s*\("
        "padEnd\s*\("
        "codePointAt\s*\("
        "fromCodePoint\s*\("
        "fromCharCode\s*\("
        "isArray\s*\("
        "isInteger\s*\("
        "isSafeInteger\s*\("
        "isNaN\s*\("
        "isFinite\s*\("
        "parseFloat\s*\("
        "parseInt\s*\("
        "eval\s*\("
        "Function\s*\("
        "setTimeout\s*\("
        "setInterval\s*\("
        "clearTimeout\s*\("
        "clearInterval\s*\("
        "requestAnimationFrame\s*\("
        "cancelAnimationFrame\s*\("
        "fetch\s*\("
        "XMLHttpRequest"
        "ActiveXObject"
        "WebSocket"
        "EventSource"
        "Worker"
        "SharedWorker"
        "ServiceWorker"
        "Notification"
        "PushManager"
        "PushSubscription"
        "PushSubscriptionOptions"
        "PushMessageData"
        "Geolocation"
        "Position"
        "PositionError"
        "Coordinates"
        "Navigator"
        "History"
        "Location"
        "Screen"
        "Window"
        "Document"
        "Element"
        "Node"
        "NodeList"
        "HTMLCollection"
        "DOMTokenList"
        "DOMStringMap"
        "DOMRect"
        "DOMRectList"
        "DOMPoint"
        "DOMPointReadOnly"
        "DOMQuad"
        "DOMMatrix"
        "DOMMatrixReadOnly"
        "DOMParser"
        "XMLSerializer"
        "Range"
        "Selection"
        "MutationObserver"
        "MutationRecord"
        "ResizeObserver"
        "ResizeObserverEntry"
        "IntersectionObserver"
        "IntersectionObserverEntry"
        "PerformanceObserver"
        "PerformanceObserverEntryList"
        "PerformanceEntry"
        "PerformanceMark"
        "PerformanceMeasure"
        "PerformanceNavigation"
        "PerformanceNavigationTiming"
        "PerformanceResourceTiming"
        "PerformanceTiming"
        "Performance"
        "PerformanceServerTiming"
        "PerformancePaintTiming"
        "PerformanceLongTaskTiming"
        "PerformanceEventTiming"
        "PerformanceElementTiming"
        "PerformanceFrameTiming"
        "PerformanceMarkOptions"
        "PerformanceMeasureOptions"
        "PerformanceObserverInit"
        "PerformanceResourceTimingInit"
        "PerformanceServerTimingInit"
        "PerformancePaintTimingInit"
        "PerformanceLongTaskTimingInit"
        "PerformanceEventTimingInit"
        "PerformanceElementTimingInit"
        "PerformanceFrameTimingInit"
        "PerformanceMarkOptions"
        "PerformanceMeasureOptions"
        "PerformanceObserverInit"
        "PerformanceResourceTimingInit"
        "PerformanceServerTimingInit"
        "PerformancePaintTimingInit"
        "PerformanceLongTaskTimingInit"
        "PerformanceEventTimingInit"
        "PerformanceElementTimingInit"
        "PerformanceFrameTimingInit"
    )
    
    # Search for patterns in files
    for pattern in "${patterns[@]}"; do
        grep -r --include="*.js" -E "$pattern" "$PROJECT_ROOT" 2>/dev/null | grep -v "vendor/" | grep -v "node_modules/" | grep -v "security_audit.sh" >> "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Run all checks
check_sensitive_data
check_dependencies
check_configurations
check_code_patterns
check_file_permissions
check_database_security
check_xss_vulnerabilities
check_csrf_vulnerabilities
check_security_headers
check_error_handling
check_logging
check_input_validation

# Print report location
echo -e "${GREEN}Security audit completed. Report saved to: $REPORT_FILE${NC}"
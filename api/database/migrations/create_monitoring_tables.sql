-- Create monitoring tables for internal tracking

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_code VARCHAR(20),
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    stack_trace TEXT,
    request_url VARCHAR(500),
    request_method VARCHAR(10),
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    context JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_error_type (error_type),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit VARCHAR(20) DEFAULT 'ms',
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status_code INT,
    response_time DECIMAL(10,3),
    memory_usage BIGINT,
    cpu_usage DECIMAL(5,2),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_endpoint (endpoint),
    INDEX idx_created_at (created_at),
    INDEX idx_response_time (response_time)
);

-- System health checks table
CREATE TABLE IF NOT EXISTS system_health_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    check_type VARCHAR(50) NOT NULL,
    status ENUM('healthy', 'warning', 'critical') NOT NULL,
    response_time DECIMAL(10,3),
    error_message TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_check_type (check_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Request logs table
CREATE TABLE IF NOT EXISTS request_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method VARCHAR(10) NOT NULL,
    url VARCHAR(500) NOT NULL,
    status_code INT NOT NULL,
    response_time DECIMAL(10,3) NOT NULL,
    request_size INT DEFAULT 0,
    response_size INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id INT,
    referer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_method (method),
    INDEX idx_status_code (status_code),
    INDEX idx_response_time (response_time),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
);

-- Custom events table
CREATE TABLE IF NOT EXISTS custom_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_data JSON,
    user_id INT,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_name (event_name),
    INDEX idx_event_category (event_category),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
    triggered_by VARCHAR(100),
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Webhook monitoring table
CREATE TABLE IF NOT EXISTS webhook_monitoring (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webhook_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    payload JSON,
    response_status INT,
    response_body TEXT,
    response_time DECIMAL(10,3),
    retry_count INT DEFAULT 0,
    status ENUM('success', 'failed', 'retrying') NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_webhook_type (webhook_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_retry_count (retry_count)
);

-- System metrics table (for storing periodic system stats)
CREATE TABLE IF NOT EXISTS system_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,
    cpu_usage DECIMAL(5,2),
    memory_usage BIGINT,
    memory_total BIGINT,
    disk_usage BIGINT,
    disk_total BIGINT,
    active_connections INT,
    database_connections INT,
    queue_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_type (metric_type),
    INDEX idx_created_at (created_at)
);

-- Create views for easy monitoring queries
CREATE OR REPLACE VIEW error_summary AS
SELECT 
    DATE(created_at) as date,
    error_type,
    severity,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as affected_users
FROM error_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), error_type, severity
ORDER BY date DESC, count DESC;

CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    DATE(created_at) as date,
    endpoint,
    COUNT(*) as request_count,
    AVG(response_time) as avg_response_time,
    MAX(response_time) as max_response_time,
    MIN(response_time) as min_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM performance_metrics 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at), endpoint
ORDER BY date DESC, request_count DESC;

CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
    check_type,
    status,
    COUNT(*) as check_count,
    AVG(response_time) as avg_response_time,
    MAX(created_at) as last_check
FROM system_health_checks 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY check_type, status
ORDER BY last_check DESC;
<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use PDO;
use Psr\Log\LoggerInterface;
use Exception;

class InternalMonitoringService
{
    private PDO $pdo;
    private LoggerInterface $logger;
    private array $config;

    public function __construct(PDO $pdo, LoggerInterface $logger, array $config = [])
    {
        $this->pdo = $pdo;
        $this->logger = $logger;
        $this->config = array_merge([
            'alert_email' => 'admin@lingindustri.com',
            'alert_thresholds' => [
                'error_rate' => 10, // errors per hour
                'response_time' => 5000, // milliseconds
                'memory_usage' => 80, // percentage
                'disk_usage' => 90, // percentage
            ],
            'retention_days' => 30,
        ], $config);
    }

    /**
     * Log error with context
     */
    public function logError(
        string $errorType,
        string $message,
        string $severity = 'medium',
        array $context = []
    ): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO error_logs (
                    error_type, error_message, severity, error_code, stack_trace,
                    request_url, request_method, user_id, ip_address, user_agent, context
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $errorType,
                $message,
                $severity,
                $context['error_code'] ?? null,
                $context['stack_trace'] ?? null,
                $context['request_url'] ?? $_SERVER['REQUEST_URI'] ?? null,
                $context['request_method'] ?? $_SERVER['REQUEST_METHOD'] ?? null,
                $context['user_id'] ?? null,
                $context['ip_address'] ?? $_SERVER['REMOTE_ADDR'] ?? null,
                $context['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? null,
                json_encode($context)
            ]);

            // Check if alert should be triggered
            $this->checkErrorRateAlert();

        } catch (Exception $e) {
            $this->logger->error('Failed to log error to monitoring system', [
                'error' => $e->getMessage(),
                'original_error' => $message
            ]);
        }
    }

    /**
     * Log performance metric
     */
    public function logPerformanceMetric(
        string $metricName,
        float $value,
        string $unit = 'ms',
        array $context = []
    ): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO performance_metrics (
                    metric_name, metric_value, metric_unit, endpoint, method,
                    status_code, response_time, memory_usage, cpu_usage, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $metricName,
                $value,
                $unit,
                $context['endpoint'] ?? null,
                $context['method'] ?? null,
                $context['status_code'] ?? null,
                $context['response_time'] ?? null,
                $context['memory_usage'] ?? memory_get_usage(true),
                $context['cpu_usage'] ?? null,
                $context['user_id'] ?? null
            ]);

            // Check performance thresholds
            if ($metricName === 'response_time' && $value > $this->config['alert_thresholds']['response_time']) {
                $this->createAlert(
                    'performance',
                    'high',
                    'High Response Time Detected',
                    "Response time of {$value}ms exceeds threshold of {$this->config['alert_thresholds']['response_time']}ms"
                );
            }

        } catch (Exception $e) {
            $this->logger->error('Failed to log performance metric', [
                'error' => $e->getMessage(),
                'metric' => $metricName,
                'value' => $value
            ]);
        }
    }

    /**
     * Log system health check
     */
    public function logHealthCheck(
        string $checkType,
        string $status,
        float $responseTime = null,
        string $errorMessage = null,
        array $details = []
    ): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO system_health_checks (
                    check_type, status, response_time, error_message, details
                ) VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $checkType,
                $status,
                $responseTime,
                $errorMessage,
                json_encode($details)
            ]);

            // Create alert for critical health issues
            if ($status === 'critical') {
                $this->createAlert(
                    'system_health',
                    'critical',
                    "System Health Critical: {$checkType}",
                    $errorMessage ?? "Critical issue detected in {$checkType}"
                );
            }

        } catch (Exception $e) {
            $this->logger->error('Failed to log health check', [
                'error' => $e->getMessage(),
                'check_type' => $checkType,
                'status' => $status
            ]);
        }
    }

    /**
     * Log custom event
     */
    public function logCustomEvent(
        string $eventName,
        string $category,
        array $data = [],
        int $userId = null
    ): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO custom_events (
                    event_name, event_category, event_data, user_id,
                    session_id, ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $eventName,
                $category,
                json_encode($data),
                $userId,
                session_id() ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

        } catch (Exception $e) {
            $this->logger->error('Failed to log custom event', [
                'error' => $e->getMessage(),
                'event' => $eventName
            ]);
        }
    }

    /**
     * Create monitoring alert
     */
    public function createAlert(
        string $type,
        string $severity,
        string $title,
        string $message,
        array $metadata = []
    ): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO monitoring_alerts (
                    alert_type, severity, title, message, triggered_by, metadata
                ) VALUES (?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $type,
                $severity,
                $title,
                $message,
                'system',
                json_encode($metadata)
            ]);

            // Send email alert for high/critical severity
            if (in_array($severity, ['high', 'critical'])) {
                $this->sendEmailAlert($type, $severity, $title, $message);
            }

        } catch (Exception $e) {
            $this->logger->error('Failed to create alert', [
                'error' => $e->getMessage(),
                'alert_type' => $type
            ]);
        }
    }

    /**
     * Get system health dashboard data
     */
    public function getDashboardData(): array
    {
        try {
            // Get error statistics
            $errorStats = $this->getErrorStatistics();
            
            // Get performance metrics
            $performanceStats = $this->getPerformanceStatistics();
            
            // Get system health
            $systemHealth = $this->getSystemHealthStatus();
            
            // Get active alerts
            $activeAlerts = $this->getActiveAlerts();
            
            // Get recent events
            $recentEvents = $this->getRecentEvents();

            return [
                'timestamp' => date('Y-m-d H:i:s'),
                'status' => $this->getOverallSystemStatus(),
                'errors' => $errorStats,
                'performance' => $performanceStats,
                'system_health' => $systemHealth,
                'alerts' => $activeAlerts,
                'recent_events' => $recentEvents
            ];

        } catch (Exception $e) {
            $this->logger->error('Failed to get dashboard data', ['error' => $e->getMessage()]);
            return [
                'timestamp' => date('Y-m-d H:i:s'),
                'status' => 'error',
                'error' => 'Failed to load dashboard data'
            ];
        }
    }

    /**
     * Get error statistics
     */
    private function getErrorStatistics(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_errors,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as errors_last_hour,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as errors_last_24h,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_errors,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_errors
            FROM error_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get performance statistics
     */
    private function getPerformanceStatistics(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                AVG(response_time) as avg_response_time,
                MAX(response_time) as max_response_time,
                MIN(response_time) as min_response_time,
                COUNT(*) as total_requests,
                COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests
            FROM performance_metrics 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get system health status
     */
    private function getSystemHealthStatus(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                check_type,
                status,
                AVG(response_time) as avg_response_time,
                MAX(created_at) as last_check
            FROM system_health_checks 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            GROUP BY check_type, status
            ORDER BY last_check DESC
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get active alerts
     */
    private function getActiveAlerts(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT * FROM monitoring_alerts 
            WHERE status = 'active' 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get recent events
     */
    private function getRecentEvents(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT * FROM custom_events 
            ORDER BY created_at DESC 
            LIMIT 20
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Get overall system status
     */
    private function getOverallSystemStatus(): string
    {
        // Check for critical alerts
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as critical_count 
            FROM monitoring_alerts 
            WHERE status = 'active' AND severity = 'critical'
        ");
        $stmt->execute();
        $criticalCount = $stmt->fetchColumn();

        if ($criticalCount > 0) {
            return 'critical';
        }

        // Check error rate
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as error_count 
            FROM error_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->execute();
        $errorCount = $stmt->fetchColumn();

        if ($errorCount > $this->config['alert_thresholds']['error_rate']) {
            return 'warning';
        }

        return 'healthy';
    }

    /**
     * Check error rate and create alert if needed
     */
    private function checkErrorRateAlert(): void
    {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as error_count 
            FROM error_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->execute();
        $errorCount = $stmt->fetchColumn();

        if ($errorCount > $this->config['alert_thresholds']['error_rate']) {
            $this->createAlert(
                'error_rate',
                'high',
                'High Error Rate Detected',
                "Error rate of {$errorCount} errors per hour exceeds threshold of {$this->config['alert_thresholds']['error_rate']}"
            );
        }
    }

    /**
     * Send email alert
     */
    private function sendEmailAlert(string $type, string $severity, string $title, string $message): void
    {
        try {
            // Simple email sending (you can enhance this with proper email service)
            $to = $this->config['alert_email'];
            $subject = "Ling Industri Alert: {$title}";
            $body = "
                Alert Type: {$type}
                Severity: {$severity}
                Title: {$title}
                Message: {$message}
                Timestamp: " . date('Y-m-d H:i:s') . "
                
                Please check the monitoring dashboard for more details.
            ";

            mail($to, $subject, $body);

        } catch (Exception $e) {
            $this->logger->error('Failed to send email alert', [
                'error' => $e->getMessage(),
                'alert_type' => $type
            ]);
        }
    }

    /**
     * Clean old monitoring data
     */
    public function cleanOldData(): void
    {
        try {
            $retentionDate = date('Y-m-d', strtotime("-{$this->config['retention_days']} days"));

            $tables = [
                'error_logs',
                'performance_metrics',
                'system_health_checks',
                'request_logs',
                'custom_events'
            ];

            foreach ($tables as $table) {
                $stmt = $this->pdo->prepare("DELETE FROM {$table} WHERE created_at < ?");
                $stmt->execute([$retentionDate]);
                
                $deletedRows = $stmt->rowCount();
                $this->logger->info("Cleaned {$deletedRows} old records from {$table}");
            }

        } catch (Exception $e) {
            $this->logger->error('Failed to clean old monitoring data', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
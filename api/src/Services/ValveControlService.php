<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use IndoWater\Api\Models\Valve;
use IndoWater\Api\Models\ValveCommand;
use IndoWater\Api\Models\Meter;
use IndoWater\Api\Services\RealtimeService;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class ValveControlService
{
    private Valve $valveModel;
    private ValveCommand $commandModel;
    private Meter $meterModel;
    private RealtimeService $realtimeService;
    private CacheService $cache;
    private LoggerInterface $logger;

    public function __construct(
        Valve $valveModel,
        ValveCommand $commandModel,
        Meter $meterModel,
        RealtimeService $realtimeService,
        CacheService $cache,
        LoggerInterface $logger
    ) {
        $this->valveModel = $valveModel;
        $this->commandModel = $commandModel;
        $this->meterModel = $meterModel;
        $this->realtimeService = $realtimeService;
        $this->cache = $cache;
        $this->logger = $logger;
    }

    /**
     * Send a command to open a valve
     */
    public function openValve(string $valveId, string $userId, string $reason = 'Manual open command', string $priority = 'normal'): array
    {
        return $this->sendValveCommand($valveId, 'open', null, $userId, $reason, $priority);
    }

    /**
     * Send a command to close a valve
     */
    public function closeValve(string $valveId, string $userId, string $reason = 'Manual close command', string $priority = 'normal'): array
    {
        return $this->sendValveCommand($valveId, 'close', null, $userId, $reason, $priority);
    }

    /**
     * Send a command to partially open a valve
     */
    public function partialOpenValve(string $valveId, int $percentage, string $userId, string $reason = 'Partial open command', string $priority = 'normal'): array
    {
        if ($percentage < 0 || $percentage > 100) {
            throw new \InvalidArgumentException('Percentage must be between 0 and 100');
        }

        $commandValue = ['percentage' => $percentage];
        return $this->sendValveCommand($valveId, 'partial_open', $commandValue, $userId, $reason, $priority);
    }

    /**
     * Send an emergency close command
     */
    public function emergencyCloseValve(string $valveId, string $userId, string $reason = 'Emergency close'): array
    {
        return $this->sendValveCommand($valveId, 'emergency_close', null, $userId, $reason, 'emergency');
    }

    /**
     * Send a status check command
     */
    public function checkValveStatus(string $valveId, string $userId): array
    {
        return $this->sendValveCommand($valveId, 'status_check', null, $userId, 'Status check request', 'normal');
    }

    /**
     * Generic method to send valve commands
     */
    private function sendValveCommand(string $valveId, string $commandType, ?array $commandValue, string $userId, string $reason, string $priority): array
    {
        // Find valve
        $valve = $this->valveModel->find($valveId);
        if (!$valve) {
            throw new \Exception('Valve not found');
        }

        // Check if valve is in a state that can accept commands
        if ($valve['status'] === 'inactive') {
            throw new \Exception('Cannot send commands to inactive valve');
        }

        if ($valve['status'] === 'maintenance') {
            throw new \Exception('Valve is under maintenance');
        }

        // Check for manual override
        if ($valve['is_manual_override'] && $commandType !== 'emergency_close') {
            throw new \Exception('Valve is in manual override mode. Only emergency commands are allowed.');
        }

        // Cancel any pending commands for this valve (except emergency commands)
        if ($priority === 'emergency') {
            $this->commandModel->cancelPendingCommands($valveId, 'Cancelled due to emergency command');
        }

        // Create command
        $commandData = [
            'valve_id' => $valveId,
            'command_type' => $commandType,
            'command_value' => $commandValue,
            'initiated_by' => $userId,
            'reason' => $reason,
            'priority' => $priority
        ];

        $commandId = $this->commandModel->createCommand($commandData);

        // Log the command
        $this->logger->info('Valve command created', [
            'command_id' => $commandId,
            'valve_id' => $valve['valve_id'],
            'command_type' => $commandType,
            'priority' => $priority,
            'initiated_by' => $userId
        ]);

        // Send command to device (this would integrate with your IoT communication system)
        $this->sendCommandToDevice($commandId, $valve, $commandType, $commandValue);

        // Broadcast real-time update
        $this->realtimeService->broadcastValveCommand($valve['valve_id'], [
            'command_id' => $commandId,
            'command_type' => $commandType,
            'status' => 'pending',
            'timestamp' => time()
        ]);

        // Invalidate cache
        $this->invalidateValveCache($valveId);

        return [
            'command_id' => $commandId,
            'valve_id' => $valve['valve_id'],
            'command_type' => $commandType,
            'status' => 'pending',
            'priority' => $priority,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Process command response from device
     */
    public function processCommandResponse(string $commandId, array $responseData): bool
    {
        $command = $this->commandModel->find($commandId);
        if (!$command) {
            throw new \Exception('Command not found');
        }

        $valve = $this->valveModel->find($command['valve_id']);
        if (!$valve) {
            throw new \Exception('Valve not found');
        }

        // Update command status
        $status = $responseData['success'] ?? false ? 'completed' : 'failed';
        $errorMessage = $responseData['error'] ?? null;

        $this->commandModel->updateCommandStatus($commandId, $status, $responseData, $errorMessage);

        // Update valve state if command was successful
        if ($status === 'completed' && isset($responseData['valve_state'])) {
            $this->valveModel->updateState($command['valve_id'], $responseData['valve_state'], $commandId);
        }

        // Update device status if provided
        if (isset($responseData['device_status'])) {
            $this->valveModel->updateDeviceStatus($command['valve_id'], $responseData['device_status']);
        }

        // Log the response
        $this->logger->info('Valve command response processed', [
            'command_id' => $commandId,
            'valve_id' => $valve['valve_id'],
            'status' => $status,
            'response_data' => $responseData
        ]);

        // Broadcast real-time update
        $this->realtimeService->broadcastValveUpdate($valve['valve_id'], [
            'command_id' => $commandId,
            'status' => $status,
            'valve_state' => $responseData['valve_state'] ?? $valve['current_state'],
            'timestamp' => time()
        ]);

        // Check for alerts
        $this->checkAndCreateAlerts($command['valve_id'], $responseData);

        // Invalidate cache
        $this->invalidateValveCache($command['valve_id']);

        return $status === 'completed';
    }

    /**
     * Auto-close valve when credit runs out
     */
    public function autoCloseValveForLowCredit(string $meterId): array
    {
        $meter = $this->meterModel->find($meterId);
        if (!$meter) {
            throw new \Exception('Meter not found');
        }

        // Check if auto valve control is enabled
        if (!$meter['auto_valve_control']) {
            return ['message' => 'Auto valve control is disabled for this meter'];
        }

        // Find valves for this meter
        $valves = $this->valveModel->findByMeterId($meterId);
        if (empty($valves)) {
            return ['message' => 'No valves found for this meter'];
        }

        $results = [];
        foreach ($valves as $valve) {
            if ($valve['auto_close_enabled'] && $valve['current_state'] !== 'closed') {
                try {
                    $result = $this->sendValveCommand(
                        $valve['id'],
                        'close',
                        null,
                        'system', // System user
                        'Auto-close due to insufficient credit',
                        'high'
                    );
                    $results[] = $result;
                } catch (\Exception $e) {
                    $this->logger->error('Failed to auto-close valve', [
                        'valve_id' => $valve['valve_id'],
                        'meter_id' => $meter['meter_id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return $results;
    }

    /**
     * Auto-open valve when credit is restored
     */
    public function autoOpenValveForCreditRestore(string $meterId): array
    {
        $meter = $this->meterModel->find($meterId);
        if (!$meter) {
            throw new \Exception('Meter not found');
        }

        // Check if auto valve control is enabled
        if (!$meter['auto_valve_control']) {
            return ['message' => 'Auto valve control is disabled for this meter'];
        }

        // Find valves for this meter
        $valves = $this->valveModel->findByMeterId($meterId);
        if (empty($valves)) {
            return ['message' => 'No valves found for this meter'];
        }

        $results = [];
        foreach ($valves as $valve) {
            if ($valve['auto_close_enabled'] && $valve['current_state'] === 'closed') {
                try {
                    $result = $this->sendValveCommand(
                        $valve['id'],
                        'open',
                        null,
                        'system', // System user
                        'Auto-open due to credit restoration',
                        'normal'
                    );
                    $results[] = $result;
                } catch (\Exception $e) {
                    $this->logger->error('Failed to auto-open valve', [
                        'valve_id' => $valve['valve_id'],
                        'meter_id' => $meter['meter_id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return $results;
    }

    /**
     * Get valve status with real-time data
     */
    public function getValveStatus(string $valveId): array
    {
        $cacheKey = "valve_status:{$valveId}";
        
        return $this->cache->remember($cacheKey, 60, function() use ($valveId) {
            $valve = $this->valveModel->find($valveId);
            if (!$valve) {
                throw new \Exception('Valve not found');
            }

            // Get recent commands
            $recentCommands = $this->commandModel->getCommandsByValve($valveId, 5);
            
            // Get active alerts
            $activeAlerts = $this->valveModel->getActiveAlerts($valveId);
            
            // Get associated meter
            $meter = $this->meterModel->find($valve['meter_id']);

            return [
                'valve' => $valve,
                'meter' => $meter ? [
                    'meter_id' => $meter['meter_id'],
                    'last_credit' => $meter['last_credit'],
                    'auto_valve_control' => $meter['auto_valve_control']
                ] : null,
                'recent_commands' => $recentCommands,
                'active_alerts' => $activeAlerts,
                'health_status' => $this->calculateHealthStatus($valve),
                'last_updated' => date('Y-m-d H:i:s')
            ];
        });
    }

    /**
     * Get system-wide valve statistics
     */
    public function getSystemStatistics(): array
    {
        $cacheKey = 'valve_system_stats';
        
        return $this->cache->remember($cacheKey, 300, function() {
            $valveStats = $this->valveModel->getStatistics();
            $commandStats = $this->commandModel->getCommandStatistics();
            
            // Get offline valves
            $offlineValves = $this->valveModel->getOfflineValves();
            
            // Get low battery valves
            $lowBatteryValves = $this->valveModel->getLowBatteryValves();
            
            // Get maintenance due
            $maintenanceDue = $this->valveModel->getMaintenanceDue();

            return [
                'valve_statistics' => $valveStats,
                'command_statistics' => $commandStats,
                'health_issues' => [
                    'offline_valves' => count($offlineValves),
                    'low_battery_valves' => count($lowBatteryValves),
                    'maintenance_due' => count($maintenanceDue)
                ],
                'system_health' => $this->calculateSystemHealth($valveStats),
                'last_updated' => date('Y-m-d H:i:s')
            ];
        });
    }

    /**
     * Process pending commands (called by cron job)
     */
    public function processPendingCommands(): array
    {
        $pendingCommands = $this->commandModel->getPendingCommands();
        $processed = 0;
        $failed = 0;

        foreach ($pendingCommands as $command) {
            try {
                // Check if command has expired
                if ($command['queue_status'] === 'expired') {
                    $this->commandModel->updateCommandStatus($command['id'], 'timeout', null, 'Command expired');
                    $failed++;
                    continue;
                }

                // Retry sending command to device
                $valve = $this->valveModel->find($command['valve_id']);
                if ($valve) {
                    $this->sendCommandToDevice(
                        $command['id'], 
                        $valve, 
                        $command['command_type'], 
                        json_decode($command['command_value'], true)
                    );
                    $processed++;
                }

            } catch (\Exception $e) {
                $this->logger->error('Failed to process valve command', [
                    'command_id' => $command['id'],
                    'error' => $e->getMessage()
                ]);
                $failed++;
            }
        }

        // Cleanup expired commands
        $expiredCount = $this->commandModel->cleanupExpiredCommands();

        return [
            'processed' => $processed,
            'failed' => $failed,
            'expired_cleaned' => $expiredCount,
            'total_pending' => count($pendingCommands)
        ];
    }

    /**
     * Send command to physical device (integrate with your IoT system)
     */
    private function sendCommandToDevice(string $commandId, array $valve, string $commandType, ?array $commandValue): void
    {
        try {
            // This is where you would integrate with your IoT communication system
            // Examples: MQTT, HTTP API, LoRaWAN, etc.
            
            $devicePayload = [
                'command_id' => $commandId,
                'valve_id' => $valve['valve_id'],
                'command' => $commandType,
                'parameters' => $commandValue,
                'timestamp' => time(),
                'timeout' => 30
            ];

            // Example MQTT publish (you would implement this based on your IoT setup)
            $this->publishToMQTT("valves/{$valve['valve_id']}/commands", $devicePayload);

            // Update command status to 'sent'
            $this->commandModel->updateCommandStatus($commandId, 'sent');

            $this->logger->info('Command sent to valve device', [
                'command_id' => $commandId,
                'valve_id' => $valve['valve_id'],
                'command_type' => $commandType
            ]);

        } catch (\Exception $e) {
            // Mark command as failed
            $this->commandModel->updateCommandStatus($commandId, 'failed', null, $e->getMessage());
            
            $this->logger->error('Failed to send command to valve device', [
                'command_id' => $commandId,
                'valve_id' => $valve['valve_id'],
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Placeholder for MQTT publishing (implement based on your setup)
     */
    private function publishToMQTT(string $topic, array $payload): void
    {
        // This is a placeholder - implement based on your MQTT setup
        // Example using ReactPHP MQTT or similar:
        /*
        $mqtt = new \React\Socket\Connector();
        $client = new \BinSoul\Net\Mqtt\Client\React\ReactMqttClient($mqtt);
        $client->publish($topic, json_encode($payload));
        */
        
        // For now, we'll just log the command
        $this->logger->info('MQTT command published', [
            'topic' => $topic,
            'payload' => $payload
        ]);
    }

    /**
     * Calculate health status for a valve
     */
    private function calculateHealthStatus(array $valve): string
    {
        if ($valve['status'] === 'offline') return 'offline';
        if ($valve['status'] === 'error') return 'error';
        if ($valve['status'] === 'maintenance') return 'maintenance';
        
        if ($valve['battery_level'] !== null && $valve['battery_level'] < 20) return 'low_battery';
        if ($valve['signal_strength'] !== null && $valve['signal_strength'] < -80) return 'weak_signal';
        if ($valve['operating_pressure'] !== null && $valve['operating_pressure'] > $valve['max_pressure'] * 0.9) return 'high_pressure';
        
        // Check last response time
        if ($valve['last_response_at']) {
            $lastResponseTime = strtotime($valve['last_response_at']);
            if (time() - $lastResponseTime > 1800) { // 30 minutes
                return 'communication_lost';
            }
        }

        return 'normal';
    }

    /**
     * Calculate overall system health
     */
    private function calculateSystemHealth(array $stats): string
    {
        $totalValves = $stats['total_valves'];
        if ($totalValves === 0) return 'no_valves';

        $healthyValves = $stats['active_valves'];
        $healthPercentage = ($healthyValves / $totalValves) * 100;

        if ($healthPercentage >= 95) return 'excellent';
        if ($healthPercentage >= 85) return 'good';
        if ($healthPercentage >= 70) return 'fair';
        if ($healthPercentage >= 50) return 'poor';
        
        return 'critical';
    }

    /**
     * Check and create alerts based on valve status
     */
    private function checkAndCreateAlerts(string $valveId, array $responseData): void
    {
        $valve = $this->valveModel->find($valveId);
        if (!$valve) return;

        // Check battery level
        if (isset($responseData['device_status']['battery_level'])) {
            $batteryLevel = $responseData['device_status']['battery_level'];
            if ($batteryLevel <= 20 && $batteryLevel > 10) {
                $this->valveModel->createAlert(
                    $valveId,
                    'low_battery',
                    'warning',
                    'Low Battery Warning',
                    "Valve {$valve['valve_id']} battery level is {$batteryLevel}%",
                    ['battery_level' => $batteryLevel]
                );
            } elseif ($batteryLevel <= 10) {
                $this->valveModel->createAlert(
                    $valveId,
                    'low_battery',
                    'critical',
                    'Critical Battery Level',
                    "Valve {$valve['valve_id']} battery level is critically low at {$batteryLevel}%",
                    ['battery_level' => $batteryLevel]
                );
            }
        }

        // Check pressure
        if (isset($responseData['device_status']['operating_pressure'])) {
            $pressure = $responseData['device_status']['operating_pressure'];
            $maxPressure = $valve['max_pressure'];
            
            if ($pressure > $maxPressure * 0.9) {
                $this->valveModel->createAlert(
                    $valveId,
                    'pressure_high',
                    'warning',
                    'High Pressure Warning',
                    "Valve {$valve['valve_id']} operating pressure is {$pressure} bar (max: {$maxPressure} bar)",
                    ['pressure' => $pressure, 'max_pressure' => $maxPressure]
                );
            }
        }

        // Check signal strength
        if (isset($responseData['device_status']['signal_strength'])) {
            $signalStrength = $responseData['device_status']['signal_strength'];
            if ($signalStrength < -80) {
                $this->valveModel->createAlert(
                    $valveId,
                    'communication_lost',
                    'warning',
                    'Weak Signal',
                    "Valve {$valve['valve_id']} has weak signal strength: {$signalStrength} dBm",
                    ['signal_strength' => $signalStrength]
                );
            }
        }
    }

    /**
     * Invalidate valve-related cache
     */
    private function invalidateValveCache(string $valveId): void
    {
        $patterns = [
            "valve_status:{$valveId}",
            "valve_commands:{$valveId}*",
            "valve_system_stats",
            "valves:*"
        ];

        foreach ($patterns as $pattern) {
            $this->cache->delete($pattern);
        }
    }

    /**
     * Enable manual override for a valve
     */
    public function enableManualOverride(string $valveId, string $userId, string $reason): bool
    {
        $valve = $this->valveModel->find($valveId);
        if (!$valve) {
            throw new \Exception('Valve not found');
        }

        $updateData = [
            'is_manual_override' => true,
            'manual_override_reason' => $reason,
            'manual_override_at' => date('Y-m-d H:i:s')
        ];

        $result = $this->valveModel->update($valveId, $updateData);

        if ($result) {
            $this->valveModel->createAlert(
                $valveId,
                'manual_override',
                'info',
                'Manual Override Enabled',
                "Manual override enabled for valve {$valve['valve_id']}. Reason: {$reason}",
                ['enabled_by' => $userId, 'reason' => $reason]
            );

            $this->logger->info('Manual override enabled', [
                'valve_id' => $valve['valve_id'],
                'user_id' => $userId,
                'reason' => $reason
            ]);
        }

        return $result;
    }

    /**
     * Disable manual override for a valve
     */
    public function disableManualOverride(string $valveId, string $userId): bool
    {
        $valve = $this->valveModel->find($valveId);
        if (!$valve) {
            throw new \Exception('Valve not found');
        }

        $updateData = [
            'is_manual_override' => false,
            'manual_override_reason' => null,
            'manual_override_at' => null
        ];

        $result = $this->valveModel->update($valveId, $updateData);

        if ($result) {
            $this->logger->info('Manual override disabled', [
                'valve_id' => $valve['valve_id'],
                'user_id' => $userId
            ]);
        }

        return $result;
    }
}
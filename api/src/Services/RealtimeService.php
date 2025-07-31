<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use IndoWater\Api\Models\Meter;
use IndoWater\Api\Models\Customer;

class RealtimeService
{
    private Meter $meterModel;
    private Customer $customerModel;

    public function __construct(Meter $meterModel, Customer $customerModel)
    {
        $this->meterModel = $meterModel;
        $this->customerModel = $customerModel;
    }

    public function streamMeterData(string $userId, string $role): void
    {
        // Set headers for SSE
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Cache-Control');

        // Disable output buffering
        if (ob_get_level()) {
            ob_end_clean();
        }

        $lastEventId = $_SERVER['HTTP_LAST_EVENT_ID'] ?? 0;
        $eventId = $lastEventId + 1;

        while (true) {
            // Get meter data based on user role
            $meterData = $this->getMeterDataForUser($userId, $role);
            
            // Send data as SSE event
            echo "id: {$eventId}\n";
            echo "event: meter-update\n";
            echo "data: " . json_encode([
                'timestamp' => time(),
                'meters' => $meterData
            ]) . "\n\n";

            // Flush output
            if (ob_get_level()) {
                ob_flush();
            }
            flush();

            // Check if client disconnected
            if (connection_aborted()) {
                break;
            }

            $eventId++;
            sleep(5); // Update every 5 seconds
        }
    }

    public function streamNotifications(string $userId): void
    {
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Cache-Control');

        if (ob_get_level()) {
            ob_end_clean();
        }

        $lastEventId = $_SERVER['HTTP_LAST_EVENT_ID'] ?? 0;
        $eventId = $lastEventId + 1;

        while (true) {
            // Get unread notifications for user
            $notifications = $this->getUnreadNotifications($userId);
            
            if (!empty($notifications)) {
                echo "id: {$eventId}\n";
                echo "event: notification\n";
                echo "data: " . json_encode([
                    'timestamp' => time(),
                    'notifications' => $notifications
                ]) . "\n\n";

                if (ob_get_level()) {
                    ob_flush();
                }
                flush();
            }

            if (connection_aborted()) {
                break;
            }

            $eventId++;
            sleep(10); // Check every 10 seconds
        }
    }

    public function getMeterStatus(string $meterId): array
    {
        $meter = $this->meterModel->findByMeterId($meterId);
        
        if (!$meter) {
            throw new \Exception('Meter not found', 404);
        }

        // Get latest readings
        $readings = $this->meterModel->getReadings($meter['id'], 1);
        $latestReading = $readings[0] ?? null;

        return [
            'meter_id' => $meter['meter_id'],
            'status' => $meter['status'],
            'last_reading' => $meter['last_reading'],
            'last_reading_at' => $meter['last_reading_at'],
            'last_credit' => $meter['last_credit'],
            'last_credit_at' => $meter['last_credit_at'],
            'latest_data' => $latestReading ? [
                'reading' => $latestReading['reading'],
                'flow_rate' => $latestReading['flow_rate'],
                'battery_level' => $latestReading['battery_level'],
                'signal_strength' => $latestReading['signal_strength'],
                'temperature' => $latestReading['temperature'],
                'pressure' => $latestReading['pressure'],
                'timestamp' => $latestReading['created_at']
            ] : null,
            'alerts' => $this->getMeterAlerts($meter)
        ];
    }

    public function pollMeterUpdates(string $userId, string $role, int $since = 0): array
    {
        $meters = $this->getMeterDataForUser($userId, $role);
        $updates = [];

        foreach ($meters as $meter) {
            $lastUpdate = strtotime($meter['updated_at']);
            if ($lastUpdate > $since) {
                $updates[] = [
                    'meter_id' => $meter['meter_id'],
                    'status' => $meter['status'],
                    'last_reading' => $meter['last_reading'],
                    'last_credit' => $meter['last_credit'],
                    'updated_at' => $meter['updated_at']
                ];
            }
        }

        return [
            'timestamp' => time(),
            'updates' => $updates,
            'has_updates' => !empty($updates)
        ];
    }

    private function getMeterDataForUser(string $userId, string $role): array
    {
        switch ($role) {
            case 'superadmin':
                // Superadmin can see all meters
                return $this->meterModel->findAll([], 50);
                
            case 'client':
                // Client can see meters for their customers
                $client = $this->getClientByUserId($userId);
                if ($client) {
                    return $this->getClientMeters($client['id']);
                }
                return [];
                
            case 'customer':
                // Customer can only see their own meters
                $customer = $this->customerModel->findByUserId($userId);
                if ($customer) {
                    return $this->customerModel->getMeters($customer['id']);
                }
                return [];
                
            default:
                return [];
        }
    }

    private function getClientByUserId(string $userId): ?array
    {
        // This would typically use a Client model
        // For now, we'll use a direct query
        return null; // Placeholder
    }

    private function getClientMeters(string $clientId): array
    {
        // This would get all meters for a client's customers
        return []; // Placeholder
    }

    private function getUnreadNotifications(string $userId): array
    {
        // This would query the notifications table
        return []; // Placeholder
    }

    private function getMeterAlerts(array $meter): array
    {
        $alerts = [];

        // Low credit alert
        if ($meter['last_credit'] < 10000) { // Less than 10,000 units
            $alerts[] = [
                'type' => 'low_credit',
                'severity' => 'warning',
                'message' => 'Credit balance is low',
                'value' => $meter['last_credit']
            ];
        }

        // No recent reading alert
        if ($meter['last_reading_at']) {
            $lastReadingTime = strtotime($meter['last_reading_at']);
            $hoursSinceReading = (time() - $lastReadingTime) / 3600;
            
            if ($hoursSinceReading > 24) {
                $alerts[] = [
                    'type' => 'no_reading',
                    'severity' => 'error',
                    'message' => 'No reading received in 24 hours',
                    'hours_since' => round($hoursSinceReading, 1)
                ];
            }
        }

        // Meter offline alert
        if ($meter['status'] === 'disconnected') {
            $alerts[] = [
                'type' => 'offline',
                'severity' => 'error',
                'message' => 'Meter is offline'
            ];
        }

        return $alerts;
    }

    /**
     * Broadcast property update to relevant users
     */
    public function broadcastPropertyUpdate(string $propertyId, string $action, array $propertyData): void
    {
        $update = [
            'type' => 'property_update',
            'property_id' => $propertyId,
            'action' => $action, // created, updated, deleted, verification_updated, meter_associated, meter_dissociated
            'data' => $propertyData,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Store update for polling clients
        $this->storeUpdate($update);

        // Send to SSE clients (if implemented)
        $this->broadcastToSSE($update);
    }

    /**
     * Get property updates for polling
     */
    public function getPropertyUpdates(string $clientId = null, int $limit = 50): array
    {
        $updates = $this->getStoredUpdates('property_update', $limit);
        
        // Filter by client if specified
        if ($clientId) {
            $updates = array_filter($updates, function($update) use ($clientId) {
                return isset($update['data']['client_id']) && $update['data']['client_id'] === $clientId;
            });
        }

        return array_values($updates);
    }

    /**
     * Send property verification notification
     */
    public function sendPropertyVerificationNotification(array $property, string $status): void
    {
        $notification = [
            'type' => 'property_verification',
            'property_id' => $property['id'],
            'property_name' => $property['name'],
            'status' => $status,
            'message' => $this->getVerificationMessage($status),
            'timestamp' => date('Y-m-d H:i:s')
        ];

        // Send to client users
        $this->sendNotificationToClient($property['client_id'], $notification);
    }

    /**
     * Send document expiry alerts
     */
    public function sendDocumentExpiryAlerts(array $documents): void
    {
        foreach ($documents as $document) {
            $notification = [
                'type' => 'document_expiry',
                'property_id' => $document['property_id'],
                'property_name' => $document['property_name'],
                'document_type' => $document['document_type'],
                'expiry_date' => $document['expiry_date'],
                'days_until_expiry' => $document['days_until_expiry'],
                'message' => "Document '{$document['document_name']}' expires in {$document['days_until_expiry']} days",
                'timestamp' => date('Y-m-d H:i:s')
            ];

            // Send to property owner/client
            $this->sendNotificationToClient($document['client_id'], $notification);
        }
    }

    /**
     * Get verification status message
     */
    private function getVerificationMessage(string $status): string
    {
        return match($status) {
            'pending' => 'Property registration submitted for review',
            'under_review' => 'Property registration is under review',
            'approved' => 'Property registration approved! You can now add meters.',
            'rejected' => 'Property registration rejected. Please review and resubmit.',
            'requires_update' => 'Property registration requires updates. Please review and update.',
            default => 'Property verification status updated'
        };
    }

    /**
     * Send notification to all users of a client
     */
    private function sendNotificationToClient(string $clientId, array $notification): void
    {
        // This would query users belonging to the client and send notifications
        // For now, we'll store it as a general update
        $update = [
            'type' => 'notification',
            'client_id' => $clientId,
            'data' => $notification,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $this->storeUpdate($update);
        $this->broadcastToSSE($update);
    }

    /**
     * Store update for polling clients
     */
    private function storeUpdate(array $update): void
    {
        // In a real implementation, this would store in Redis or database
        // For now, we'll use a simple file-based storage
        $updatesFile = sys_get_temp_dir() . '/indowater_updates.json';
        
        $updates = [];
        if (file_exists($updatesFile)) {
            $updates = json_decode(file_get_contents($updatesFile), true) ?: [];
        }

        $updates[] = $update;
        
        // Keep only last 1000 updates
        if (count($updates) > 1000) {
            $updates = array_slice($updates, -1000);
        }

        file_put_contents($updatesFile, json_encode($updates));
    }

    /**
     * Get stored updates
     */
    private function getStoredUpdates(string $type = null, int $limit = 50): array
    {
        $updatesFile = sys_get_temp_dir() . '/indowater_updates.json';
        
        if (!file_exists($updatesFile)) {
            return [];
        }

        $updates = json_decode(file_get_contents($updatesFile), true) ?: [];
        
        // Filter by type if specified
        if ($type) {
            $updates = array_filter($updates, function($update) use ($type) {
                return $update['type'] === $type;
            });
        }

        // Sort by timestamp (newest first)
        usort($updates, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        return array_slice($updates, 0, $limit);
    }

    /**
     * Broadcast to SSE clients (placeholder)
     */
    private function broadcastToSSE(array $update): void
    {
        // This would broadcast to Server-Sent Events clients
        // Implementation depends on your SSE setup
    }
}
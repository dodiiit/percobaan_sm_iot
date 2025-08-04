<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\RealtimeService;

class RealtimeController
{
    private RealtimeService $realtimeService;

    public function __construct(RealtimeService $realtimeService)
    {
        $this->realtimeService = $realtimeService;
    }

    public function streamMeterData(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            
            if (!$user) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 401);
            }

            // This will stream data using SSE
            $this->realtimeService->streamMeterData($user['id'], $user['role']);
            
            // This return statement won't be reached due to the streaming nature
            return $response;

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function streamNotifications(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            
            if (!$user) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 401);
            }

            // This will stream notifications using SSE
            $this->realtimeService->streamNotifications($user['id']);
            
            // This return statement won't be reached due to the streaming nature
            return $response;

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function pollUpdates(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $queryParams = $request->getQueryParams();
            $since = (int) ($queryParams['since'] ?? 0);

            if (!$user) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 401);
            }

            $updates = $this->realtimeService->pollMeterUpdates($user['id'], $user['role'], $since);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $updates
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function meterStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $meterId = $args['meter_id'];
            $status = $this->realtimeService->getMeterStatus($meterId);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $status
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function webhook(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $headers = $request->getHeaders();

            // Validate webhook signature if needed
            // $signature = $headers['X-Webhook-Signature'][0] ?? '';

            // Process webhook data
            $this->processWebhookData($data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Webhook processed successfully'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function processWebhookData(array $data): void
    {
        // Process different types of webhook data
        $type = $data['type'] ?? '';

        switch ($type) {
            case 'meter_reading':
                $this->processMeterReading($data);
                break;
            case 'meter_status':
                $this->processMeterStatus($data);
                break;
            case 'alert':
                $this->processAlert($data);
                break;
            default:
                throw new \Exception('Unknown webhook type: ' . $type);
        }
    }

    private function processMeterReading(array $data): void
    {
        // Extract meter reading data
        $meterId = $data['meter_id'] ?? '';
        $reading = $data['reading'] ?? 0;
        $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');

        // Additional sensor data
        $sensorData = [
            'flow_rate' => $data['flow_rate'] ?? null,
            'battery_level' => $data['battery_level'] ?? null,
            'signal_strength' => $data['signal_strength'] ?? null,
            'temperature' => $data['temperature'] ?? null,
            'pressure' => $data['pressure'] ?? null
        ];

        // Find meter and update reading
        // This would use the Meter model to update the reading
        // and create a new meter_readings record
    }

    private function processMeterStatus(array $data): void
    {
        // Process meter status updates
        $meterId = $data['meter_id'] ?? '';
        $status = $data['status'] ?? '';
        
        // Update meter status in database
    }

    private function processAlert(array $data): void
    {
        // Process alerts and notifications
        $meterId = $data['meter_id'] ?? '';
        $alertType = $data['alert_type'] ?? '';
        $message = $data['message'] ?? '';
        
        // Create notification record
        // Send notifications to relevant users
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use Psr\Log\LoggerInterface;

class WebhookRetryService
{
    private LoggerInterface $logger;
    private CacheService $cache;
    private int $maxRetries;
    private array $retryDelays;

    public function __construct(
        LoggerInterface $logger,
        CacheService $cache,
        int $maxRetries = 3,
        array $retryDelays = [60, 300, 900] // 1min, 5min, 15min
    ) {
        $this->logger = $logger;
        $this->cache = $cache;
        $this->maxRetries = $maxRetries;
        $this->retryDelays = $retryDelays;
    }

    /**
     * Queue a webhook for retry
     */
    public function queueRetry(string $webhookId, string $method, array $data, int $attempt = 1): void
    {
        if ($attempt > $this->maxRetries) {
            $this->logger->error('Webhook max retries exceeded', [
                'webhook_id' => $webhookId,
                'method' => $method,
                'attempt' => $attempt
            ]);
            return;
        }

        $retryData = [
            'webhook_id' => $webhookId,
            'method' => $method,
            'data' => $data,
            'attempt' => $attempt,
            'queued_at' => time(),
            'retry_at' => time() + ($this->retryDelays[$attempt - 1] ?? 900)
        ];

        $cacheKey = "webhook_retry:{$webhookId}:{$attempt}";
        $this->cache->set($cacheKey, $retryData, $this->retryDelays[$attempt - 1] ?? 900);

        $this->logger->info('Webhook queued for retry', [
            'webhook_id' => $webhookId,
            'method' => $method,
            'attempt' => $attempt,
            'retry_in_seconds' => $this->retryDelays[$attempt - 1] ?? 900
        ]);
    }

    /**
     * Process pending webhook retries
     */
    public function processPendingRetries(PaymentService $paymentService): int
    {
        $processed = 0;
        $pattern = 'webhook_retry:*';
        
        try {
            $keys = $this->cache->keys($pattern);
            
            foreach ($keys as $key) {
                $retryData = $this->cache->get($key);
                
                if (!$retryData || !is_array($retryData)) {
                    continue;
                }

                // Check if it's time to retry
                if (time() < ($retryData['retry_at'] ?? 0)) {
                    continue;
                }

                $this->logger->info('Processing webhook retry', [
                    'webhook_id' => $retryData['webhook_id'],
                    'method' => $retryData['method'],
                    'attempt' => $retryData['attempt']
                ]);

                try {
                    // Attempt to process the webhook
                    $result = $paymentService->handleWebhook(
                        $retryData['method'],
                        $retryData['data']
                    );

                    // Success - remove from retry queue
                    $this->cache->delete($key);
                    $processed++;

                    $this->logger->info('Webhook retry successful', [
                        'webhook_id' => $retryData['webhook_id'],
                        'method' => $retryData['method'],
                        'attempt' => $retryData['attempt'],
                        'result' => $result
                    ]);

                } catch (\Exception $e) {
                    // Failed - queue for next retry
                    $this->cache->delete($key);
                    
                    $this->queueRetry(
                        $retryData['webhook_id'],
                        $retryData['method'],
                        $retryData['data'],
                        $retryData['attempt'] + 1
                    );

                    $this->logger->warning('Webhook retry failed', [
                        'webhook_id' => $retryData['webhook_id'],
                        'method' => $retryData['method'],
                        'attempt' => $retryData['attempt'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

        } catch (\Exception $e) {
            $this->logger->error('Failed to process webhook retries', [
                'error' => $e->getMessage()
            ]);
        }

        return $processed;
    }

    /**
     * Get retry statistics
     */
    public function getRetryStats(): array
    {
        try {
            $pattern = 'webhook_retry:*';
            $keys = $this->cache->keys($pattern);
            
            $stats = [
                'total_pending' => count($keys),
                'by_method' => [],
                'by_attempt' => []
            ];

            foreach ($keys as $key) {
                $retryData = $this->cache->get($key);
                
                if (!$retryData || !is_array($retryData)) {
                    continue;
                }

                $method = $retryData['method'] ?? 'unknown';
                $attempt = $retryData['attempt'] ?? 0;

                $stats['by_method'][$method] = ($stats['by_method'][$method] ?? 0) + 1;
                $stats['by_attempt'][$attempt] = ($stats['by_attempt'][$attempt] ?? 0) + 1;
            }

            return $stats;

        } catch (\Exception $e) {
            $this->logger->error('Failed to get retry stats', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'total_pending' => 0,
                'by_method' => [],
                'by_attempt' => [],
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Clear all pending retries
     */
    public function clearAllRetries(): int
    {
        try {
            $pattern = 'webhook_retry:*';
            $keys = $this->cache->keys($pattern);
            $cleared = 0;

            foreach ($keys as $key) {
                if ($this->cache->delete($key)) {
                    $cleared++;
                }
            }

            $this->logger->info('Cleared webhook retries', ['count' => $cleared]);
            return $cleared;

        } catch (\Exception $e) {
            $this->logger->error('Failed to clear webhook retries', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Generate unique webhook ID
     */
    public function generateWebhookId(string $method, array $data): string
    {
        $orderId = '';
        
        if ($method === 'midtrans') {
            $orderId = $data['order_id'] ?? '';
        } elseif ($method === 'doku') {
            $orderId = $data['order']['invoice_number'] ?? '';
        }

        return md5($method . ':' . $orderId . ':' . time());
    }
}
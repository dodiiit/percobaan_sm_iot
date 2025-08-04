<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use Predis\Client;
use Psr\Log\LoggerInterface;

class CacheService
{
    private Client $redis;
    private LoggerInterface $logger;
    private string $prefix;
    private int $defaultTtl;

    public function __construct(Client $redis, LoggerInterface $logger, string $prefix = 'indowater:', int $defaultTtl = 3600)
    {
        $this->redis = $redis;
        $this->logger = $logger;
        $this->prefix = $prefix;
        $this->defaultTtl = $defaultTtl;
    }

    /**
     * Get cached value
     */
    public function get(string $key): mixed
    {
        try {
            $fullKey = $this->prefix . $key;
            $value = $this->redis->get($fullKey);
            
            if ($value === null) {
                return null;
            }

            $decoded = json_decode($value, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->logger->warning("Failed to decode cached value for key: {$key}");
                return null;
            }

            return $decoded;
        } catch (\Exception $e) {
            $this->logger->error("Cache get error for key {$key}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Set cached value
     */
    public function set(string $key, mixed $value, int $ttl = null): bool
    {
        try {
            $fullKey = $this->prefix . $key;
            $ttl = $ttl ?? $this->defaultTtl;
            
            $encoded = json_encode($value);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->logger->error("Failed to encode value for cache key: {$key}");
                return false;
            }

            $result = $this->redis->setex($fullKey, $ttl, $encoded);
            return $result === 'OK';
        } catch (\Exception $e) {
            $this->logger->error("Cache set error for key {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete cached value
     */
    public function delete(string $key): bool
    {
        try {
            $fullKey = $this->prefix . $key;
            return $this->redis->del($fullKey) > 0;
        } catch (\Exception $e) {
            $this->logger->error("Cache delete error for key {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete multiple keys by pattern
     */
    public function deletePattern(string $pattern): int
    {
        try {
            $fullPattern = $this->prefix . $pattern;
            $keys = $this->redis->keys($fullPattern);
            
            if (empty($keys)) {
                return 0;
            }

            return $this->redis->del($keys);
        } catch (\Exception $e) {
            $this->logger->error("Cache delete pattern error for pattern {$pattern}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    public function exists(string $key): bool
    {
        try {
            $fullKey = $this->prefix . $key;
            return $this->redis->exists($fullKey) > 0;
        } catch (\Exception $e) {
            $this->logger->error("Cache exists error for key {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get or set cached value (cache-aside pattern)
     */
    public function remember(string $key, callable $callback, int $ttl = null): mixed
    {
        $value = $this->get($key);
        
        if ($value !== null) {
            return $value;
        }

        $value = $callback();
        $this->set($key, $value, $ttl);
        
        return $value;
    }

    /**
     * Increment a numeric value
     */
    public function increment(string $key, int $value = 1): int
    {
        try {
            $fullKey = $this->prefix . $key;
            return $this->redis->incrby($fullKey, $value);
        } catch (\Exception $e) {
            $this->logger->error("Cache increment error for key {$key}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Set expiration for a key
     */
    public function expire(string $key, int $ttl): bool
    {
        try {
            $fullKey = $this->prefix . $key;
            return $this->redis->expire($fullKey, $ttl) === 1;
        } catch (\Exception $e) {
            $this->logger->error("Cache expire error for key {$key}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get time to live for a key
     */
    public function ttl(string $key): int
    {
        try {
            $fullKey = $this->prefix . $key;
            return $this->redis->ttl($fullKey);
        } catch (\Exception $e) {
            $this->logger->error("Cache TTL error for key {$key}: " . $e->getMessage());
            return -1;
        }
    }

    /**
     * Clear all cache with current prefix
     */
    public function flush(): bool
    {
        try {
            $keys = $this->redis->keys($this->prefix . '*');
            
            if (empty($keys)) {
                return true;
            }

            return $this->redis->del($keys) > 0;
        } catch (\Exception $e) {
            $this->logger->error("Cache flush error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    public function getStats(): array
    {
        try {
            $info = $this->redis->info();
            return [
                'connected_clients' => $info['connected_clients'] ?? 0,
                'used_memory' => $info['used_memory'] ?? 0,
                'used_memory_human' => $info['used_memory_human'] ?? '0B',
                'keyspace_hits' => $info['keyspace_hits'] ?? 0,
                'keyspace_misses' => $info['keyspace_misses'] ?? 0,
                'total_commands_processed' => $info['total_commands_processed'] ?? 0,
            ];
        } catch (\Exception $e) {
            $this->logger->error("Cache stats error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Generate cache key for API responses
     */
    public function generateApiKey(string $endpoint, array $params = [], string $userId = null): string
    {
        $keyParts = ['api', $endpoint];
        
        if ($userId) {
            $keyParts[] = 'user:' . $userId;
        }
        
        if (!empty($params)) {
            ksort($params);
            $keyParts[] = md5(serialize($params));
        }
        
        return implode(':', $keyParts);
    }

    /**
     * Generate cache key for database queries
     */
    public function generateDbKey(string $table, string $method, array $params = []): string
    {
        $keyParts = ['db', $table, $method];
        
        if (!empty($params)) {
            ksort($params);
            $keyParts[] = md5(serialize($params));
        }
        
        return implode(':', $keyParts);
    }
}
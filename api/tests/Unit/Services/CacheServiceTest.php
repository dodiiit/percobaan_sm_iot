<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Unit\Services;

use IndoWater\Api\Services\CacheService;
use PHPUnit\Framework\TestCase;
use Mockery;
use Predis\Client;

class CacheServiceTest extends TestCase
{
    private CacheService $cacheService;
    private $mockRedis;

    protected function setUp(): void
    {
        $this->mockRedis = Mockery::mock(Client::class);
        $this->cacheService = new CacheService($this->mockRedis);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testSetAndGet(): void
    {
        $key = 'test_key';
        $value = ['data' => 'test_value'];
        $ttl = 300;

        $this->mockRedis
            ->shouldReceive('setex')
            ->once()
            ->with($key, $ttl, json_encode($value))
            ->andReturn('OK');

        $this->mockRedis
            ->shouldReceive('get')
            ->once()
            ->with($key)
            ->andReturn(json_encode($value));

        // Test set
        $result = $this->cacheService->set($key, $value, $ttl);
        $this->assertTrue($result);

        // Test get
        $retrieved = $this->cacheService->get($key);
        $this->assertEquals($value, $retrieved);
    }

    public function testGetNonExistentKey(): void
    {
        $key = 'non_existent_key';

        $this->mockRedis
            ->shouldReceive('get')
            ->once()
            ->with($key)
            ->andReturn(null);

        $result = $this->cacheService->get($key);
        $this->assertNull($result);
    }

    public function testDelete(): void
    {
        $key = 'test_key';

        $this->mockRedis
            ->shouldReceive('del')
            ->once()
            ->with([$key])
            ->andReturn(1);

        $result = $this->cacheService->delete($key);
        $this->assertTrue($result);
    }

    public function testHas(): void
    {
        $key = 'test_key';

        $this->mockRedis
            ->shouldReceive('exists')
            ->once()
            ->with($key)
            ->andReturn(1);

        $result = $this->cacheService->has($key);
        $this->assertTrue($result);
    }

    public function testRemember(): void
    {
        $key = 'test_key';
        $value = ['computed' => 'value'];
        $ttl = 300;

        // First call - cache miss
        $this->mockRedis
            ->shouldReceive('get')
            ->once()
            ->with($key)
            ->andReturn(null);

        $this->mockRedis
            ->shouldReceive('setex')
            ->once()
            ->with($key, $ttl, json_encode($value))
            ->andReturn('OK');

        $callback = function () use ($value) {
            return $value;
        };

        $result = $this->cacheService->remember($key, $callback, $ttl);
        $this->assertEquals($value, $result);
    }

    public function testRememberWithCacheHit(): void
    {
        $key = 'test_key';
        $cachedValue = ['cached' => 'value'];

        $this->mockRedis
            ->shouldReceive('get')
            ->once()
            ->with($key)
            ->andReturn(json_encode($cachedValue));

        $callback = function () {
            $this->fail('Callback should not be called on cache hit');
        };

        $result = $this->cacheService->remember($key, $callback, 300);
        $this->assertEquals($cachedValue, $result);
    }

    public function testClearByPattern(): void
    {
        $pattern = 'test:*';
        $keys = ['test:key1', 'test:key2', 'test:key3'];

        $this->mockRedis
            ->shouldReceive('keys')
            ->once()
            ->with($pattern)
            ->andReturn($keys);

        $this->mockRedis
            ->shouldReceive('del')
            ->once()
            ->with($keys)
            ->andReturn(3);

        $result = $this->cacheService->clearByPattern($pattern);
        $this->assertEquals(3, $result);
    }

    public function testGetStats(): void
    {
        $info = [
            'keyspace_hits' => '1000',
            'keyspace_misses' => '200',
            'used_memory' => '1048576',
            'connected_clients' => '5'
        ];

        $this->mockRedis
            ->shouldReceive('info')
            ->once()
            ->andReturn($info);

        $this->mockRedis
            ->shouldReceive('dbsize')
            ->once()
            ->andReturn(150);

        $stats = $this->cacheService->getStats();

        $this->assertIsArray($stats);
        $this->assertEquals(1000, $stats['hits']);
        $this->assertEquals(200, $stats['misses']);
        $this->assertEquals(83.33, $stats['hit_ratio']);
        $this->assertEquals(150, $stats['keys']);
        $this->assertEquals('1.00 MB', $stats['memory_usage']);
        $this->assertEquals(5, $stats['connections']);
    }

    public function testFlush(): void
    {
        $this->mockRedis
            ->shouldReceive('flushdb')
            ->once()
            ->andReturn('OK');

        $result = $this->cacheService->flush();
        $this->assertTrue($result);
    }
}
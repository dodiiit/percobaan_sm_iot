<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Unit\Controllers;

use IndoWater\Api\Controllers\CacheController;
use IndoWater\Api\Services\CacheService;
use IndoWater\Api\Services\CacheConfigService;
use PHPUnit\Framework\TestCase;
use Mockery;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class CacheControllerTest extends TestCase
{
    private CacheController $controller;
    private $mockCacheService;
    private $mockCacheConfig;
    private ServerRequestInterface $request;
    private ResponseInterface $response;

    protected function setUp(): void
    {
        $this->mockCacheService = Mockery::mock(CacheService::class);
        $this->mockCacheConfig = Mockery::mock(CacheConfigService::class);
        
        $this->controller = new CacheController(
            $this->mockCacheService,
            $this->mockCacheConfig
        );

        $this->request = (new ServerRequestFactory())->createServerRequest('GET', '/api/cache/stats');
        $this->response = (new ResponseFactory())->createResponse(200);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testStats(): void
    {
        $stats = [
            'hits' => 1000,
            'misses' => 200,
            'hit_ratio' => 83.33,
            'keys' => 150,
            'memory_usage' => '1.00 MB',
            'connections' => 5
        ];

        $this->mockCacheService
            ->shouldReceive('getStats')
            ->once()
            ->andReturn($stats);

        $response = $this->controller->stats($this->request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals($stats, $body['data']);
    }

    public function testHealth(): void
    {
        $stats = [
            'hits' => 1000,
            'misses' => 200,
            'hit_ratio' => 83.33,
            'keys' => 150,
            'memory_usage' => '1.00 MB',
            'connections' => 5
        ];

        $this->mockCacheService
            ->shouldReceive('getStats')
            ->once()
            ->andReturn($stats);

        $response = $this->controller->health($this->request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals('healthy', $body['data']['status']);
        $this->assertEquals(83.33, $body['data']['hit_ratio']);
        $this->assertTrue($body['data']['is_connected']);
    }

    public function testHealthUnhealthy(): void
    {
        $stats = [
            'hits' => 100,
            'misses' => 900,
            'hit_ratio' => 10.0,
            'keys' => 150,
            'memory_usage' => '1.00 MB',
            'connections' => 5
        ];

        $this->mockCacheService
            ->shouldReceive('getStats')
            ->once()
            ->andReturn($stats);

        $response = $this->controller->health($this->request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals('degraded', $body['data']['status']);
        $this->assertEquals(10.0, $body['data']['hit_ratio']);
    }

    public function testClear(): void
    {
        $this->mockCacheService
            ->shouldReceive('flush')
            ->once()
            ->andReturn(true);

        $response = $this->controller->clear($this->request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals('Cache cleared successfully', $body['message']);
    }

    public function testClearPattern(): void
    {
        $requestBody = json_encode(['pattern' => 'meters*']);
        $request = $this->request->withBody(
            (new \Slim\Psr7\Factory\StreamFactory())->createStream($requestBody)
        );

        $this->mockCacheService
            ->shouldReceive('clearByPattern')
            ->once()
            ->with('meters*')
            ->andReturn(25);

        $response = $this->controller->clearPattern($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals('Cache pattern cleared successfully', $body['message']);
        $this->assertEquals(25, $body['data']['cleared_keys']);
    }

    public function testClearPatternMissingPattern(): void
    {
        $requestBody = json_encode([]);
        $request = $this->request->withBody(
            (new \Slim\Psr7\Factory\StreamFactory())->createStream($requestBody)
        );

        $response = $this->controller->clearPattern($request, $this->response);

        $this->assertEquals(400, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('error', $body['status']);
        $this->assertEquals('Pattern is required', $body['message']);
    }

    public function testWarmup(): void
    {
        $warmupRoutes = [
            ['route' => '/api/meters', 'params' => [], 'priority' => 1],
            ['route' => '/api/tariffs', 'params' => [], 'priority' => 2],
        ];

        $this->mockCacheConfig
            ->shouldReceive('getWarmupRoutes')
            ->once()
            ->andReturn($warmupRoutes);

        // Mock successful cache warming
        $this->mockCacheService
            ->shouldReceive('set')
            ->twice()
            ->andReturn(true);

        $response = $this->controller->warmup($this->request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals('Cache warmed up successfully', $body['message']);
        $this->assertEquals(2, $body['data']['warmed_routes']);
    }

    public function testInvalidate(): void
    {
        $requestBody = json_encode(['operation' => 'meter_update']);
        $request = $this->request->withBody(
            (new \Slim\Psr7\Factory\StreamFactory())->createStream($requestBody)
        );

        $patterns = ['meters*', 'meter:*'];

        $this->mockCacheConfig
            ->shouldReceive('getInvalidationPatterns')
            ->once()
            ->with('meter_update')
            ->andReturn($patterns);

        $this->mockCacheService
            ->shouldReceive('clearByPattern')
            ->once()
            ->with('meters*')
            ->andReturn(10);

        $this->mockCacheService
            ->shouldReceive('clearByPattern')
            ->once()
            ->with('meter:*')
            ->andReturn(5);

        $response = $this->controller->invalidate($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals('Cache invalidated successfully', $body['message']);
        $this->assertEquals(15, $body['data']['invalidated_keys']);
    }

    public function testInvalidateMissingOperation(): void
    {
        $requestBody = json_encode([]);
        $request = $this->request->withBody(
            (new \Slim\Psr7\Factory\StreamFactory())->createStream($requestBody)
        );

        $response = $this->controller->invalidate($request, $this->response);

        $this->assertEquals(400, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('error', $body['status']);
        $this->assertEquals('Operation is required', $body['message']);
    }

    public function testKeyInfo(): void
    {
        $key = 'api:meters:123';
        $keyData = ['data' => ['id' => 123, 'name' => 'Test Meter']];

        $this->mockCacheService
            ->shouldReceive('get')
            ->once()
            ->with($key)
            ->andReturn($keyData);

        $this->mockCacheService
            ->shouldReceive('ttl')
            ->once()
            ->with($key)
            ->andReturn(250);

        $this->mockCacheService
            ->shouldReceive('has')
            ->once()
            ->with($key)
            ->andReturn(true);

        $request = $this->request->withAttribute('key', $key);
        $response = $this->controller->keyInfo($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals($key, $body['data']['key']);
        $this->assertTrue($body['data']['exists']);
        $this->assertEquals(250, $body['data']['ttl']);
        $this->assertEquals($keyData, $body['data']['value']);
    }

    public function testKeyInfoNotFound(): void
    {
        $key = 'api:nonexistent:key';

        $this->mockCacheService
            ->shouldReceive('get')
            ->once()
            ->with($key)
            ->andReturn(null);

        $this->mockCacheService
            ->shouldReceive('ttl')
            ->once()
            ->with($key)
            ->andReturn(-2);

        $this->mockCacheService
            ->shouldReceive('has')
            ->once()
            ->with($key)
            ->andReturn(false);

        $request = $this->request->withAttribute('key', $key);
        $response = $this->controller->keyInfo($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals($key, $body['data']['key']);
        $this->assertFalse($body['data']['exists']);
        $this->assertEquals(-2, $body['data']['ttl']);
        $this->assertNull($body['data']['value']);
    }
}
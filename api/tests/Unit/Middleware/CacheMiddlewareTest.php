<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Unit\Middleware;

use IndoWater\Api\Middleware\CacheMiddleware;
use IndoWater\Api\Services\CacheService;
use IndoWater\Api\Services\CacheConfigService;
use PHPUnit\Framework\TestCase;
use Mockery;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class CacheMiddlewareTest extends TestCase
{
    private CacheMiddleware $middleware;
    private $mockCacheService;
    private $mockCacheConfig;
    private $mockHandler;
    private ServerRequestInterface $request;
    private ResponseInterface $response;

    protected function setUp(): void
    {
        $this->mockCacheService = Mockery::mock(CacheService::class);
        $this->mockCacheConfig = Mockery::mock(CacheConfigService::class);
        $this->mockHandler = Mockery::mock(RequestHandlerInterface::class);
        
        $this->middleware = new CacheMiddleware(
            $this->mockCacheService,
            $this->mockCacheConfig
        );

        $this->request = (new ServerRequestFactory())->createServerRequest('GET', '/api/meters');
        $this->response = (new ResponseFactory())->createResponse(200);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testProcessWithCacheHit(): void
    {
        $cacheKey = 'api:meters';
        $cachedData = ['data' => ['meter1', 'meter2']];
        $ttl = 300;

        // Mock cache config
        $this->mockCacheConfig
            ->shouldReceive('isCacheable')
            ->once()
            ->with('GET', '/api/meters')
            ->andReturn(true);

        $this->mockCacheConfig
            ->shouldReceive('generateCacheKey')
            ->once()
            ->with('/api/meters', [], null)
            ->andReturn($cacheKey);

        $this->mockCacheConfig
            ->shouldReceive('getTtlForRoute')
            ->once()
            ->with('/api/meters')
            ->andReturn($ttl);

        $this->mockCacheConfig
            ->shouldReceive('getCacheHeaders')
            ->once()
            ->with('/api/meters', $ttl)
            ->andReturn(['Cache-Control' => 'public, max-age=300']);

        // Mock cache service - cache hit
        $this->mockCacheService
            ->shouldReceive('get')
            ->once()
            ->with($cacheKey)
            ->andReturn($cachedData);

        $response = $this->middleware->process($this->request, $this->mockHandler);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('public, max-age=300', $response->getHeaderLine('Cache-Control'));
        $this->assertEquals('HIT', $response->getHeaderLine('X-Cache'));
        
        $body = json_decode((string) $response->getBody(), true);
        $this->assertEquals($cachedData, $body);
    }

    public function testProcessWithCacheMiss(): void
    {
        $cacheKey = 'api:meters';
        $responseData = ['data' => ['meter1', 'meter2']];
        $ttl = 300;

        // Mock cache config
        $this->mockCacheConfig
            ->shouldReceive('isCacheable')
            ->once()
            ->with('GET', '/api/meters')
            ->andReturn(true);

        $this->mockCacheConfig
            ->shouldReceive('generateCacheKey')
            ->once()
            ->with('/api/meters', [], null)
            ->andReturn($cacheKey);

        $this->mockCacheConfig
            ->shouldReceive('getTtlForRoute')
            ->once()
            ->with('/api/meters')
            ->andReturn($ttl);

        $this->mockCacheConfig
            ->shouldReceive('getCacheHeaders')
            ->once()
            ->with('/api/meters', $ttl)
            ->andReturn(['Cache-Control' => 'public, max-age=300']);

        // Mock cache service - cache miss
        $this->mockCacheService
            ->shouldReceive('get')
            ->once()
            ->with($cacheKey)
            ->andReturn(null);

        // Mock handler response
        $handlerResponse = $this->response->withHeader('Content-Type', 'application/json');
        $handlerResponse->getBody()->write(json_encode($responseData));
        
        $this->mockHandler
            ->shouldReceive('handle')
            ->once()
            ->with($this->request)
            ->andReturn($handlerResponse);

        // Mock cache service - set cache
        $this->mockCacheService
            ->shouldReceive('set')
            ->once()
            ->with($cacheKey, $responseData, $ttl)
            ->andReturn(true);

        $response = $this->middleware->process($this->request, $this->mockHandler);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('public, max-age=300', $response->getHeaderLine('Cache-Control'));
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
    }

    public function testProcessWithNonCacheableRoute(): void
    {
        $postRequest = (new ServerRequestFactory())->createServerRequest('POST', '/api/meters');

        // Mock cache config - not cacheable
        $this->mockCacheConfig
            ->shouldReceive('isCacheable')
            ->once()
            ->with('POST', '/api/meters')
            ->andReturn(false);

        // Mock handler response
        $this->mockHandler
            ->shouldReceive('handle')
            ->once()
            ->with($postRequest)
            ->andReturn($this->response);

        $response = $this->middleware->process($postRequest, $this->mockHandler);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEmpty($response->getHeaderLine('X-Cache'));
    }

    public function testProcessWithAuthenticatedUser(): void
    {
        $cacheKey = 'user:123:api:meters';
        $cachedData = ['data' => ['meter1', 'meter2']];
        $ttl = 300;

        // Add user context to request
        $requestWithUser = $this->request->withAttribute('user_id', '123');

        // Mock cache config
        $this->mockCacheConfig
            ->shouldReceive('isCacheable')
            ->once()
            ->with('GET', '/api/meters')
            ->andReturn(true);

        $this->mockCacheConfig
            ->shouldReceive('generateCacheKey')
            ->once()
            ->with('/api/meters', [], '123')
            ->andReturn($cacheKey);

        $this->mockCacheConfig
            ->shouldReceive('getTtlForRoute')
            ->once()
            ->with('/api/meters')
            ->andReturn($ttl);

        $this->mockCacheConfig
            ->shouldReceive('getCacheHeaders')
            ->once()
            ->with('/api/meters', $ttl)
            ->andReturn(['Cache-Control' => 'private, max-age=300']);

        // Mock cache service - cache hit
        $this->mockCacheService
            ->shouldReceive('get')
            ->once()
            ->with($cacheKey)
            ->andReturn($cachedData);

        $response = $this->middleware->process($requestWithUser, $this->mockHandler);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('private, max-age=300', $response->getHeaderLine('Cache-Control'));
        $this->assertEquals('HIT', $response->getHeaderLine('X-Cache'));
    }

    public function testProcessWithQueryParameters(): void
    {
        $requestWithQuery = (new ServerRequestFactory())->createServerRequest(
            'GET', 
            '/api/meters?limit=10&offset=0'
        );
        
        $cacheKey = 'api:meters:limit=10&offset=0';
        $cachedData = ['data' => ['meter1', 'meter2']];
        $ttl = 300;

        // Mock cache config
        $this->mockCacheConfig
            ->shouldReceive('isCacheable')
            ->once()
            ->with('GET', '/api/meters')
            ->andReturn(true);

        $this->mockCacheConfig
            ->shouldReceive('generateCacheKey')
            ->once()
            ->with('/api/meters', ['limit' => '10', 'offset' => '0'], null)
            ->andReturn($cacheKey);

        $this->mockCacheConfig
            ->shouldReceive('getTtlForRoute')
            ->once()
            ->with('/api/meters')
            ->andReturn($ttl);

        $this->mockCacheConfig
            ->shouldReceive('getCacheHeaders')
            ->once()
            ->with('/api/meters', $ttl)
            ->andReturn(['Cache-Control' => 'public, max-age=300']);

        // Mock cache service - cache hit
        $this->mockCacheService
            ->shouldReceive('get')
            ->once()
            ->with($cacheKey)
            ->andReturn($cachedData);

        $response = $this->middleware->process($requestWithQuery, $this->mockHandler);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('HIT', $response->getHeaderLine('X-Cache'));
    }

    public function testProcessWithCacheInvalidation(): void
    {
        $putRequest = (new ServerRequestFactory())->createServerRequest('PUT', '/api/meters/123');
        $patterns = ['meters*', 'meter:*'];

        // Mock cache config - not cacheable but needs invalidation
        $this->mockCacheConfig
            ->shouldReceive('isCacheable')
            ->once()
            ->with('PUT', '/api/meters/123')
            ->andReturn(false);

        $this->mockCacheConfig
            ->shouldReceive('getInvalidationPatterns')
            ->once()
            ->with('/api/meters/123')
            ->andReturn($patterns);

        // Mock cache service - invalidation
        $this->mockCacheService
            ->shouldReceive('clearByPattern')
            ->once()
            ->with('meters*')
            ->andReturn(5);

        $this->mockCacheService
            ->shouldReceive('clearByPattern')
            ->once()
            ->with('meter:*')
            ->andReturn(3);

        // Mock handler response
        $this->mockHandler
            ->shouldReceive('handle')
            ->once()
            ->with($putRequest)
            ->andReturn($this->response);

        $response = $this->middleware->process($putRequest, $this->mockHandler);

        $this->assertEquals(200, $response->getStatusCode());
    }
}
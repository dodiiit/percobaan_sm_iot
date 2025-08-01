<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Unit\Services;

use IndoWater\Api\Services\CacheConfigService;
use PHPUnit\Framework\TestCase;

class CacheConfigServiceTest extends TestCase
{
    private CacheConfigService $cacheConfigService;

    protected function setUp(): void
    {
        $this->cacheConfigService = new CacheConfigService();
    }

    public function testGetTtlForRoute(): void
    {
        // Test specific route patterns
        $this->assertEquals(60, $this->cacheConfigService->getTtlForRoute('/api/meters/123/balance'));
        $this->assertEquals(300, $this->cacheConfigService->getTtlForRoute('/api/meters'));
        $this->assertEquals(300, $this->cacheConfigService->getTtlForRoute('/api/meters/123'));
        $this->assertEquals(600, $this->cacheConfigService->getTtlForRoute('/api/meters/123/consumption'));
        $this->assertEquals(3600, $this->cacheConfigService->getTtlForRoute('/api/tariffs'));
        $this->assertEquals(1800, $this->cacheConfigService->getTtlForRoute('/api/properties'));
        $this->assertEquals(900, $this->cacheConfigService->getTtlForRoute('/api/users/123'));
        
        // Test default TTL for unknown routes
        $this->assertEquals(300, $this->cacheConfigService->getTtlForRoute('/api/unknown/route'));
    }

    public function testIsCacheable(): void
    {
        // Test cacheable routes
        $this->assertTrue($this->cacheConfigService->isCacheable('GET', '/api/meters'));
        $this->assertTrue($this->cacheConfigService->isCacheable('GET', '/api/meters/123'));
        $this->assertTrue($this->cacheConfigService->isCacheable('GET', '/api/tariffs'));
        $this->assertTrue($this->cacheConfigService->isCacheable('GET', '/api/properties'));
        
        // Test non-cacheable routes
        $this->assertFalse($this->cacheConfigService->isCacheable('POST', '/api/meters'));
        $this->assertFalse($this->cacheConfigService->isCacheable('PUT', '/api/meters/123'));
        $this->assertFalse($this->cacheConfigService->isCacheable('DELETE', '/api/meters/123'));
        $this->assertFalse($this->cacheConfigService->isCacheable('GET', '/api/auth/login'));
        $this->assertFalse($this->cacheConfigService->isCacheable('GET', '/api/meters/123/ota'));
        $this->assertFalse($this->cacheConfigService->isCacheable('GET', '/api/meters/123/control'));
        $this->assertFalse($this->cacheConfigService->isCacheable('GET', '/api/realtime/data'));
        $this->assertFalse($this->cacheConfigService->isCacheable('GET', '/api/cache/stats'));
    }

    public function testGetInvalidationPatterns(): void
    {
        // Test meter operations
        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/meters');
        $this->assertContains('meters*', $patterns);
        $this->assertContains('properties*', $patterns);

        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/meters/123');
        $this->assertContains('meters*', $patterns);
        $this->assertContains('meter:*', $patterns);
        $this->assertContains('meter_balance:*', $patterns);

        // Test tariff operations
        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/tariffs');
        $this->assertContains('tariffs*', $patterns);

        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/tariffs/123');
        $this->assertContains('tariffs*', $patterns);
        $this->assertContains('tariff:*', $patterns);

        // Test user operations
        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/users');
        $this->assertContains('users*', $patterns);

        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/users/123');
        $this->assertContains('users*', $patterns);
        $this->assertContains('user:*', $patterns);

        // Test property operations
        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/properties');
        $this->assertContains('properties*', $patterns);
        $this->assertContains('meters*', $patterns);

        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/properties/123');
        $this->assertContains('properties*', $patterns);
        $this->assertContains('property:*', $patterns);
        $this->assertContains('meters*', $patterns);

        // Test payment operations
        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/payments');
        $this->assertContains('payment*', $patterns);
        $this->assertContains('meter*', $patterns);

        // Test unknown route
        $patterns = $this->cacheConfigService->getInvalidationPatterns('/api/unknown');
        $this->assertEmpty($patterns);
    }

    public function testGenerateCacheKey(): void
    {
        // Test basic key generation
        $key = $this->cacheConfigService->generateCacheKey('/api/meters', []);
        $this->assertEquals('api:meters', $key);

        // Test key with parameters
        $key = $this->cacheConfigService->generateCacheKey('/api/meters', ['limit' => 10, 'offset' => 0]);
        $this->assertEquals('api:meters:limit=10&offset=0', $key);

        // Test key with user context
        $key = $this->cacheConfigService->generateCacheKey('/api/meters', [], 'user123');
        $this->assertEquals('user:user123:api:meters', $key);

        // Test key with both parameters and user context
        $key = $this->cacheConfigService->generateCacheKey('/api/meters', ['status' => 'active'], 'user123');
        $this->assertEquals('user:user123:api:meters:status=active', $key);

        // Test key normalization
        $key = $this->cacheConfigService->generateCacheKey('/api/meters/123/balance/', []);
        $this->assertEquals('api:meters:123:balance', $key);
    }

    public function testGetWarmupRoutes(): void
    {
        $routes = $this->cacheConfigService->getWarmupRoutes();
        
        $this->assertIsArray($routes);
        $this->assertNotEmpty($routes);
        
        // Check that essential routes are included
        $routePaths = array_column($routes, 'route');
        $this->assertContains('/api/meters', $routePaths);
        $this->assertContains('/api/tariffs', $routePaths);
        $this->assertContains('/api/properties', $routePaths);
        $this->assertContains('/api/service-fees', $routePaths);
        
        // Check route structure
        foreach ($routes as $route) {
            $this->assertArrayHasKey('route', $route);
            $this->assertArrayHasKey('params', $route);
            $this->assertArrayHasKey('priority', $route);
            $this->assertIsString($route['route']);
            $this->assertIsArray($route['params']);
            $this->assertIsInt($route['priority']);
        }
    }

    public function testGetCacheHeaders(): void
    {
        // Test public cacheable route
        $headers = $this->cacheConfigService->getCacheHeaders('/api/tariffs', 3600);
        $this->assertEquals('public, max-age=3600', $headers['Cache-Control']);
        $this->assertArrayHasKey('Expires', $headers);
        $this->assertEquals('Accept-Encoding', $headers['Vary']);

        // Test private cacheable route
        $headers = $this->cacheConfigService->getCacheHeaders('/api/users/123', 900);
        $this->assertEquals('private, max-age=900', $headers['Cache-Control']);
        $this->assertEquals('Authorization, Accept-Encoding', $headers['Vary']);

        // Test short TTL route
        $headers = $this->cacheConfigService->getCacheHeaders('/api/meters/123/balance', 60);
        $this->assertEquals('private, max-age=60', $headers['Cache-Control']);
        $this->assertEquals('Authorization, Accept-Encoding', $headers['Vary']);
    }

    public function testIsPublicCacheable(): void
    {
        // Test public routes
        $this->assertTrue($this->cacheConfigService->isPublicCacheable('/api/tariffs'));
        $this->assertTrue($this->cacheConfigService->isPublicCacheable('/api/service-fees'));
        
        // Test private routes
        $this->assertFalse($this->cacheConfigService->isPublicCacheable('/api/meters'));
        $this->assertFalse($this->cacheConfigService->isPublicCacheable('/api/users/123'));
        $this->assertFalse($this->cacheConfigService->isPublicCacheable('/api/meters/123/balance'));
    }
}
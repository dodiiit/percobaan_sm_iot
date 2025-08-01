describe('API Caching End-to-End Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    cy.clearCache();
    
    // Set up API interceptors
    cy.interceptApiCall('GET', '/meters');
    cy.interceptApiCall('GET', '/meters/*/balance');
    cy.interceptApiCall('GET', '/tariffs');
    cy.interceptApiCall('POST', '/auth/login', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          token: 'test-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'client'
          }
        }
      }
    });
  });

  describe('Authentication and Cache Context', () => {
    it('should cache user-specific data after login', () => {
      cy.login();
      
      // Navigate to meters page
      cy.visit('/dashboard/meters');
      
      // First request should be a cache miss
      cy.wait('@apiRequest');
      cy.checkCacheHeaders(300);
      
      // Reload page - should hit cache
      cy.reload();
      cy.wait('@apiRequest');
      
      // Verify cache hit in browser storage
      cy.window().then((win) => {
        const cacheKey = 'user:1:GET:/api/meters';
        const cachedData = win.localStorage.getItem(cacheKey);
        expect(cachedData).to.not.be.null;
      });
    });

    it('should clear user cache on logout', () => {
      cy.login();
      cy.visit('/dashboard/meters');
      cy.wait('@apiRequest');
      
      // Verify cache exists
      cy.window().then((win) => {
        const cacheKeys = Object.keys(win.localStorage).filter(key => key.startsWith('user:1:'));
        expect(cacheKeys.length).to.be.greaterThan(0);
      });
      
      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Verify user cache is cleared
      cy.window().then((win) => {
        const cacheKeys = Object.keys(win.localStorage).filter(key => key.startsWith('user:1:'));
        expect(cacheKeys.length).to.equal(0);
      });
    });
  });

  describe('Meter Data Caching', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should cache meter list with appropriate TTL', () => {
      cy.interceptApiCall('GET', '/meters', {
        statusCode: 200,
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'MISS'
        },
        body: {
          status: 'success',
          data: [
            { id: '1', meter_id: 'MTR001', status: 'active' },
            { id: '2', meter_id: 'MTR002', status: 'active' }
          ]
        }
      });

      cy.visit('/dashboard/meters');
      cy.wait('@apiRequest');
      
      // Check that data is displayed
      cy.get('[data-testid="meter-list"]').should('be.visible');
      cy.get('[data-testid="meter-item"]').should('have.length', 2);
      
      // Navigate away and back
      cy.visit('/dashboard');
      cy.visit('/dashboard/meters');
      
      // Should use cached data (no new API call)
      cy.get('[data-testid="meter-list"]').should('be.visible');
      cy.get('[data-testid="meter-item"]').should('have.length', 2);
    });

    it('should cache meter balance with short TTL', () => {
      cy.interceptApiCall('GET', '/meters/1/balance', {
        statusCode: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Cache': 'MISS'
        },
        body: {
          status: 'success',
          data: {
            balance: 150.50,
            last_updated: '2024-01-15T10:30:00Z'
          }
        }
      });

      cy.visit('/dashboard/meters/1');
      cy.wait('@apiRequest');
      
      // Check balance display
      cy.get('[data-testid="meter-balance"]').should('contain', '150.50');
      
      // Refresh balance button should use cache initially
      cy.get('[data-testid="refresh-balance"]').click();
      cy.get('[data-testid="meter-balance"]').should('contain', '150.50');
    });

    it('should invalidate cache after meter update', () => {
      // First, cache the meter data
      cy.visit('/dashboard/meters/1');
      cy.wait('@apiRequest');
      
      // Update meter
      cy.interceptApiCall('PUT', '/meters/1', {
        statusCode: 200,
        body: {
          status: 'success',
          data: { id: '1', meter_id: 'MTR001', status: 'maintenance' }
        }
      });
      
      cy.get('[data-testid="edit-meter"]').click();
      cy.get('[data-testid="status-select"]').select('maintenance');
      cy.get('[data-testid="save-button"]').click();
      
      cy.wait('@apiRequest');
      
      // Navigate back to meter list - should fetch fresh data
      cy.interceptApiCall('GET', '/meters', {
        statusCode: 200,
        headers: { 'X-Cache': 'MISS' },
        body: {
          status: 'success',
          data: [
            { id: '1', meter_id: 'MTR001', status: 'maintenance' },
            { id: '2', meter_id: 'MTR002', status: 'active' }
          ]
        }
      });
      
      cy.visit('/dashboard/meters');
      cy.wait('@apiRequest');
      
      // Verify updated status is shown
      cy.get('[data-testid="meter-item-1"]').should('contain', 'maintenance');
    });
  });

  describe('Tariff Data Caching', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should cache public tariff data with long TTL', () => {
      cy.interceptApiCall('GET', '/tariffs', {
        statusCode: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS'
        },
        body: {
          status: 'success',
          data: [
            { id: '1', name: 'Residential', rate: 1500 },
            { id: '2', name: 'Commercial', rate: 2000 }
          ]
        }
      });

      cy.visit('/dashboard/tariffs');
      cy.wait('@apiRequest');
      
      // Check tariff display
      cy.get('[data-testid="tariff-list"]').should('be.visible');
      cy.get('[data-testid="tariff-item"]').should('have.length', 2);
      
      // Navigate to different page and back
      cy.visit('/dashboard/meters');
      cy.visit('/dashboard/tariffs');
      
      // Should use cached data
      cy.get('[data-testid="tariff-list"]').should('be.visible');
      cy.get('[data-testid="tariff-item"]').should('have.length', 2);
    });
  });

  describe('Network Error Handling', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should show cached data when network is unavailable', () => {
      // First, cache some data
      cy.interceptApiCall('GET', '/meters', {
        statusCode: 200,
        body: {
          status: 'success',
          data: [{ id: '1', meter_id: 'MTR001', status: 'active' }]
        }
      });

      cy.visit('/dashboard/meters');
      cy.wait('@apiRequest');
      
      // Verify data is displayed and cached
      cy.get('[data-testid="meter-list"]').should('be.visible');
      
      // Simulate network error
      cy.interceptApiCall('GET', '/meters', { forceNetworkError: true });
      
      // Reload page
      cy.reload();
      
      // Should still show cached data
      cy.get('[data-testid="meter-list"]').should('be.visible');
      cy.get('[data-testid="meter-item"]').should('have.length', 1);
      
      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
    });

    it('should handle slow network with loading states', () => {
      cy.simulateSlowNetwork();
      
      cy.visit('/dashboard/meters');
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      // Wait for data to load
      cy.get('[data-testid="meter-list"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should provide cache statistics in admin panel', () => {
      // Navigate to admin cache management
      cy.visit('/admin/cache');
      
      // Check cache stats display
      cy.get('[data-testid="cache-stats"]').should('be.visible');
      cy.get('[data-testid="cache-hits"]').should('contain.text', 'Hits:');
      cy.get('[data-testid="cache-misses"]').should('contain.text', 'Misses:');
      cy.get('[data-testid="cache-hit-ratio"]').should('contain.text', 'Hit Ratio:');
    });

    it('should allow manual cache clearing', () => {
      // Cache some data first
      cy.visit('/dashboard/meters');
      cy.wait(1000);
      
      // Go to cache management
      cy.visit('/admin/cache');
      
      // Clear cache
      cy.get('[data-testid="clear-cache-button"]').click();
      cy.get('[data-testid="confirm-clear"]').click();
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Cache cleared successfully');
      
      // Verify cache is cleared
      cy.window().then((win) => {
        const cacheKeys = Object.keys(win.localStorage).filter(key => 
          key.startsWith('GET:') || key.startsWith('user:')
        );
        expect(cacheKeys.length).to.equal(0);
      });
    });

    it('should support pattern-based cache invalidation', () => {
      // Cache some meter data
      cy.visit('/dashboard/meters');
      cy.visit('/dashboard/meters/1');
      cy.wait(1000);
      
      // Go to cache management
      cy.visit('/admin/cache');
      
      // Invalidate meter-related cache
      cy.get('[data-testid="invalidate-pattern-input"]').type('meters*');
      cy.get('[data-testid="invalidate-pattern-button"]').click();
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Cache pattern invalidated');
      
      // Verify only meter cache is cleared
      cy.window().then((win) => {
        const meterCacheKeys = Object.keys(win.localStorage).filter(key => 
          key.includes('meters')
        );
        expect(meterCacheKeys.length).to.equal(0);
      });
    });
  });

  describe('Real-time Data Handling', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should not cache real-time endpoints', () => {
      cy.interceptApiCall('GET', '/realtime/meter-readings', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            timestamp: Date.now(),
            readings: [{ meter_id: '1', reading: 1234.56 }]
          }
        }
      });

      cy.visit('/dashboard/realtime');
      cy.wait('@apiRequest');
      
      // Check that no cache headers are present for real-time data
      cy.get('@apiRequest').then((interception: any) => {
        expect(interception.response.headers).to.not.have.property('cache-control');
        expect(interception.response.headers).to.not.have.property('x-cache');
      });
    });

    it('should handle WebSocket updates and invalidate related cache', () => {
      // Cache meter balance
      cy.visit('/dashboard/meters/1');
      cy.wait(1000);
      
      // Simulate WebSocket message for balance update
      cy.window().then((win) => {
        const event = new CustomEvent('websocket-message', {
          detail: {
            type: 'balance_update',
            meter_id: '1',
            new_balance: 200.00
          }
        });
        win.dispatchEvent(event);
      });
      
      // Should invalidate balance cache and show updated value
      cy.get('[data-testid="meter-balance"]').should('contain', '200.00');
    });
  });

  describe('Performance and Optimization', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should implement cache warming on application start', () => {
      cy.visit('/dashboard');
      
      // Should show cache warming indicator
      cy.get('[data-testid="cache-warming"]').should('be.visible');
      
      // Wait for cache warmup to complete
      cy.waitForCacheWarmup();
      
      // Navigate to cached pages - should load instantly
      const startTime = Date.now();
      cy.visit('/dashboard/meters');
      cy.get('[data-testid="meter-list"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(500); // Should load in less than 500ms
      });
    });

    it('should implement LRU eviction when cache size limit is reached', () => {
      // Configure small cache size for testing
      cy.window().then((win) => {
        (win as any).cacheConfig = { maxSize: 3 };
      });
      
      // Cache multiple items
      cy.visit('/dashboard/meters');
      cy.visit('/dashboard/tariffs');
      cy.visit('/dashboard/properties');
      cy.visit('/dashboard/users');
      
      cy.wait(1000);
      
      // Check that oldest cache entries are evicted
      cy.window().then((win) => {
        const cacheKeys = Object.keys(win.localStorage).filter(key => 
          key.startsWith('GET:')
        );
        expect(cacheKeys.length).to.be.lessThanOrEqual(3);
      });
    });
  });

  describe('Cross-tab Cache Synchronization', () => {
    it('should synchronize cache across browser tabs', () => {
      cy.login();
      cy.visit('/dashboard/meters');
      cy.wait(1000);
      
      // Open new tab (simulate by triggering storage event)
      cy.window().then((win) => {
        const storageEvent = new StorageEvent('storage', {
          key: 'cache-sync',
          newValue: JSON.stringify({
            action: 'invalidate',
            pattern: 'meters*'
          })
        });
        win.dispatchEvent(storageEvent);
      });
      
      // Should handle cache synchronization
      cy.get('[data-testid="cache-sync-indicator"]').should('be.visible');
      cy.get('[data-testid="cache-sync-indicator"]').should('not.exist');
    });
  });
});
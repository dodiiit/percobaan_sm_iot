/// <reference types="cypress" />
import { ApiResponse } from './types';

// Custom command for login
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('testUser').email;
  const testPassword = password || Cypress.env('testUser').password;

  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(testEmail);
  cy.get('[data-testid="password-input"]').type(testPassword);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('not.include', '/login');
  cy.window().its('localStorage').invoke('getItem', 'auth_token').should('exist');
});

// Custom command for clearing cache
Cypress.Commands.add('clearCache', () => {
  cy.window().then((win) => {
    // Clear localStorage
    win.localStorage.clear();
    // Clear sessionStorage
    win.sessionStorage.clear();
    // Clear IndexedDB if used
    if (win.indexedDB) {
      // This is a simplified approach - in real implementation you might need more specific clearing
      const databases = ['cache-db', 'app-cache'];
      databases.forEach(dbName => {
        const deleteReq = win.indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => console.log(`Deleted database ${dbName}`);
      });
    }
  });
});

// Custom command for checking cache headers
Cypress.Commands.add('checkCacheHeaders', (expectedMaxAge?: number) => {
  cy.get('@apiRequest').then((interception: Cypress.Interception) => {
    const response = interception.response;
    expect(response.headers).to.have.property('cache-control');
    
    if (expectedMaxAge) {
      expect(response.headers['cache-control']).to.include(`max-age=${expectedMaxAge}`);
    }
    
    // Check for cache status header
    if (response.headers['x-cache']) {
      expect(response.headers['x-cache']).to.be.oneOf(['HIT', 'MISS']);
    }
  });
});

// Custom command for intercepting API calls
Cypress.Commands.add('interceptApiCall', <T = unknown>(method: string, url: string, response?: ApiResponse<T>) => {
  const apiUrl = Cypress.env('apiUrl');
  const fullUrl = `${apiUrl}${url}`;
  
  if (response) {
    cy.intercept(method, fullUrl, response).as('apiRequest');
  } else {
    cy.intercept(method, fullUrl).as('apiRequest');
  }
});

// Custom command for waiting for cache warmup
Cypress.Commands.add('waitForCacheWarmup', () => {
  // Wait for initial cache warmup requests to complete
  cy.wait(2000);
  
  // Check if cache warmup indicator is gone
  cy.get('[data-testid="cache-warming"]', { timeout: 10000 }).should('not.exist');
});

// Add custom commands for testing cache functionality
Cypress.Commands.add('verifyCacheHit', () => {
  cy.window().then((win) => {
    // Access the cache service from window object (if exposed for testing)
    const cacheService = (win as Window & { cacheService?: { getStats(): { hits: number; misses: number } } }).cacheService;
    if (cacheService) {
      const stats = cacheService.getStats();
      expect(stats.hits).to.be.greaterThan(0);
    }
  });
});

Cypress.Commands.add('verifyCacheMiss', () => {
  cy.window().then((win) => {
    const cacheService = (win as Window & { cacheService?: { getStats(): { hits: number; misses: number } } }).cacheService;
    if (cacheService) {
      const stats = cacheService.getStats();
      expect(stats.misses).to.be.greaterThan(0);
    }
  });
});

// Command to simulate network conditions
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      // Add delay to simulate slow network
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), 1000);
      });
    });
  });
});

// Command to simulate offline condition
Cypress.Commands.add('simulateOffline', () => {
  cy.window().then((win) => {
    // Override navigator.onLine
    Object.defineProperty(win.navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    // Dispatch offline event
    win.dispatchEvent(new Event('offline'));
  });
});

// Command to simulate online condition
Cypress.Commands.add('simulateOnline', () => {
  cy.window().then((win) => {
    Object.defineProperty(win.navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    win.dispatchEvent(new Event('online'));
  });
});

// Additional commands to match types.ts interface
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('loginAsAdmin', () => {
  const adminUser = Cypress.env('adminUser') || { email: 'admin@example.com', password: 'admin123' };
  cy.login(adminUser.email, adminUser.password);
});

Cypress.Commands.add('loginAsClient', () => {
  const clientUser = Cypress.env('clientUser') || { email: 'client@example.com', password: 'client123' };
  cy.login(clientUser.email, clientUser.password);
});

Cypress.Commands.add('loginAsCustomer', () => {
  const customerUser = Cypress.env('customerUser') || Cypress.env('testUser');
  cy.login(customerUser.email, customerUser.password);
});

Cypress.Commands.add('createTestData', <T = unknown>(type: string, data: T) => {
  const apiUrl = Cypress.env('apiUrl');
  
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/${type}`,
    body: data,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('cleanupTestData', (type: string, id?: string) => {
  const apiUrl = Cypress.env('apiUrl');
  const url = id ? `${apiUrl}/${type}/${id}` : `${apiUrl}/${type}/cleanup`;
  
  cy.request({
    method: 'DELETE',
    url,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('auth_token')}`
    },
    failOnStatusCode: false // Don't fail if resource doesn't exist
  });
});

// Additional command declarations (main types are in types.ts)
declare global {
  namespace Cypress {
    interface Chainable {
      verifyCacheHit(): Chainable<void>;
      verifyCacheMiss(): Chainable<void>;
      simulateSlowNetwork(): Chainable<void>;
      simulateOffline(): Chainable<void>;
      simulateOnline(): Chainable<void>;
    }
  }
}
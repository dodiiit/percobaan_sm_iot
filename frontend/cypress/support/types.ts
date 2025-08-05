// Cypress global type definitions

export interface TestUser {
  email: string;
  password: string;
  name?: string;
  role?: 'admin' | 'client' | 'customer';
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  errors?: Record<string, string[]>;
}

export interface TestEnvironment {
  apiUrl: string;
  testUser: TestUser;
  adminUser?: TestUser;
  clientUser?: TestUser;
}

// Extend Cypress namespace with proper types
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       * @param email - User email (defaults to test user)
       * @param password - User password (defaults to test user)
       */
      login(email?: string, password?: string): Chainable<void>;
      
      /**
       * Clear application cache
       */
      clearCache(): Chainable<void>;
      
      /**
       * Check cache headers in response
       * @param expectedMaxAge - Expected max-age value in seconds
       */
      checkCacheHeaders(expectedMaxAge?: number): Chainable<void>;
      
      /**
       * Intercept API call with typed response
       * @param method - HTTP method
       * @param url - API endpoint URL
       * @param response - Mock response data
       */
      interceptApiCall<T = unknown>(
        method: string, 
        url: string, 
        response?: ApiResponse<T>
      ): Chainable<void>;
      
      /**
       * Wait for cache warmup to complete
       */
      waitForCacheWarmup(): Chainable<void>;
      
      /**
       * Get element by data-testid attribute
       * @param testId - Test ID value
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Login as admin user
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Login as client user
       */
      loginAsClient(): Chainable<void>;
      
      /**
       * Login as customer user
       */
      loginAsCustomer(): Chainable<void>;
      
      /**
       * Create test data
       * @param type - Type of data to create
       * @param data - Data to create
       */
      createTestData<T = unknown>(type: string, data: T): Chainable<ApiResponse<T>>;
      
      /**
       * Clean up test data
       * @param type - Type of data to clean up
       * @param id - ID of data to clean up
       */
      cleanupTestData(type: string, id?: string): Chainable<void>;
    }
    
    interface Env extends TestEnvironment {
      // Additional environment variables can be added here
    }
  }
}

export {};
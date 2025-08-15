import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://lingindustri.com',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'https://api.lingindustri.com/api',
      testUser: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'customer'
      },
      adminUser: {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      },
      clientUser: {
        email: 'client@example.com',
        password: 'client123',
        name: 'Client User',
        role: 'client'
      }
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    },
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
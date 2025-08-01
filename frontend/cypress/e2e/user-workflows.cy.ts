describe('User Workflow End-to-End Tests', () => {
  beforeEach(() => {
    cy.clearCache();
  });

  describe('Superadmin Workflows', () => {
    beforeEach(() => {
      cy.interceptApiCall('POST', '/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'superadmin-jwt-token',
            user: {
              id: 'superadmin-1',
              email: 'superadmin@indowater.com',
              role: 'superadmin',
              name: 'Super Admin'
            }
          }
        }
      });
      
      cy.login('superadmin@indowater.com', 'admin123');
    });

    it('should complete client management workflow', () => {
      // Navigate to client management
      cy.visit('/superadmin/clients');
      
      // Intercept clients API
      cy.interceptApiCall('GET', '/clients', {
        statusCode: 200,
        body: {
          status: 'success',
          data: [
            { id: '1', name: 'PT Water Solutions', status: 'active', properties_count: 5 },
            { id: '2', name: 'CV Aqua Tech', status: 'active', properties_count: 3 }
          ]
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify client list is displayed
      cy.get('[data-testid="client-list"]').should('be.visible');
      cy.get('[data-testid="client-item"]').should('have.length', 2);
      
      // Create new client
      cy.get('[data-testid="add-client-button"]').click();
      
      cy.interceptApiCall('POST', '/clients', {
        statusCode: 201,
        body: {
          status: 'success',
          data: { id: '3', name: 'New Water Company', status: 'active' }
        }
      });
      
      cy.get('[data-testid="client-name-input"]').type('New Water Company');
      cy.get('[data-testid="client-email-input"]').type('contact@newwater.com');
      cy.get('[data-testid="client-phone-input"]').type('+62123456789');
      cy.get('[data-testid="save-client-button"]').click();
      
      cy.wait('@apiRequest');
      
      // Should show success message and redirect
      cy.get('[data-testid="success-message"]').should('contain', 'Client created successfully');
      cy.url().should('include', '/superadmin/clients');
    });

    it('should complete system monitoring workflow', () => {
      // Navigate to system monitoring
      cy.visit('/superadmin/monitoring');
      
      // Intercept monitoring APIs
      cy.interceptApiCall('GET', '/monitoring/system-health', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            api_status: 'healthy',
            database_status: 'healthy',
            cache_status: 'healthy',
            queue_status: 'healthy',
            uptime: '99.9%'
          }
        }
      });
      
      cy.interceptApiCall('GET', '/monitoring/metrics', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            active_meters: 1250,
            total_transactions: 45678,
            system_load: 0.65,
            memory_usage: 0.78
          }
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify system health dashboard
      cy.get('[data-testid="system-health"]').should('be.visible');
      cy.get('[data-testid="api-status"]').should('contain', 'healthy');
      cy.get('[data-testid="database-status"]').should('contain', 'healthy');
      cy.get('[data-testid="cache-status"]').should('contain', 'healthy');
      
      // Check metrics
      cy.get('[data-testid="active-meters-count"]').should('contain', '1,250');
      cy.get('[data-testid="total-transactions"]').should('contain', '45,678');
      
      // Test cache management
      cy.get('[data-testid="cache-management-tab"]').click();
      cy.get('[data-testid="cache-stats"]').should('be.visible');
      
      // Clear cache
      cy.get('[data-testid="clear-cache-button"]').click();
      cy.get('[data-testid="confirm-clear"]').click();
      
      cy.interceptApiCall('POST', '/cache/clear', {
        statusCode: 200,
        body: { status: 'success', message: 'Cache cleared successfully' }
      });
      
      cy.wait('@apiRequest');
      cy.get('[data-testid="success-message"]').should('contain', 'Cache cleared successfully');
    });

    it('should complete tariff management workflow', () => {
      cy.visit('/superadmin/tariffs');
      
      // Intercept tariffs API
      cy.interceptApiCall('GET', '/tariffs', {
        statusCode: 200,
        body: {
          status: 'success',
          data: [
            { id: '1', name: 'Residential', rate: 1500, status: 'active' },
            { id: '2', name: 'Commercial', rate: 2000, status: 'active' }
          ]
        }
      });
      
      cy.wait('@apiRequest');
      
      // Create new tariff
      cy.get('[data-testid="add-tariff-button"]').click();
      
      cy.interceptApiCall('POST', '/tariffs', {
        statusCode: 201,
        body: {
          status: 'success',
          data: { id: '3', name: 'Industrial', rate: 2500, status: 'active' }
        }
      });
      
      cy.get('[data-testid="tariff-name-input"]').type('Industrial');
      cy.get('[data-testid="tariff-rate-input"]').type('2500');
      cy.get('[data-testid="tariff-description-input"]').type('Industrial water tariff');
      cy.get('[data-testid="save-tariff-button"]').click();
      
      cy.wait('@apiRequest');
      
      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Tariff created successfully');
    });
  });

  describe('Client Workflows', () => {
    beforeEach(() => {
      cy.interceptApiCall('POST', '/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'client-jwt-token',
            user: {
              id: 'client-1',
              email: 'client@watercompany.com',
              role: 'client',
              name: 'Water Company Manager'
            }
          }
        }
      });
      
      cy.login('client@watercompany.com', 'client123');
    });

    it('should complete property management workflow', () => {
      cy.visit('/client/properties');
      
      // Intercept properties API
      cy.interceptApiCall('GET', '/properties', {
        statusCode: 200,
        body: {
          status: 'success',
          data: [
            { 
              id: '1', 
              name: 'Residential Complex A', 
              address: 'Jl. Sudirman No. 123',
              total_units: 50,
              active_meters: 48,
              status: 'active'
            },
            { 
              id: '2', 
              name: 'Office Building B', 
              address: 'Jl. Thamrin No. 456',
              total_units: 20,
              active_meters: 20,
              status: 'active'
            }
          ]
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify properties list
      cy.get('[data-testid="property-list"]').should('be.visible');
      cy.get('[data-testid="property-item"]').should('have.length', 2);
      
      // View property details
      cy.get('[data-testid="property-item-1"]').click();
      
      cy.interceptApiCall('GET', '/properties/1', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            id: '1',
            name: 'Residential Complex A',
            address: 'Jl. Sudirman No. 123',
            total_units: 50,
            active_meters: 48,
            meters: [
              { id: 'm1', meter_id: 'MTR001', unit: 'A-101', status: 'active', balance: 150.00 },
              { id: 'm2', meter_id: 'MTR002', unit: 'A-102', status: 'active', balance: 200.50 }
            ]
          }
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify property details
      cy.get('[data-testid="property-details"]').should('be.visible');
      cy.get('[data-testid="property-name"]').should('contain', 'Residential Complex A');
      cy.get('[data-testid="meter-list"]').should('be.visible');
      cy.get('[data-testid="meter-item"]').should('have.length', 2);
    });

    it('should complete meter installation workflow', () => {
      cy.visit('/client/meters/install');
      
      // Fill installation form
      cy.get('[data-testid="property-select"]').select('1');
      cy.get('[data-testid="meter-serial-input"]').type('SN123456789');
      cy.get('[data-testid="meter-model-select"]').select('WM-2024');
      cy.get('[data-testid="unit-number-input"]').type('A-103');
      cy.get('[data-testid="customer-name-input"]').type('John Doe');
      cy.get('[data-testid="customer-phone-input"]').type('+62812345678');
      
      cy.interceptApiCall('POST', '/meters', {
        statusCode: 201,
        body: {
          status: 'success',
          data: {
            id: 'new-meter-id',
            meter_id: 'MTR003',
            serial_number: 'SN123456789',
            status: 'installed'
          }
        }
      });
      
      cy.get('[data-testid="install-meter-button"]').click();
      cy.wait('@apiRequest');
      
      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Meter installed successfully');
      cy.get('[data-testid="meter-id"]').should('contain', 'MTR003');
    });

    it('should complete bulk payment processing workflow', () => {
      cy.visit('/client/payments/bulk');
      
      // Upload payment file
      cy.get('[data-testid="payment-file-input"]').selectFile('cypress/fixtures/bulk-payments.csv');
      
      cy.interceptApiCall('POST', '/payments/bulk/validate', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            total_records: 100,
            valid_records: 98,
            invalid_records: 2,
            total_amount: 15000000,
            errors: [
              { row: 15, error: 'Invalid meter ID' },
              { row: 67, error: 'Insufficient balance' }
            ]
          }
        }
      });
      
      cy.get('[data-testid="validate-button"]').click();
      cy.wait('@apiRequest');
      
      // Review validation results
      cy.get('[data-testid="validation-results"]').should('be.visible');
      cy.get('[data-testid="total-records"]').should('contain', '100');
      cy.get('[data-testid="valid-records"]').should('contain', '98');
      cy.get('[data-testid="invalid-records"]').should('contain', '2');
      
      // Process valid payments
      cy.interceptApiCall('POST', '/payments/bulk/process', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            processed: 98,
            failed: 0,
            total_amount: 14700000
          }
        }
      });
      
      cy.get('[data-testid="process-payments-button"]').click();
      cy.wait('@apiRequest');
      
      // Verify processing results
      cy.get('[data-testid="processing-results"]').should('be.visible');
      cy.get('[data-testid="processed-count"]').should('contain', '98');
      cy.get('[data-testid="success-message"]').should('contain', 'Bulk payment processed successfully');
    });

    it('should complete consumption analytics workflow', () => {
      cy.visit('/client/analytics/consumption');
      
      // Set date range
      cy.get('[data-testid="start-date-input"]').type('2024-01-01');
      cy.get('[data-testid="end-date-input"]').type('2024-01-31');
      cy.get('[data-testid="property-filter"]').select('1');
      
      cy.interceptApiCall('GET', '/analytics/consumption*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            total_consumption: 125000,
            average_daily: 4032,
            peak_consumption: 6500,
            peak_date: '2024-01-15',
            daily_data: [
              { date: '2024-01-01', consumption: 3800 },
              { date: '2024-01-02', consumption: 4200 },
              // ... more data
            ],
            top_consumers: [
              { unit: 'A-101', consumption: 850, percentage: 15.2 },
              { unit: 'A-205', consumption: 720, percentage: 12.8 }
            ]
          }
        }
      });
      
      cy.get('[data-testid="generate-report-button"]').click();
      cy.wait('@apiRequest');
      
      // Verify analytics display
      cy.get('[data-testid="consumption-chart"]').should('be.visible');
      cy.get('[data-testid="total-consumption"]').should('contain', '125,000');
      cy.get('[data-testid="average-daily"]').should('contain', '4,032');
      cy.get('[data-testid="top-consumers-list"]').should('be.visible');
      
      // Export report
      cy.interceptApiCall('GET', '/analytics/consumption/export*', {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="consumption-report.xlsx"'
        },
        body: 'mock-excel-data'
      });
      
      cy.get('[data-testid="export-button"]').click();
      cy.wait('@apiRequest');
    });
  });

  describe('Customer Workflows', () => {
    beforeEach(() => {
      cy.interceptApiCall('POST', '/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'customer-jwt-token',
            user: {
              id: 'customer-1',
              email: 'customer@example.com',
              role: 'customer',
              name: 'John Doe'
            }
          }
        }
      });
      
      cy.login('customer@example.com', 'customer123');
    });

    it('should complete balance check and top-up workflow', () => {
      cy.visit('/customer/dashboard');
      
      // Intercept balance API
      cy.interceptApiCall('GET', '/customer/balance', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            current_balance: 75.50,
            last_topup: '2024-01-10T14:30:00Z',
            last_topup_amount: 100.00,
            estimated_days_remaining: 12
          }
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify balance display
      cy.get('[data-testid="current-balance"]').should('contain', '75.50');
      cy.get('[data-testid="days-remaining"]').should('contain', '12');
      
      // Initiate top-up
      cy.get('[data-testid="topup-button"]').click();
      
      // Select top-up amount
      cy.get('[data-testid="topup-amount-100"]').click();
      cy.get('[data-testid="payment-method-select"]').select('bank_transfer');
      
      cy.interceptApiCall('POST', '/customer/topup', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            transaction_id: 'TXN123456789',
            amount: 100.00,
            payment_method: 'bank_transfer',
            status: 'pending',
            payment_instructions: {
              bank_name: 'Bank Mandiri',
              account_number: '1234567890',
              account_name: 'PT IndoWater'
            }
          }
        }
      });
      
      cy.get('[data-testid="confirm-topup-button"]').click();
      cy.wait('@apiRequest');
      
      // Verify payment instructions
      cy.get('[data-testid="payment-instructions"]').should('be.visible');
      cy.get('[data-testid="transaction-id"]').should('contain', 'TXN123456789');
      cy.get('[data-testid="bank-name"]').should('contain', 'Bank Mandiri');
      cy.get('[data-testid="account-number"]').should('contain', '1234567890');
    });

    it('should complete consumption history workflow', () => {
      cy.visit('/customer/consumption');
      
      // Set date range
      cy.get('[data-testid="period-select"]').select('last_30_days');
      
      cy.interceptApiCall('GET', '/customer/consumption*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            period: 'last_30_days',
            total_consumption: 2500,
            total_cost: 3750000,
            average_daily: 83.33,
            daily_data: [
              { date: '2024-01-01', consumption: 85, cost: 127500 },
              { date: '2024-01-02', consumption: 92, cost: 138000 },
              // ... more data
            ]
          }
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify consumption display
      cy.get('[data-testid="consumption-chart"]').should('be.visible');
      cy.get('[data-testid="total-consumption"]').should('contain', '2,500');
      cy.get('[data-testid="total-cost"]').should('contain', '3,750,000');
      cy.get('[data-testid="average-daily"]').should('contain', '83.33');
      
      // Change period
      cy.get('[data-testid="period-select"]').select('last_12_months');
      cy.wait('@apiRequest');
      
      // Verify chart updates
      cy.get('[data-testid="consumption-chart"]').should('be.visible');
    });

    it('should complete payment history workflow', () => {
      cy.visit('/customer/payments');
      
      cy.interceptApiCall('GET', '/customer/payments*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            payments: [
              {
                id: 'pay1',
                transaction_id: 'TXN123456789',
                amount: 100.00,
                payment_method: 'bank_transfer',
                status: 'completed',
                created_at: '2024-01-10T14:30:00Z'
              },
              {
                id: 'pay2',
                transaction_id: 'TXN987654321',
                amount: 150.00,
                payment_method: 'e_wallet',
                status: 'completed',
                created_at: '2024-01-05T09:15:00Z'
              }
            ],
            pagination: {
              current_page: 1,
              total_pages: 3,
              total_records: 25
            }
          }
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify payment history
      cy.get('[data-testid="payment-list"]').should('be.visible');
      cy.get('[data-testid="payment-item"]').should('have.length', 2);
      
      // Check payment details
      cy.get('[data-testid="payment-item-pay1"]').within(() => {
        cy.get('[data-testid="transaction-id"]').should('contain', 'TXN123456789');
        cy.get('[data-testid="amount"]').should('contain', '100.00');
        cy.get('[data-testid="status"]').should('contain', 'completed');
      });
      
      // Test pagination
      cy.get('[data-testid="next-page-button"]').click();
      cy.wait('@apiRequest');
    });

    it('should complete notification management workflow', () => {
      cy.visit('/customer/notifications');
      
      cy.interceptApiCall('GET', '/customer/notifications', {
        statusCode: 200,
        body: {
          status: 'success',
          data: [
            {
              id: 'notif1',
              type: 'low_balance',
              title: 'Low Balance Alert',
              message: 'Your balance is running low. Current balance: Rp 25,000',
              read: false,
              created_at: '2024-01-15T10:30:00Z'
            },
            {
              id: 'notif2',
              type: 'payment_success',
              title: 'Payment Successful',
              message: 'Your top-up of Rp 100,000 has been processed successfully',
              read: true,
              created_at: '2024-01-10T14:30:00Z'
            }
          ]
        }
      });
      
      cy.wait('@apiRequest');
      
      // Verify notifications
      cy.get('[data-testid="notification-list"]').should('be.visible');
      cy.get('[data-testid="notification-item"]').should('have.length', 2);
      
      // Mark notification as read
      cy.interceptApiCall('PUT', '/customer/notifications/notif1/read', {
        statusCode: 200,
        body: { status: 'success' }
      });
      
      cy.get('[data-testid="notification-item-notif1"]').within(() => {
        cy.get('[data-testid="mark-read-button"]').click();
      });
      
      cy.wait('@apiRequest');
      
      // Verify notification is marked as read
      cy.get('[data-testid="notification-item-notif1"]').should('not.have.class', 'unread');
    });
  });

  describe('Cross-Role Integration Workflows', () => {
    it('should handle meter installation to customer activation flow', () => {
      // Client installs meter
      cy.interceptApiCall('POST', '/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'client-jwt-token',
            user: { id: 'client-1', role: 'client' }
          }
        }
      });
      
      cy.login('client@watercompany.com', 'client123');
      cy.visit('/client/meters/install');
      
      // Install meter
      cy.get('[data-testid="property-select"]').select('1');
      cy.get('[data-testid="meter-serial-input"]').type('SN123456789');
      cy.get('[data-testid="customer-email-input"]').type('newcustomer@example.com');
      
      cy.interceptApiCall('POST', '/meters', {
        statusCode: 201,
        body: {
          status: 'success',
          data: {
            id: 'new-meter-id',
            meter_id: 'MTR003',
            customer_email: 'newcustomer@example.com'
          }
        }
      });
      
      cy.get('[data-testid="install-meter-button"]').click();
      cy.wait('@apiRequest');
      
      // Logout client
      cy.get('[data-testid="logout-button"]').click();
      
      // Customer receives activation email and logs in
      cy.interceptApiCall('POST', '/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'customer-jwt-token',
            user: {
              id: 'customer-new',
              email: 'newcustomer@example.com',
              role: 'customer'
            }
          }
        }
      });
      
      cy.login('newcustomer@example.com', 'newpassword');
      cy.visit('/customer/dashboard');
      
      // Verify meter is available
      cy.interceptApiCall('GET', '/customer/meters', {
        statusCode: 200,
        body: {
          status: 'success',
          data: [
            {
              id: 'new-meter-id',
              meter_id: 'MTR003',
              status: 'active',
              balance: 0.00
            }
          ]
        }
      });
      
      cy.wait('@apiRequest');
      cy.get('[data-testid="meter-list"]').should('contain', 'MTR003');
    });
  });
});
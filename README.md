# IndoWater - Prepaid Water Meter Management System

A comprehensive, multi-tenant Prepaid Water Meter Management System for the Indonesian National Water Authority (IndoWater System).

## Overview

The IndoWater System is a modern and scalable solution designed to digitize water meter management for water authorities in Indonesia. It provides a complete ecosystem for managing prepaid water meters, customer accounts, and payment processing.

### Key Features

- **Multi-tenant Architecture**: Support for multiple water authorities (clients) with isolated data
- **Role-based Access Control**: Superadmin, Client, and Customer roles with appropriate permissions
- **Payment Gateway Integration**: Seamless integration with Midtrans and DOKU payment gateways
- **Real-time Monitoring**: Track water consumption and credit balance in real-time
- **Comprehensive Reporting**: Generate detailed reports and analytics
- **Mobile App**: Flutter-based mobile application for customers
- **Responsive Web Interface**: Modern, water-themed frontend for all user roles

## Technology Stack

### Backend
- PHP API Server with Slim Framework
- MySQL Database
- JWT Authentication
- Payment Gateway: Midtrans & DOKU
- Email Service: PHPMailer
- Documentation: Swagger
- Logging: Monolog
- Security: CORS, Rate Limiting
- Real-time Connection: SSE & Polling

### Frontend
- React, TypeScript, Tailwind CSS
- Language: Indonesian (Default) and English
- Dark and Light Mode
- Themes: Responsive, Modern, Professional, Water-themed, Infographics

### Mobile App
- Flutter
- Provider State Management
- Dio for API Requests
- Local Storage with SharedPreferences and SQLite
- Push Notifications
- Payment Gateway Integration
- QR Code Scanning
- Charts and Graphs for Data Visualization

## User Roles

### Superadmin
- Manage client accounts and properties
- Set rates and water prices for specific clients
- Monitor analytics across the system
- Generate comprehensive reports
- Handle customer support requests
- Manage water meters and customer accounts
- Set service fees for clients
- Integrate payment gateways
- Monitor and control water meters
- Perform OTA updates
- Create invoices and payment schedules

### Clients
- Register multiple properties
- Manage customer accounts
- Link meter IDs with customer numbers
- Handle customer support requests
- Integrate payment gateways
- Monitor meters in real-time
- Set base prices for credits
- Generate reports
- View service fees and revenue infographics

### Customers
- Register and manage water accounts
- Top up prepaid water credits
- Monitor water consumption and credit balance
- View payment history and receipts
- Receive notifications
- Manage profile

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/indowater.git
cd indowater
```

2. Copy environment files:
```bash
cp .env.example .env
```

3. Start the Docker containers for development:
```bash
docker-compose up -d
```

4. Access the applications:
   - API: http://localhost:8000
   - Frontend: http://localhost:3000
   - PHPMyAdmin: http://localhost:8080
   - MailHog: http://localhost:8025

### Production Deployment

1. Clone the repository on your production server:
```bash
git clone https://github.com/yourusername/indowater.git
cd indowater
```

2. Create and configure the environment files:
```bash
# Root environment file
cp .env.production .env
# Edit .env with your production settings
nano .env

# Frontend environment file
cp frontend/.env.production frontend/.env
# Edit frontend/.env with your production settings
nano frontend/.env

# API environment file
cp api/.env.production api/.env
# Edit api/.env with your production settings
nano api/.env
```

3. Set up SSL certificates:
```bash
mkdir -p nginx/ssl
# Copy your SSL certificates to nginx/ssl/indowater.crt and nginx/ssl/indowater.key
```

4. Update the mock data settings:
```bash
# In all .env files, make sure to set the mock data flag to false for production:
# USE_MOCK_DATA=false (in root and API .env files)
# REACT_APP_USE_MOCK_DATA=false (in frontend .env file)
```

5. Configure payment gateway credentials:
```bash
# Replace sandbox credentials with production credentials:
# - Remove SB- prefix from Midtrans client/server keys
# - Update DOKU credentials with production values
# - Set environment variables to 'production' instead of 'sandbox'
```

6. Run the deployment script:
```bash
./deploy.sh
```

7. Access your production site at your configured domain.

### Manual Deployment Steps

If you prefer to deploy manually instead of using the deployment script:

1. Build and start the production containers:
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

2. Run database migrations:
```bash
docker-compose -f docker-compose.prod.yml exec api php artisan migrate --force
```

3. Clear cache:
```bash
docker-compose -f docker-compose.prod.yml exec api php artisan cache:clear
docker-compose -f docker-compose.prod.yml exec api php artisan config:clear
docker-compose -f docker-compose.prod.yml exec api php artisan route:clear
docker-compose -f docker-compose.prod.yml exec api php artisan view:clear
```

4. Set proper permissions:
```bash
docker-compose -f docker-compose.prod.yml exec api chown -R www-data:www-data /var/www/html/storage
```

### Default Credentials

#### Superadmin
- Email: admin@indowater.example.com
- Password: password

#### Demo Client
- Email: client@indowater.example.com
- Password: password

#### Demo Customer
- Email: customer@indowater.example.com
- Password: password

## Testing

### Frontend Tests

The frontend application includes comprehensive tests for components, hooks, and services. To run the tests:

```bash
# Navigate to the frontend directory
cd frontend

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (non-interactive)
npm run test:ci
```

### API Tests

The API includes unit and integration tests. To run the tests:

```bash
# Using Docker
docker-compose exec api composer test

# Or directly from the api directory
cd api
composer test
```

## Development vs Production

### Mock Data Configuration

The application supports both mock data and real API data modes:

- **Development Environment**: By default, the application uses mock data in development to facilitate testing and UI development without requiring a fully functional backend.
  - `USE_MOCK_DATA=true` in root and API .env files
  - `REACT_APP_USE_MOCK_DATA=true` in frontend .env file

- **Production Environment**: In production, the application should use real API data:
  - `USE_MOCK_DATA=false` in root and API .env files
  - `REACT_APP_USE_MOCK_DATA=false` in frontend .env file

### Payment Gateway Configuration

- **Development/Testing**: Uses sandbox credentials (prefixed with "SB-")
  - `MIDTRANS_ENVIRONMENT=sandbox` and `DOKU_ENVIRONMENT=sandbox`
  - Test credentials that don't process real payments

- **Production**: Uses production credentials (no "SB-" prefix)
  - `MIDTRANS_ENVIRONMENT=production` and `DOKU_ENVIRONMENT=production`
  - Real credentials that process actual payments

## Project Structure

```
indowater/
├── api/                  # PHP API Backend
│   ├── database/         # Database migrations and seeders
│   ├── public/           # Public files
│   ├── src/              # Source code
│   └── tests/            # API tests
├── frontend/             # React Frontend
│   ├── public/           # Public files
│   ├── src/              # Source code
│   └── __tests__/        # Frontend tests
├── mobile/               # Flutter Mobile App
│   └── lib/              # Source code
├── nginx/                # Nginx configuration for production
├── docker-compose.yml    # Development Docker configuration
└── docker-compose.prod.yml # Production Docker configuration
```

## API Documentation

API documentation is available at http://localhost:8000/docs when the application is running.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 IndoWater System. All rights reserved.
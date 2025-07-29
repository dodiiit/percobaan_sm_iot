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

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/indowater.git
cd indowater
```

2. Copy environment files:
```bash
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env
```

3. Start the Docker containers:
```bash
docker-compose up -d
```

4. Access the applications:
   - API: http://localhost:8000
   - Frontend: http://localhost:3000
   - PHPMyAdmin: http://localhost:8080
   - MailHog: http://localhost:8025

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
│   └── src/              # Source code
├── mobile/               # Flutter Mobile App
│   └── lib/              # Source code
└── docker-compose.yml    # Docker configuration
```

## API Documentation

API documentation is available at http://localhost:8000/docs when the application is running.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 IndoWater System. All rights reserved.
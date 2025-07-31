# IndoWater IoT Project - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up the IndoWater IoT project for development and understand what needs to be completed.

## 📋 Prerequisites

- PHP 8.1 or higher
- Composer
- MySQL 8.0 or higher
- Node.js 16+ (for frontend development)
- Docker & Docker Compose (recommended)

## 🔧 Backend Setup (Already Complete)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd percobaan_sm_iot/api
composer install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your database and service credentials
```

### 3. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE indowater_iot;"

# Run migrations and seeder
php database/migrate.php
php database/seed.php
```

### 4. Start Development Server

```bash
cd public
php -S localhost:8000
```

## 🎯 What's Already Working

### ✅ Complete Backend API
- **Authentication**: Login, register, password reset, email verification
- **User Management**: Multi-role system (super_admin, client, customer)
- **Meter Management**: CRUD operations, real-time monitoring
- **Payment Processing**: Midtrans/DOKU integration with automatic credit addition
- **Real-time Features**: SSE streaming, webhooks, notifications
- **Email System**: Automated notifications and confirmations

### ✅ API Endpoints (50+)
```
Authentication (8 endpoints):
- POST /auth/login
- POST /auth/register
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/verify-email/{token}
- POST /auth/resend-verification

Users (8 endpoints):
- GET /api/users
- GET /api/users/me
- PUT /api/users/me
- PUT /api/users/me/password
- GET /api/users/{id}
- POST /api/users
- PUT /api/users/{id}
- DELETE /api/users/{id}

Meters (11 endpoints):
- GET /api/meters
- GET /api/meters/{id}
- POST /api/meters
- PUT /api/meters/{id}
- DELETE /api/meters/{id}
- GET /api/meters/{id}/balance ← NEW!
- GET /api/meters/{id}/consumption
- GET /api/meters/{id}/credits
- POST /api/meters/{id}/topup
- GET /api/meters/{id}/status
- POST /api/meters/{id}/ota
- POST /api/meters/{id}/control

Payments (6 endpoints):
- GET /api/payments
- GET /api/payments/{id}
- POST /api/payments
- PUT /api/payments/{id}
- DELETE /api/payments/{id}
- POST /api/payments/{id}/process

Real-time (4 endpoints):
- GET /api/realtime/stream/meters
- GET /api/realtime/stream/notifications
- GET /api/realtime/poll/updates
- GET /api/realtime/meter/{meter_id}/status

Webhooks (3 endpoints):
- POST /webhooks/midtrans
- POST /webhooks/doku
- POST /webhook/realtime
```

## 🎯 What Needs to Be Built

### ❌ Frontend Applications (Priority 1)

#### Customer Dashboard (React/Vue.js)
```
Required Pages:
├── Login/Register
├── Dashboard (balance, consumption overview)
├── Balance Management
│   ├── Current balance display
│   ├── Top-up interface
│   └── Payment history
├── Consumption Analytics
│   ├── Usage charts
│   ├── Historical data
│   └── Billing information
├── Profile Management
└── Notifications
```

#### Client/Admin Dashboard
```
Required Pages:
├── Login
├── Dashboard (system overview)
├── Meter Management
│   ├── Meter list and search
│   ├── Meter details and configuration
│   ├── Real-time monitoring
│   └── Remote control
├── Customer Management
│   ├── Customer list
│   ├── Customer details
│   └── Account management
├── Payment Management
│   ├── Payment processing
│   ├── Transaction history
│   └── Financial reports
├── Analytics & Reports
└── System Configuration
```

### ❌ Mobile Application (Priority 2)
- Customer mobile app (React Native/Flutter)
- Push notifications
- QR code payment integration
- Offline capability

## 🐳 Development Environment Setup

### Option 1: Docker Compose (Recommended)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "8000:80"
    environment:
      - DB_HOST=db
      - DB_NAME=indowater_iot
      - DB_USER=root
      - DB_PASS=password
    depends_on:
      - db
      - redis

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: indowater_iot
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  mysql_data:
```

### Option 2: Manual Setup

1. **Database**: MySQL 8.0
2. **Cache**: Redis (optional but recommended)
3. **Web Server**: Nginx or Apache
4. **PHP**: 8.1+ with required extensions

## 🔧 Frontend Development Setup

### Customer Dashboard (React)

```bash
# Create React app
npx create-react-app customer-dashboard
cd customer-dashboard

# Install required packages
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled
npm install recharts date-fns socket.io-client

# Project structure
src/
├── components/
│   ├── Auth/
│   ├── Dashboard/
│   ├── Balance/
│   ├── Consumption/
│   └── Profile/
├── services/
│   ├── api.js
│   ├── auth.js
│   └── websocket.js
├── utils/
└── pages/
```

### Admin Dashboard (React)

```bash
# Create admin dashboard
npx create-react-app admin-dashboard
cd admin-dashboard

# Install admin-specific packages
npm install @mui/x-data-grid @mui/x-charts
npm install react-hook-form yup @hookform/resolvers

# Project structure
src/
├── components/
│   ├── Meters/
│   ├── Customers/
│   ├── Payments/
│   ├── Analytics/
│   └── Settings/
├── services/
└── pages/
```

## 📡 Real-time Integration

### WebSocket/SSE Integration

```javascript
// Example: Real-time meter data
const eventSource = new EventSource('/api/realtime/stream/meters');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  // Update UI with real-time data
  updateMeterData(data);
};

// Example: Real-time notifications
const notificationSource = new EventSource('/api/realtime/stream/notifications');

notificationSource.onmessage = function(event) {
  const notification = JSON.parse(event.data);
  // Show notification to user
  showNotification(notification);
};
```

## 🧪 Testing the Backend

### API Testing with curl

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@indowater.com","password":"admin123"}'

# Get meters (with token)
curl -X GET http://localhost:8000/api/meters \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check meter balance
curl -X GET http://localhost:8000/api/meters/METER_ID/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Top up meter
curl -X POST http://localhost:8000/api/meters/METER_ID/topup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100000,"description":"Manual top-up"}'
```

### Sample Data Available

The seeder creates:
- **1 Super Admin**: admin@indowater.com / admin123
- **2 Clients**: client1@indowater.com / client123
- **10 Customers**: customer1@indowater.com / customer123
- **20 Smart Meters** with sample data
- **Payment history** and **consumption data**

## 📚 Key Files to Understand

### Backend Architecture
```
api/src/
├── Controllers/          # API endpoints
├── Models/              # Database models
├── Services/            # Business logic
├── Middleware/          # Authentication, CORS, etc.
├── Database/            # Connection, migrations, seeder
└── App.php             # Main application setup
```

### Important Files
- `api/src/App.php` - Main application configuration
- `api/src/Controllers/MeterController.php` - Meter management
- `api/src/Controllers/PaymentController.php` - Payment processing
- `api/src/Services/PaymentService.php` - Payment logic with auto-credit
- `api/src/Models/Meter.php` - Meter model with balance methods
- `API_DOCUMENTATION.md` - Complete API documentation

## 🎯 Development Priorities

### Week 1-2: Customer Dashboard
1. Authentication pages
2. Dashboard overview
3. Balance checking and top-up
4. Basic consumption display

### Week 3-4: Admin Dashboard
1. Login and meter management
2. Customer management
3. Payment processing interface
4. Basic analytics

### Week 5-6: Real-time Features
1. WebSocket/SSE integration
2. Real-time notifications
3. Live meter monitoring
4. Performance optimization

### Week 7-8: Mobile App (Optional)
1. React Native setup
2. Core customer features
3. Push notifications
4. QR code integration

## 🚀 Deployment Preparation

### Production Checklist
- [ ] Frontend applications built and tested
- [ ] Docker containers created
- [ ] SSL certificates obtained
- [ ] Production database setup
- [ ] Environment variables secured
- [ ] Monitoring and logging configured

### Recommended Tech Stack
- **Frontend**: React.js with Material-UI
- **Mobile**: React Native or Flutter
- **Database**: MySQL 8.0 with Redis cache
- **Deployment**: Docker + Kubernetes or Docker Compose
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions or GitLab CI

## 📞 Support

For questions about the backend API or architecture:
- Check `API_DOCUMENTATION.md` for endpoint details
- Review `IMPLEMENTATION_STATUS.md` for feature completeness
- See `PROJECT_COMPLETION_ANALYSIS.md` for deployment roadmap

The backend is production-ready and waiting for frontend interfaces to make it user-accessible!
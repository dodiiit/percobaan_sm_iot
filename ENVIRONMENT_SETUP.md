# Environment Setup Guide for IndoWater

This guide provides instructions for setting up the environment for the IndoWater project.

## Prerequisites

- Docker and Docker Compose
- Node.js (v16+) for frontend development
- PHP 8.1+ for API development
- Flutter SDK for mobile app development

## Environment Files

The project requires several environment files for proper configuration:

### 1. Root .env File (for Docker Compose)

Located at the project root, this file contains environment variables used by Docker Compose:

```
# Database Settings
DB_DATABASE=indowater
DB_USERNAME=indowater
DB_PASSWORD=<secure-password>
DB_ROOT_PASSWORD=<secure-root-password>
DB_PORT=3306

# API Settings
API_PORT=8000

# Frontend Settings
FRONTEND_PORT=3000

# PHPMyAdmin Settings
PMA_PORT=8080

# Redis Settings
REDIS_PORT=6379

# Mailhog Settings
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025
```

### 2. API .env File

Located in the `/api` directory, this file contains environment variables for the PHP API:

```
APP_NAME=IndoWater
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_KEY=<secure-app-key>

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=indowater
DB_USERNAME=indowater
DB_PASSWORD=<secure-password>

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=null

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=info@indowater.example.com
MAIL_FROM_NAME="${APP_NAME}"

JWT_SECRET=<secure-jwt-secret>

# Payment Gateway Settings
MIDTRANS_CLIENT_KEY=<midtrans-client-key>
MIDTRANS_SERVER_KEY=<midtrans-server-key>
MIDTRANS_MERCHANT_ID=<midtrans-merchant-id>
MIDTRANS_ENVIRONMENT=sandbox

DOKU_CLIENT_ID=<doku-client-id>
DOKU_SECRET_KEY=<doku-secret-key>
DOKU_ENVIRONMENT=sandbox

# Notification Settings
WHATSAPP_API_URL=<whatsapp-api-url>
WHATSAPP_API_KEY=<whatsapp-api-key>

SMS_API_URL=<sms-api-url>
SMS_API_KEY=<sms-api-key>
SMS_SENDER_ID=IndoWater

# Security Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_PER_MINUTE=1
```

### 3. Frontend .env File

Located in the `/frontend` directory, this file contains environment variables for the React frontend:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_NAME=IndoWater
REACT_APP_ENV=development
REACT_APP_DEFAULT_LANGUAGE=id
REACT_APP_MIDTRANS_CLIENT_KEY=<midtrans-client-key>
REACT_APP_DOKU_CLIENT_ID=<doku-client-id>
```

### 4. Mobile .env File

Located in the `/mobile` directory, this file contains environment variables for the Flutter mobile app:

```
# API Settings
API_URL=http://localhost:8000/api

# App Settings
APP_NAME=IndoWater
APP_ENV=development
APP_DEBUG=true

# Midtrans Payment Gateway
MIDTRANS_CLIENT_KEY=<midtrans-client-key>
MIDTRANS_ENVIRONMENT=sandbox

# DOKU Payment Gateway
DOKU_CLIENT_ID=<doku-client-id>
DOKU_ENVIRONMENT=sandbox

# Firebase Settings
FIREBASE_API_KEY=<firebase-api-key>
FIREBASE_APP_ID=<firebase-app-id>
FIREBASE_MESSAGING_SENDER_ID=<firebase-messaging-sender-id>
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
```

## Setting Up Environment Files

1. Copy the example environment files:
   ```bash
   cp .env.example .env
   cp api/.env.example api/.env
   cp frontend/.env.example frontend/.env
   ```

2. Generate secure values for sensitive environment variables:
   ```bash
   # Generate APP_KEY for API
   APP_KEY=$(openssl rand -base64 32)
   sed -i "s|APP_KEY=|APP_KEY=$APP_KEY|" api/.env

   # Generate JWT_SECRET for API
   JWT_SECRET=$(openssl rand -base64 32)
   sed -i "s|JWT_SECRET=|JWT_SECRET=$JWT_SECRET|" api/.env

   # Generate secure database passwords
   DB_PASSWORD=$(openssl rand -hex 12)
   DB_ROOT_PASSWORD=$(openssl rand -hex 16)
   sed -i "s|DB_PASSWORD=indowater_password|DB_PASSWORD=$DB_PASSWORD|" api/.env
   echo "DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD" >> api/.env
   ```

3. Update payment gateway credentials with actual values from your payment gateway providers.

## Starting the Application

After setting up the environment files, you can start the application using Docker Compose:

```bash
docker-compose up -d
```

This will start all the services defined in the `docker-compose.yml` file.

## Initializing the Database

After starting the services, you need to run the database migrations and seeders:

```bash
docker-compose exec api php artisan migrate --seed
```

## Accessing the Application

- API: http://localhost:8000
- Frontend: http://localhost:3000
- PHPMyAdmin: http://localhost:8080
- Mailhog: http://localhost:8025

## Security Considerations

- In production, use strong, unique passwords for all services
- Store sensitive credentials securely and do not commit them to version control
- Use HTTPS for all production endpoints
- Regularly rotate API keys and secrets
- Implement proper access controls and authentication mechanisms
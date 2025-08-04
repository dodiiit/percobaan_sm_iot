#!/bin/bash

echo "🚀 Installing IndoWater IoT Project..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p api/storage/logs
mkdir -p api/storage/cache
mkdir -p api/storage/uploads
mkdir -p frontend/build
mkdir -p mobile/build

# Set permissions
chmod -R 755 api/storage
chmod -R 755 frontend/build
chmod -R 755 mobile/build

# Copy environment files if they don't exist
echo "⚙️  Setting up environment files..."

if [ ! -f api/.env ]; then
    echo "✅ API .env file already created"
else
    echo "⚠️  API .env file already exists, skipping..."
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Frontend .env file created"
else
    echo "⚠️  Frontend .env file already exists, skipping..."
fi

# Install dependencies
echo "📦 Installing dependencies..."

# API dependencies
echo "Installing PHP dependencies..."
cd api
if [ -f composer.json ]; then
    if command -v composer &> /dev/null; then
        composer install --no-dev --optimize-autoloader
    else
        echo "⚠️  Composer not found. Dependencies will be installed via Docker."
    fi
fi
cd ..

# Frontend dependencies
echo "Installing Node.js dependencies..."
cd frontend
if [ -f package.json ]; then
    if command -v npm &> /dev/null; then
        npm install
    else
        echo "⚠️  npm not found. Dependencies will be installed via Docker."
    fi
fi
cd ..

# Mobile dependencies
echo "Installing Flutter dependencies..."
cd mobile
if [ -f pubspec.yaml ]; then
    if command -v flutter &> /dev/null; then
        flutter pub get
    else
        echo "⚠️  Flutter not found. Dependencies will be installed via Docker."
    fi
fi
cd ..

# Build and start containers
echo "🐳 Building and starting Docker containers..."
docker-compose up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations and seeders
echo "🗄️  Setting up database..."
docker-compose exec api php database/seeders/DatabaseSeeder.php

echo ""
echo "🎉 Installation completed!"
echo ""
echo "📋 Services are now running:"
echo "   • API: http://localhost:8000"
echo "   • Frontend: http://localhost:3000"
echo "   • Database: localhost:3306"
echo "   • PHPMyAdmin: http://localhost:8080"
echo "   • MailHog: http://localhost:8025"
echo ""
echo "🔑 Default credentials:"
echo "   • Super Admin: admin@indowater.com / admin123"
echo "   • Client: client@aquamandiri.com / client123"
echo "   • Customer: john.doe@example.com / customer123"
echo ""
echo "📖 Next steps:"
echo "   1. Open http://localhost:3000 to access the frontend"
echo "   2. Login with the credentials above"
echo "   3. Check the API documentation at http://localhost:8000/health"
echo ""
echo "🛠️  To stop the services: docker-compose down"
echo "🔄 To restart the services: docker-compose up -d"
echo ""
echo "Happy coding! 🚀"
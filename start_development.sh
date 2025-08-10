#!/bin/bash

# IndoWater Development Environment Startup Script

echo "🚀 Starting IndoWater Development Environment..."
echo "=================================================="

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check required ports
echo "🔍 Checking required ports..."
check_port 8000  # API
check_port 3000  # Frontend
check_port 3306  # MySQL
check_port 6379  # Redis

echo ""
echo "📋 Available startup options:"
echo "1. Start with Docker Compose (recommended)"
echo "2. Start API only (PHP built-in server)"
echo "3. Start Frontend only (Vite dev server)"
echo "4. Start all components manually"
echo "5. Run tests"
echo ""

read -p "Choose an option (1-5): " choice

case $choice in
    1)
        echo "🐳 Starting with Docker Compose..."
        docker-compose up -d
        echo ""
        echo "✅ Services started!"
        echo "📍 API: http://localhost:8000"
        echo "📍 Frontend: http://localhost:3000"
        echo "📍 Database: localhost:3306"
        echo "📍 Redis: localhost:6379"
        echo "📍 MailHog: http://localhost:8025"
        ;;
    2)
        echo "🔧 Starting API only..."
        cd api
        php -S localhost:8000 -t public
        ;;
    3)
        echo "⚛️ Starting Frontend only..."
        cd frontend
        npm run dev -- --host 0.0.0.0 --port 3000
        ;;
    4)
        echo "🔧 Starting all components manually..."
        
        # Start API in background
        echo "Starting API..."
        cd api
        php -S localhost:8000 -t public > ../api.log 2>&1 &
        API_PID=$!
        cd ..
        
        # Start Frontend in background
        echo "Starting Frontend..."
        cd frontend
        npm run dev -- --host 0.0.0.0 --port 3000 > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        echo "✅ Services started!"
        echo "📍 API: http://localhost:8000 (PID: $API_PID)"
        echo "📍 Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
        echo ""
        echo "To stop services:"
        echo "kill $API_PID $FRONTEND_PID"
        
        # Wait for user input to stop
        read -p "Press Enter to stop all services..."
        kill $API_PID $FRONTEND_PID 2>/dev/null
        echo "🛑 Services stopped"
        ;;
    5)
        echo "🧪 Running tests..."
        
        echo "Testing API..."
        cd api
        if [ -f "vendor/bin/phpunit" ]; then
            vendor/bin/phpunit
        else
            echo "⚠️  PHPUnit not found, skipping API tests"
        fi
        cd ..
        
        echo "Testing Frontend..."
        cd frontend
        npm test -- --watchAll=false
        cd ..
        
        echo "✅ Tests completed"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "📚 Useful commands:"
echo "  - View API logs: tail -f api.log"
echo "  - View Frontend logs: tail -f frontend.log"
echo "  - Stop Docker: docker-compose down"
echo "  - View containers: docker-compose ps"
echo "  - Database access: docker-compose exec db mysql -u indowater -p"
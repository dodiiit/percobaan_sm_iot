#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
  echo "Error: .env file not found. Please create one based on .env.example"
  exit 1
fi

# Check if docker and docker-compose are installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: docker is not installed." >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Error: docker-compose is not installed." >&2
  exit 1
fi

# Pull latest changes
echo "Pulling latest changes from git repository..."
git pull

# Build and start containers
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec api php artisan migrate --force

# Clear cache
echo "Clearing cache..."
docker-compose -f docker-compose.prod.yml exec api php artisan cache:clear
docker-compose -f docker-compose.prod.yml exec api php artisan config:clear
docker-compose -f docker-compose.prod.yml exec api php artisan route:clear
docker-compose -f docker-compose.prod.yml exec api php artisan view:clear

# Set proper permissions
echo "Setting proper permissions..."
docker-compose -f docker-compose.prod.yml exec api chown -R www-data:www-data /var/www/html/storage

echo "Deployment completed successfully!"
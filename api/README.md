# IndoWater API

The IndoWater API is a RESTful API built with PHP and the Slim Framework. It provides endpoints for managing water metering systems, including user authentication, client management, customer management, property management, meter management, payment processing, and reporting.

## Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Composer

## Installation

1. Clone the repository:

```bash
git clone https://github.com/pakkmentri/IndoWater.git
cd IndoWater/api
```

2. Install dependencies:

```bash
composer install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and other configuration options.

5. Run the database migrations:

```bash
php database/migrate.php
```

## Running the API

### Using PHP's built-in server (for development):

```bash
php -S localhost:8000 -t public
```

### Using Docker:

```bash
docker-compose up -d
```

The API will be available at `http://localhost:8000`.

## API Documentation

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## Project Structure

```
api/
├── config/              # Configuration files
│   ├── container.php    # Dependency container configuration
│   ├── middleware.php   # Middleware configuration
│   ├── routes.php       # Route definitions
│   └── settings.php     # Application settings
├── database/            # Database migrations and seeds
│   ├── migrations/      # Database migration files
│   └── seeds/           # Database seed files
├── public/              # Public directory (web root)
│   └── index.php        # Entry point
├── src/                 # Application source code
│   ├── Controllers/     # Controller classes
│   ├── Middleware/      # Middleware classes
│   └── Models/          # Model classes
├── .env.example         # Example environment variables
├── composer.json        # Composer dependencies
└── README.md            # This file
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected endpoints, you need to include the JWT token in the Authorization header of your requests.

```
Authorization: Bearer {your_token}
```

## Error Handling

The API returns consistent error responses with appropriate HTTP status codes. Error responses have the following format:

```json
{
  "status": "error",
  "message": "Error message"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 60 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

## Testing

To run the tests:

```bash
composer test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or inquiries, please contact:

- Email: support@indowater.com
- Website: https://indowater.com
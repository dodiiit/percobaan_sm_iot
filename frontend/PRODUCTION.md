# IndoWater Production Deployment Guide

This guide provides instructions for optimizing and deploying the IndoWater frontend application to production environments.

## Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Access to the production server or hosting platform

## Optimization Steps

### 1. Environment Configuration

The application uses environment-specific configuration files:

- `.env.development` - Development environment settings
- `.env.production` - Production environment settings

Before deployment, ensure the `.env.production` file contains the correct settings:

```
REACT_APP_API_URL=https://api.indowater.com/api/v1
REACT_APP_USE_MOCK_API=false
GENERATE_SOURCEMAP=false
REACT_APP_ENV=production
```

### 2. Code Optimization

Run the following commands to optimize the codebase:

```bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Optimize images
npm run optimize:images
```

### 3. Production Build

Create an optimized production build:

```bash
npm run build:production
```

This will:
- Use production environment variables
- Minify JavaScript and CSS
- Optimize asset loading
- Disable source maps
- Apply tree shaking to remove unused code

### 4. Bundle Analysis (Optional)

To analyze the bundle size and identify optimization opportunities:

```bash
npm run analyze:bundle
```

This will generate a report at `reports/bundle-analysis.html`.

### 5. Deployment

#### Option 1: Static Hosting (Recommended)

The optimized build can be deployed to any static hosting service:

1. Copy the contents of the `build` directory to your hosting provider
2. Configure the server to redirect all requests to `index.html` for client-side routing

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name indowater.com www.indowater.com;
    
    root /path/to/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

#### Option 2: Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t indowater-frontend:latest .

# Run the container
docker run -p 80:80 indowater-frontend:latest
```

### 6. Performance Testing

After deployment, verify the application's performance:

1. Run Lighthouse audits in Chrome DevTools
2. Test loading times on various devices and network conditions
3. Verify that all features work correctly in the production environment

## Maintenance

### Monitoring

Set up monitoring for the production application:

- Configure error tracking (e.g., Sentry)
- Set up performance monitoring
- Implement uptime checks

### Updates

When updating the application:

1. Test changes thoroughly in a staging environment
2. Follow the optimization steps above
3. Deploy during low-traffic periods
4. Monitor the application after deployment

## Troubleshooting

### Common Issues

1. **Blank page after deployment**
   - Check that server is configured to handle client-side routing
   - Verify that all assets are being served correctly

2. **API connection issues**
   - Confirm that `REACT_APP_API_URL` is set correctly
   - Check for CORS configuration on the API server

3. **Performance issues**
   - Run bundle analysis to identify large dependencies
   - Optimize image sizes
   - Implement code splitting for large components

For additional support, contact the development team.
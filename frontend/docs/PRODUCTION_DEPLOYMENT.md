# Production Deployment Guide

This document outlines the steps to prepare and deploy the IndoWater frontend application for production.

## Pre-Deployment Checklist

Before deploying to production, ensure the following:

1. All features are tested and working correctly
2. Internationalization is complete with all strings translated
3. Performance optimizations are implemented
4. Security measures are in place
5. Environment variables are configured correctly

## Build Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Optimize Images

```bash
npm run optimize:images
```

This script:
- Converts images to WebP format
- Generates multiple sizes for responsive images
- Optimizes SVGs using SVGO
- Compresses PNG and JPEG images

### 3. Check Translations

```bash
npm run check-translations
```

This ensures all translation keys are present in all language files.

### 4. Production Build

```bash
npm run build:prod
```

This command:
- Runs the image optimization script
- Sets NODE_ENV to production
- Compiles TypeScript
- Bundles the application with Vite
- Applies all optimizations (minification, tree-shaking, code splitting)
- Generates compressed assets (gzip and Brotli)

The output is in the `dist` directory.

## Deployment Options

### Option 1: Static Hosting (Recommended)

The application can be deployed to any static hosting service:

- AWS S3 + CloudFront
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

Example deployment to AWS S3:

```bash
aws s3 sync dist/ s3://your-bucket-name/ --delete
```

### Option 2: Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
docker build -t indowater-frontend:latest .
docker run -p 80:80 indowater-frontend:latest
```

### Option 3: Traditional Web Server

For deployment to a traditional web server (Nginx, Apache):

1. Copy the contents of the `dist` directory to your web server's document root
2. Configure the server to handle client-side routing

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    }
}
```

## Environment Configuration

The application uses environment variables for configuration. Create a `.env.production` file with the following variables:

```
VITE_API_URL=https://api.your-domain.com
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

## Post-Deployment Verification

After deployment, verify:

1. The application loads correctly
2. All features work as expected
3. Performance metrics are acceptable
4. No console errors are present
5. All API endpoints are correctly configured

## Monitoring

Monitor the application using:

1. The built-in performance monitoring
2. Google Analytics or similar service
3. Error tracking (Sentry, LogRocket, etc.)
4. Server logs

## Rollback Procedure

If issues are detected in production:

1. Identify the nature of the issue
2. If critical, roll back to the previous version
3. Fix the issue in development
4. Deploy a new version after thorough testing

## Continuous Deployment

For automated deployments, consider setting up a CI/CD pipeline using:

- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI
- AWS CodePipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Optimize images
        run: npm run optimize:images
        
      - name: Check translations
        run: npm run check-translations
        
      - name: Build
        run: npm run build:prod
        
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'dist'
```
# Development Guide - Ling Industri IoT System

## Frontend Development

### Quick Start

Due to Vite dev server compatibility issues in the container environment, we recommend using the production build for development:

```bash
cd frontend
npm run dev-production
```

This will:
1. Build the application using the simple configuration
2. Serve the built files on http://localhost:12000

### Alternative Development Methods

#### 1. Production Build + Python Server (Recommended)
```bash
npm run build:simple
npm run serve-dist
```

#### 2. Standard Vite Dev Server (May have issues)
```bash
npm run dev
```
Note: The Vite dev server may hang in container environments. Use production build method if this occurs.

#### 3. Manual Build and Serve
```bash
# Build the application
npm run build:simple

# Serve manually
cd dist
python3 -m http.server 12000 --bind 0.0.0.0
```

### Available Scripts

- `npm run dev` - Standard Vite dev server
- `npm run dev-production` - Build and serve production version for development
- `npm run build:simple` - Quick build using simple configuration
- `npm run build` - Full production build with optimizations
- `npm run serve-dist` - Serve the built application
- `npm run preview` - Vite preview server

### Environment Configuration

The application uses environment variables prefixed with `VITE_`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_NAME=Ling Industri IoT
```

### Troubleshooting

#### Vite Dev Server Hangs
If the Vite dev server starts but HTTP requests hang:
1. Kill all Vite processes: `pkill -f vite`
2. Use production build method: `npm run dev-production`

#### Port Already in Use
```bash
# Kill processes using ports 12000-12020
fuser -k 12000/tcp 12001/tcp
# Or use different port
cd dist && python3 -m http.server 12020 --bind 0.0.0.0
```

#### Build Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall dependencies
npm install

# Try simple build
npm run build:simple
```

## Backend Development

### API Server
The backend API runs on port 8000. Make sure it's running before starting frontend development.

### Database
The system uses MySQL with the database name `lingindustri`.

## Monitoring System

The monitoring system includes:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Prometheus
- Grafana
- Custom monitoring dashboard

All monitoring services are configured with `lingindustri-*` naming convention.

## Production Deployment

For production deployment, use:
```bash
npm run build:prod
```

This creates an optimized build in the `dist/` directory.
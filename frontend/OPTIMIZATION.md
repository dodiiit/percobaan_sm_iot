# IndoWater Frontend Optimization Guide

This document provides information about the optimization features implemented in the IndoWater frontend application and how to use them.

## Table of Contents

1. [Bundle Size Optimization](#bundle-size-optimization)
2. [Code Splitting and Lazy Loading](#code-splitting-and-lazy-loading)
3. [Performance Monitoring](#performance-monitoring)
4. [Image Optimization](#image-optimization)
5. [Service Worker and Offline Support](#service-worker-and-offline-support)
6. [Analysis Tools](#analysis-tools)

## Bundle Size Optimization

The application has been configured to optimize bundle size using several techniques:

- **Chunk Splitting**: Vendor code is split into separate chunks to improve caching
- **Tree Shaking**: Unused code is eliminated during the build process
- **Minification**: Code is minified and compressed for production builds
- **Compression**: Gzip and Brotli compression are applied to all assets

### How to Build for Production

```bash
# Standard production build
npm run build:prod

# Build with bundle analysis
npm run build:analyze
```

## Code Splitting and Lazy Loading

The application uses React's lazy loading and Suspense to split code into smaller chunks that are loaded on demand:

- **Route-based Splitting**: Each route is loaded only when needed
- **Component-based Splitting**: Large components are split into separate chunks
- **Dynamic Imports**: Used for features that aren't needed immediately

### Implementation Details

- All routes in `App.tsx` are lazy-loaded
- A loading fallback is shown during chunk loading
- Preloading is used for critical routes to improve perceived performance

## Performance Monitoring

The application includes built-in performance monitoring:

- **Web Vitals**: Core Web Vitals are tracked and reported
- **Long Tasks**: Tasks that block the main thread are monitored
- **Resource Loading**: Slow resource loads are detected and logged
- **Custom Measurements**: Performance marks and measures for specific operations

### How to Use Performance Monitoring

The `PerformanceMonitor` component is automatically included in the application. You can also use the performance utilities directly:

```typescript
import { measurePerformance } from '../utils/performance';

// Measure a specific operation
const measurement = measurePerformance('operation-name');
measurement.start();
// ... perform operation
const duration = measurement.end(); // Returns duration in ms
```

## Image Optimization

Several image optimization techniques are implemented:

- **Responsive Images**: Images are served at the appropriate size for each device
- **Modern Formats**: WebP and AVIF formats are used when supported
- **Lazy Loading**: Images are loaded only when they enter the viewport
- **Preloading**: Critical images are preloaded for better performance

### How to Use the OptimizedImage Component

```tsx
import OptimizedImage from '../components/common/OptimizedImage';

// Basic usage
<OptimizedImage 
  src="/path/to/image.jpg" 
  alt="Description" 
  width={800} 
  height={600} 
/>

// With custom options
<OptimizedImage 
  src="/path/to/image.jpg" 
  alt="Description" 
  width={800} 
  height={600}
  lazy={true}
  className="custom-class"
  widths={[320, 640, 960, 1280]}
  sizes={[
    { media: '(max-width: 640px)', size: '100vw' },
    { media: '(max-width: 1024px)', size: '50vw' },
    { media: '(min-width: 1025px)', size: '33vw' },
  ]}
  onLoad={() => console.log('Image loaded')}
  onError={() => console.log('Image failed to load')}
/>
```

### How to Optimize Images

```bash
# Run the image optimization script
npm run optimize:images
```

## Service Worker and Offline Support

The application includes a service worker for offline support and improved performance:

- **Offline Mode**: Basic functionality works without an internet connection
- **Caching**: Assets and API responses are cached for faster loading
- **Background Updates**: New versions are downloaded in the background
- **Update Notifications**: Users are notified when a new version is available

### Service Worker Features

- Precaching of critical assets
- Runtime caching of dynamic content
- Network-first strategy for API requests
- Cache-first strategy for static assets
- Offline fallback page

## Analysis Tools

Several tools are included to analyze and improve the application:

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Explore source maps
npm run check:bundle
```

### Dependency Analysis

```bash
# Check for unused dependencies
npm run check:deps
```

### Performance Analysis

```bash
# Run Lighthouse analysis
npm run analyze:performance
```

## Best Practices

1. **Use Lazy Loading**: Always use lazy loading for routes and large components
2. **Optimize Images**: Use the OptimizedImage component for all images
3. **Monitor Performance**: Check the performance reports regularly
4. **Keep Dependencies Lean**: Run dependency checks before adding new packages
5. **Test on Real Devices**: Performance can vary significantly between devices

## Further Improvements

- Implement server-side rendering for improved initial load time
- Add HTTP/2 server push for critical assets
- Implement resource hints (preconnect, prefetch) for third-party resources
- Add automated performance budgets and CI checks
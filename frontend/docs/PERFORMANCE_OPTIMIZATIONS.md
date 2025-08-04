# Performance Optimizations

This document outlines the performance optimizations implemented in the IndoWater frontend application.

## Bundle Size Optimization

### Code Splitting

The application uses dynamic imports and React.lazy to split the code into smaller chunks that are loaded on demand:

```tsx
const Dashboard = lazy(() => import('./pages/dashboard/customer/Dashboard'));
```

This ensures that users only download the code they need for the current page, reducing initial load time.

### Chunk Optimization

The build configuration in `vite.config.ts` splits vendor code into separate chunks:

```js
manualChunks: (id) => {
  // Core React libraries
  if (id.includes('node_modules/react')) {
    return 'react-vendor';
  }
  
  // MUI libraries
  if (id.includes('node_modules/@mui')) {
    return 'mui-vendor';
  }
  
  // ...other chunks
}
```

This improves caching as vendor libraries change less frequently than application code.

### Tree Shaking

The build process uses tree shaking to eliminate dead code. To maximize its effectiveness:

- Use ES modules (import/export) instead of CommonJS (require)
- Avoid importing entire libraries when only specific functions are needed
- Use side-effect-free code where possible

## Image Optimization

### Responsive Images

The application generates multiple sizes of each image during the build process using the `optimize-images.js` script:

```js
npm run optimize:images
```

This creates WebP versions and multiple resolutions of each image.

### Lazy Loading

Images are lazy-loaded using the `LazyImage` component:

```tsx
<LazyImage 
  src="/path/to/image.jpg" 
  alt="Description" 
  width={300} 
  height={200} 
/>
```

This component uses IntersectionObserver to load images only when they enter the viewport.

## Performance Monitoring

The application includes comprehensive performance monitoring:

```tsx
// Initialize in your main component
import { initPerformanceMonitoring } from '../utils/performance';

useEffect(() => {
  initPerformanceMonitoring();
}, []);
```

This tracks:
- Core Web Vitals (LCP, FID, CLS, etc.)
- Long tasks
- Resource loading
- Custom performance marks and measures

## Compression

The build process compresses assets using both gzip and Brotli:

```js
compression({
  algorithm: 'gzip',
  exclude: [/\.(br)$/, /\.(gz)$/],
}),
compression({
  algorithm: 'brotliCompress',
  exclude: [/\.(br)$/, /\.(gz)$/],
}),
```

## Minification

JavaScript and CSS are minified using Terser with aggressive settings:

```js
terserOptions: {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
    passes: 2,
  },
  mangle: {
    safari10: true,
  },
  format: {
    comments: false,
  },
},
```

## Best Practices

### Component Optimization

- Use React.memo for components that render often but with the same props
- Use useCallback and useMemo to prevent unnecessary re-renders
- Keep component state as local as possible
- Use virtualization for long lists (react-window or react-virtualized)

### CSS Optimization

- Use CSS-in-JS with emotion for better tree-shaking
- Avoid large CSS frameworks
- Use utility classes from Tailwind CSS

### Font Optimization

- Use system fonts where possible
- Load custom fonts with `font-display: swap`
- Preload critical fonts

### Third-Party Scripts

- Load non-critical third-party scripts asynchronously
- Use resource hints (preconnect, dns-prefetch) for external domains

## Measuring Performance

To analyze bundle size:

```bash
npm run analyze
```

This generates a visualization of the bundle size in `stats.html`.

## Further Improvements

- Implement server-side rendering (SSR) or static site generation (SSG) for critical pages
- Use service workers for offline support and caching
- Implement HTTP/2 server push for critical resources
- Consider using a CDN for static assets
/**
 * Image Optimization Utility
 * 
 * This utility provides functions for optimizing images in the application.
 * It includes:
 * - Responsive image loading with srcset
 * - Lazy loading images
 * - Image format detection and optimization
 */

// Types for image optimization
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

// Generate srcset for responsive images
export const generateSrcSet = (src: string, widths: number[] = [640, 750, 828, 1080, 1200, 1920]): string => {
  // Skip for SVGs as they are already responsive
  if (src.endsWith('.svg')) {
    return src;
  }
  
  // For external URLs, we can't generate srcset
  if (src.startsWith('http') || src.startsWith('//')) {
    return src;
  }
  
  // Generate srcset for local images
  const basePath = src.substring(0, src.lastIndexOf('.'));
  const extension = src.substring(src.lastIndexOf('.'));
  
  return widths
    .map(width => `${basePath}-${width}w${extension} ${width}w`)
    .join(', ');
};

// Get image dimensions from filename (if available)
export const getImageDimensions = (src: string): { width: number | undefined; height: number | undefined } => {
  const dimensions: { width: number | undefined; height: number | undefined } = { width: undefined, height: undefined };
  
  // Try to extract dimensions from filename (e.g., image-800x600.jpg)
  const match = src.match(/(\d+)x(\d+)/);
  if (match && match.length === 3) {
    dimensions.width = parseInt(match[1], 10);
    dimensions.height = parseInt(match[2], 10);
  }
  
  return dimensions;
};

// Get appropriate image format based on browser support
export const getOptimalImageFormat = (src: string): string => {
  // If the browser supports WebP, use it for better compression
  const supportsWebP = typeof window !== 'undefined' && 
    window.document && 
    'imageRendering' in document.documentElement.style;
  
  // Don't convert SVGs
  if (src.endsWith('.svg')) {
    return src;
  }
  
  // For external URLs, return as is
  if (src.startsWith('http') || src.startsWith('//')) {
    return src;
  }
  
  // Convert to WebP if supported
  if (supportsWebP) {
    const basePath = src.substring(0, src.lastIndexOf('.'));
    return `${basePath}.webp`;
  }
  
  return src;
};

// Create optimized image component props
export const getOptimizedImageProps = (props: OptimizedImageProps): OptimizedImageProps => {
  const { src, alt, width, height, sizes = '100vw', className, loading = 'lazy', decoding = 'async', fetchPriority = 'auto' } = props;
  
  // Get dimensions from filename if not provided
  const dimensions = getImageDimensions(src);
  const imageWidth = width || dimensions.width;
  const imageHeight = height || dimensions.height;
  
  // Get optimal format
  const optimizedSrc = getOptimalImageFormat(src);
  
  // Generate srcset
  const srcSet = generateSrcSet(optimizedSrc);
  
  return {
    src: optimizedSrc,
    alt,
    width: imageWidth,
    height: imageHeight,
    sizes,
    className,
    loading,
    decoding,
    fetchPriority,
    ...(srcSet !== optimizedSrc ? { srcSet } : {})
  };
};

// Preload critical images
export const preloadCriticalImages = (imagePaths: string[]): void => {
  if (typeof document === 'undefined') return;
  
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimalImageFormat(path);
    document.head.appendChild(link);
  });
};

// Lazy load images that are not in the viewport
export const setupLazyLoading = (): void => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const dataSrc = img.getAttribute('data-src');
        
        if (dataSrc) {
          img.src = dataSrc;
          img.removeAttribute('data-src');
        }
        
        const dataSrcSet = img.getAttribute('data-srcset');
        if (dataSrcSet) {
          img.srcset = dataSrcSet;
          img.removeAttribute('data-srcset');
        }
        
        imageObserver.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach(img => {
    imageObserver.observe(img);
  });
};
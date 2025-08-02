/**
 * Utility functions for image optimization
 */

/**
 * Generates a responsive image URL with appropriate size parameters
 * @param url - Original image URL
 * @param width - Desired width
 * @param height - Desired height (optional)
 * @param format - Image format (webp, avif, jpeg, png)
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  height?: number,
  format: 'webp' | 'avif' | 'jpeg' | 'png' = 'webp'
): string => {
  // If URL is from an image CDN or service that supports optimization
  if (url.includes('imagecdn.example.com')) {
    const params = new URLSearchParams();
    params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('f', format);
    params.append('q', format === 'webp' || format === 'avif' ? '80' : '85');
    
    // Add a cache-busting parameter for development
    if (process.env.NODE_ENV !== 'production') {
      params.append('cb', Date.now().toString());
    }
    
    return `${url}?${params.toString()}`;
  }
  
  // For local images, we can't dynamically optimize them at runtime
  // Return the original URL
  return url;
};

/**
 * Generates a set of srcset URLs for responsive images
 * @param url - Original image URL
 * @param widths - Array of widths to generate
 * @param format - Image format
 * @returns srcset string
 */
export const generateSrcSet = (
  url: string,
  widths: number[] = [320, 640, 960, 1280, 1920],
  format: 'webp' | 'avif' | 'jpeg' | 'png' = 'webp'
): string => {
  return widths
    .map((width) => `${getOptimizedImageUrl(url, width, undefined, format)} ${width}w`)
    .join(', ');
};

/**
 * Generates a set of sizes attribute values for responsive images
 * @param sizes - Array of media query and size pairs
 * @returns sizes string
 */
export const generateSizes = (
  sizes: Array<{ media: string; size: string }> = [
    { media: '(max-width: 640px)', size: '100vw' },
    { media: '(max-width: 1024px)', size: '50vw' },
    { media: '(min-width: 1025px)', size: '33vw' },
  ]
): string => {
  return sizes
    .map(({ media, size }) => `${media} ${size}`)
    .join(', ');
};

/**
 * Lazy loads an image with IntersectionObserver
 * @param imageRef - React ref to the image element
 * @param src - Image source URL
 * @param srcSet - Optional srcset attribute
 * @param sizes - Optional sizes attribute
 */
export const lazyLoadImage = (
  imageRef: React.RefObject<HTMLImageElement>,
  src: string,
  srcSet?: string,
  sizes?: string
): void => {
  if (!imageRef.current || typeof IntersectionObserver === 'undefined') {
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        image.src = src;
        if (srcSet) image.srcset = srcSet;
        if (sizes) image.sizes = sizes;
        observer.disconnect();
      }
    });
  }, {
    rootMargin: '200px', // Start loading when image is 200px from viewport
  });
  
  observer.observe(imageRef.current);
};

/**
 * Preloads critical images
 * @param urls - Array of image URLs to preload
 */
export const preloadCriticalImages = (urls: string[]): void => {
  if (typeof document === 'undefined') return;
  
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Checks if the browser supports modern image formats
 * @returns Object with support status for each format
 */
export const checkImageFormatSupport = (): {
  webp: boolean;
  avif: boolean;
} => {
  if (typeof document === 'undefined') {
    return { webp: false, avif: false };
  }
  
  const canvas = document.createElement('canvas');
  if (!canvas || !canvas.getContext) {
    return { webp: false, avif: false };
  }
  
  // Check WebP support
  const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  // AVIF support is harder to detect, so we'll use a feature detection approach
  // This is a simplified check and might not be 100% accurate
  const avifSupport = false; // Default to false for now
  
  return { webp: webpSupport, avif: avifSupport };
};

/**
 * Gets the best supported image format for the current browser
 * @returns Best supported format
 */
export const getBestSupportedFormat = (): 'avif' | 'webp' | 'jpeg' => {
  const { avif, webp } = checkImageFormatSupport();
  if (avif) return 'avif';
  if (webp) return 'webp';
  return 'jpeg';
};

/**
 * Optimizes an image URL based on the best supported format
 * @param url - Original image URL
 * @param width - Desired width
 * @param height - Desired height (optional)
 * @returns Optimized image URL with the best supported format
 */
export const getOptimizedImageUrlAuto = (
  url: string,
  width: number,
  height?: number
): string => {
  const bestFormat = getBestSupportedFormat();
  return getOptimizedImageUrl(url, width, height, bestFormat);
};
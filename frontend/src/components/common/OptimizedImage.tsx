import React, { useRef, useEffect, useState } from 'react';
import { 
  getOptimizedImageUrl, 
  generateSrcSet, 
  generateSizes, 
  lazyLoadImage,
  getBestSupportedFormat
} from '../../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
  placeholder?: string;
  widths?: number[];
  sizes?: Array<{ media: string; size: string }>;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component that handles responsive images, lazy loading,
 * and format optimization
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  lazy = true,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  widths = [320, 640, 960, 1280, 1920],
  sizes = [
    { media: '(max-width: 640px)', size: '100vw' },
    { media: '(max-width: 1024px)', size: '50vw' },
    { media: '(min-width: 1025px)', size: '33vw' },
  ],
  onLoad,
  onError,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [bestFormat] = useState<'avif' | 'webp' | 'jpeg'>(getBestSupportedFormat());
  
  // Generate optimized image URLs
  const optimizedSrc = width 
    ? getOptimizedImageUrl(src, width, height, bestFormat)
    : src;
  
  const srcSet = generateSrcSet(src, widths, bestFormat);
  const sizesAttr = generateSizes(sizes);
  
  useEffect(() => {
    if (lazy && imageRef.current) {
      lazyLoadImage(imageRef, optimizedSrc, srcSet, sizesAttr);
    }
  }, [lazy, optimizedSrc, srcSet, sizesAttr]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleError = () => {
    setIsError(true);
    if (onError) onError();
  };
  
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: width && height ? `${width}/${height}` : 'auto' }}>
      {/* Placeholder shown while image is loading */}
      {!isLoaded && !isError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      <img
        ref={imageRef}
        src={lazy ? placeholder : optimizedSrc}
        srcSet={lazy ? undefined : srcSet}
        sizes={lazy ? undefined : sizesAttr}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
      />
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
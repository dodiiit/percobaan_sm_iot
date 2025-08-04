import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  loadingClassName?: string;
  errorClassName?: string;
  placeholderSrc?: string;
  srcSet?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component that loads images only when they enter the viewport
 * 
 * Features:
 * - Lazy loading using IntersectionObserver
 * - Placeholder image while loading
 * - Error handling with fallback
 * - Support for responsive images with srcSet and sizes
 * - Loading and error states with customizable classes
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderClassName = '',
  loadingClassName = 'opacity-50',
  errorClassName = 'opacity-50 grayscale',
  placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23cccccc"%3E%3C/rect%3E%3C/svg%3E',
  srcSet,
  sizes,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setIsError(false);
    
    // Skip if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading when image is 200px from viewport
        threshold: 0.01,
      }
    );
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, [src]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    if (onLoad) onLoad();
  };
  
  const handleError = () => {
    setIsError(true);
    setIsLoaded(true);
    if (onError) onError();
  };
  
  // Determine which classes to apply
  const imageClasses = `${className} ${!isLoaded ? loadingClassName : ''} ${isError ? errorClassName : ''}`;
  
  return (
    <>
      {/* Placeholder shown until image is loaded */}
      {!isLoaded && (
        <img
          src={placeholderSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${placeholderClassName}`}
          style={{ position: 'absolute' }}
        />
      )}
      
      {/* Actual image */}
      <img
        ref={imageRef}
        src={shouldLoad ? src : placeholderSrc}
        srcSet={shouldLoad ? srcSet : undefined}
        sizes={shouldLoad ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        className={imageClasses}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy" // Native lazy loading as fallback
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
      />
    </>
  );
};

export default LazyImage;
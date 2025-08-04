import React, { useState, useEffect } from 'react';
import { getOptimizedImageProps, OptimizedImageProps } from '../../utils/imageOptimizer';

interface OptimizedImageComponentProps extends OptimizedImageProps {
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageComponentProps> = (props) => {
  const {
    src,
    alt,
    width,
    height,
    className,
    placeholderColor = '#f0f0f0',
    onLoad,
    onError,
    loading = 'lazy',
    decoding = 'async',
    fetchPriority = 'auto',
    ...rest
  } = props;

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Get optimized image props
  const optimizedProps = getOptimizedImageProps({
    src,
    alt,
    width,
    height,
    className,
    loading,
    decoding,
    fetchPriority,
  });

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  // Placeholder style
  const placeholderStyle = {
    backgroundColor: placeholderColor,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    display: isLoaded ? 'none' : 'block',
  };

  // Image style
  const imageStyle = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
  };

  // If there's an error, show a fallback
  if (error) {
    return (
      <div
        className={`image-error-fallback ${className || ''}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '200px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px',
        }}
      >
        {alt || 'Image failed to load'}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Placeholder */}
      {!isLoaded && <div style={placeholderStyle} aria-hidden="true" />}
      
      {/* Actual image */}
      <img
        {...optimizedProps}
        {...rest}
        style={imageStyle}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default OptimizedImage;
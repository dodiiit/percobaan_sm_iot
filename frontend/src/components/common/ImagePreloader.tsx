import React, { useEffect } from 'react';
import { preloadCriticalImages } from '../../utils/imageOptimization';

interface ImagePreloaderProps {
  images: string[];
}

/**
 * Component that preloads critical images for better performance
 * This component doesn't render anything visible
 */
const ImagePreloader: React.FC<ImagePreloaderProps> = ({ images }) => {
  useEffect(() => {
    if (images && images.length > 0) {
      preloadCriticalImages(images);
    }
  }, [images]);

  return null;
};

export default ImagePreloader;
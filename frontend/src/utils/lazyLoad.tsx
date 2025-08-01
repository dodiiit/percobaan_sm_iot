import React, { lazy, Suspense } from 'react';

// Loading component to show while lazy loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Utility function to lazy load components with a loading fallback
 * @param importFunc - Dynamic import function
 * @param fallback - Optional custom fallback component
 * @returns Lazy loaded component with suspense
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <LoadingFallback />
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>): JSX.Element => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

export default lazyLoad;
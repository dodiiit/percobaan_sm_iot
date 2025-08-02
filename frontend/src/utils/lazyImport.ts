import React from 'react';
import { performance } from './performance';

/**
 * Enhanced lazy loading utility that adds performance tracking
 * 
 * This function wraps React.lazy with performance tracking to measure
 * how long it takes to load each component.
 * 
 * @param factory A function that returns a promise that resolves to a module with a default export containing a React component
 * @param componentName The name of the component for tracking purposes
 * @returns A React component that renders the loaded component when it's ready
 */
export function lazyImport<
  T extends React.ComponentType<any>,
  I extends { [K2 in K]: T },
  K extends keyof I
>(factory: () => Promise<I>, componentName: string, key: K): I {
  const markName = `lazy_load_${componentName}`;
  
  return Object.create({
    [key]: React.lazy(() => {
      // Mark the start of the lazy load
      performance.mark(`${markName}_start`);
      
      return factory().then((module) => {
        // Mark the end of the lazy load
        performance.mark(`${markName}_end`);
        performance.measure(
          `Lazy load: ${componentName}`,
          `${markName}_start`,
          `${markName}_end`
        );
        
        return { default: module[key] };
      });
    }),
  }) as I;
}

/**
 * Enhanced lazy loading utility for default exports
 * 
 * This function wraps React.lazy with performance tracking to measure
 * how long it takes to load each component.
 * 
 * @param factory A function that returns a promise that resolves to a module with a default export containing a React component
 * @param componentName The name of the component for tracking purposes
 * @returns A React component that renders the loaded component when it's ready
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName: string
): React.LazyExoticComponent<T> {
  const markName = `lazy_load_${componentName}`;
  
  return React.lazy(() => {
    // Mark the start of the lazy load
    performance.mark(`${markName}_start`);
    
    return factory().then((module) => {
      // Mark the end of the lazy load
      performance.mark(`${markName}_end`);
      performance.measure(
        `Lazy load: ${componentName}`,
        `${markName}_start`,
        `${markName}_end`
      );
      
      return module;
    });
  });
}

/**
 * Example usage:
 * 
 * // For default exports:
 * const Dashboard = lazyLoad(() => import('./pages/Dashboard'), 'Dashboard');
 * 
 * // For named exports:
 * const { UserProfile } = lazyImport(() => import('./components/UserProfile'), 'UserProfile', 'UserProfile');
 */
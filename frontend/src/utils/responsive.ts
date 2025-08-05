import { useEffect, useState } from 'react';

// Breakpoints matching Tailwind CSS defaults
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect current breakpoint
 * @returns Current breakpoint (xs, sm, md, lg, xl, 2xl)
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<string>('xs');
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const handleResize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (windowSize.width === 0) return;

    if (windowSize.width >= breakpoints['2xl']) {
      setBreakpoint('2xl');
    } else if (windowSize.width >= breakpoints.xl) {
      setBreakpoint('xl');
    } else if (windowSize.width >= breakpoints.lg) {
      setBreakpoint('lg');
    } else if (windowSize.width >= breakpoints.md) {
      setBreakpoint('md');
    } else if (windowSize.width >= breakpoints.sm) {
      setBreakpoint('sm');
    } else {
      setBreakpoint('xs');
    }
  }, [windowSize.width]);

  return breakpoint;
};

/**
 * Hook to check if the current breakpoint matches or is larger than the given breakpoint
 * @param breakpoint Breakpoint to check against
 * @returns Boolean indicating if current width is at least the given breakpoint
 */
export const useBreakpointUp = (breakpoint: Breakpoint) => {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  return breakpointOrder.indexOf(currentBreakpoint) >= breakpointOrder.indexOf(breakpoint);
};

/**
 * Hook to check if the current breakpoint matches or is smaller than the given breakpoint
 * @param breakpoint Breakpoint to check against
 * @returns Boolean indicating if current width is at most the given breakpoint
 */
export const useBreakpointDown = (breakpoint: Breakpoint) => {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  return breakpointOrder.indexOf(currentBreakpoint) <= breakpointOrder.indexOf(breakpoint);
};

/**
 * Hook to detect if the device is likely a mobile device
 * @returns Boolean indicating if the device is likely a mobile device
 */
export const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(userAgent));
  }, []);

  return isMobile;
};

/**
 * Hook to detect device orientation
 * @returns Current orientation ('portrait' or 'landscape')
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
};
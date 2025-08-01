import { useState, useEffect } from 'react';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<BreakpointKey, number> = {
  'xs': 0,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [breakpoint, setBreakpoint] = useState<BreakpointKey>('xs');

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Update current breakpoint
      if (window.innerWidth >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (window.innerWidth >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (window.innerWidth >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (window.innerWidth >= breakpoints.md) {
        setBreakpoint('md');
      } else if (window.innerWidth >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  const isXs = windowSize.width < breakpoints.sm;
  const isSm = windowSize.width >= breakpoints.sm && windowSize.width < breakpoints.md;
  const isMd = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isLg = windowSize.width >= breakpoints.lg && windowSize.width < breakpoints.xl;
  const isXl = windowSize.width >= breakpoints.xl && windowSize.width < breakpoints['2xl'];
  const is2Xl = windowSize.width >= breakpoints['2xl'];

  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl || is2Xl;

  const down = (key: BreakpointKey) => windowSize.width < breakpoints[key];
  const up = (key: BreakpointKey) => windowSize.width >= breakpoints[key];
  const between = (start: BreakpointKey, end: BreakpointKey) => 
    windowSize.width >= breakpoints[start] && windowSize.width < breakpoints[end];
  const only = (key: BreakpointKey) => {
    const keys = Object.keys(breakpoints) as BreakpointKey[];
    const index = keys.indexOf(key);
    const nextKey = keys[index + 1];
    
    return nextKey 
      ? between(key, nextKey) 
      : up(key);
  };

  return {
    windowSize,
    breakpoint,
    breakpoints,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    down,
    up,
    between,
    only
  };
}
import React from 'react';

// Create a simple motion component that just renders its children as a fallback
const createFallbackMotion = () => {
  return new Proxy({}, {
    get: function(target, prop) {
      return React.forwardRef((props: any, ref) => {
        const { children, ...rest } = props;
        return React.createElement(prop.toString(), { ...rest, ref }, children);
      });
    }
  });
};

// Create a simple AnimatePresence component that just renders its children as a fallback
const FallbackAnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Try to import framer-motion, but use fallbacks if it fails
let motion: any;
let AnimatePresence: any;

try {
  // Try to dynamically import framer-motion
  const framerMotion = require('framer-motion');
  motion = framerMotion.motion;
  AnimatePresence = framerMotion.AnimatePresence;
} catch (error) {
  // If import fails, use fallbacks
  console.warn('Framer Motion not available, using fallbacks');
  motion = createFallbackMotion();
  AnimatePresence = FallbackAnimatePresence;
}

export { motion, AnimatePresence };
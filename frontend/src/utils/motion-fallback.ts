// This file provides fallback components and utilities when framer-motion is not available
import React from 'react';

// Create a simple motion component that just renders its children
export const motion = new Proxy({}, {
  get: function(target, prop) {
    return React.forwardRef((props: any, ref) => {
      const { children, ...rest } = props;
      return React.createElement(prop.toString(), { ...rest, ref }, children);
    });
  }
});

// Create a simple AnimatePresence component that just renders its children
export const AnimatePresence = (props: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, props.children);
};

// Create empty variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const staggerContainer = {
  hidden: {},
  visible: {}
};
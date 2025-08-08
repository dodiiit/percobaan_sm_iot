// Define a type for variants that matches framer-motion's Variants
type Variants = {
  [key: string]: {
    [key: string]: any;
  };
};

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

// Fade in up animation
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

// Fade in down animation
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

// Fade in left animation
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5 }
  }
};

// Fade in right animation
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5 }
  }
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
};

// Stagger children animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Pulse animation
export const pulse: Variants = {
  hidden: { scale: 1 },
  visible: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop'
    }
  }
};

// Bounce animation
export const bounce: Variants = {
  hidden: { y: 0 },
  visible: {
    y: [0, -10, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: 'loop'
    }
  }
};

// Rotate animation
export const rotate: Variants = {
  hidden: { rotate: 0 },
  visible: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Page transition animations
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

// Card hover animations
export const cardHover = {
  rest: { 
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

// Button hover animations
export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};
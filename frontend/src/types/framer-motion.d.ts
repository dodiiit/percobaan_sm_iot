declare module 'framer-motion' {
  import * as React from 'react';

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    custom?: any;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
  }

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    whileInView?: any;
    custom?: any;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onUpdate?: () => void;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export interface Variants {
    [key: string]: {
      [key: string]: any;
    };
  }

  export const motion: {
    [key: string]: React.ForwardRefExoticComponent<
      MotionProps & React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>
    >;
  };

  export const AnimatePresence: React.FC<AnimatePresenceProps>;
}
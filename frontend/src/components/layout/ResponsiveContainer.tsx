import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

const maxWidthClasses = {
  'xs': 'max-w-xs',
  'sm': 'max-w-sm',
  'md': 'max-w-md',
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  'full': 'max-w-full'
};

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  maxWidth = 'full',
  padding = true
}) => {
  const { isMobile } = useResponsive();
  
  const paddingClasses = padding 
    ? isMobile 
      ? 'px-4 py-3' 
      : 'px-6 py-4'
    : '';
  
  return (
    <Component 
      className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses} ${className}`}
    >
      {children}
    </Component>
  );
};

export default ResponsiveContainer;
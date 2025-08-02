import React from 'react';

interface ChipProps {
  label: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default';
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  sx?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

/**
 * Custom Chip component that mimics Material UI's Chip
 */
const Chip: React.FC<ChipProps> = ({
  label,
  color = 'default',
  variant = 'filled',
  size = 'medium',
  sx,
  className = '',
  onClick,
}) => {
  // Base classes
  let baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  // Size classes
  if (size === 'small') {
    baseClasses += ' px-2 py-0.5 text-xs';
  } else {
    baseClasses += ' px-3 py-1 text-sm';
  }
  
  // Color and variant classes
  let colorClasses = '';
  
  if (variant === 'outlined') {
    baseClasses += ' border';
    
    switch (color) {
      case 'primary':
        colorClasses = 'border-blue-500 text-blue-500';
        break;
      case 'secondary':
        colorClasses = 'border-purple-500 text-purple-500';
        break;
      case 'success':
        colorClasses = 'border-green-500 text-green-500';
        break;
      case 'error':
        colorClasses = 'border-red-500 text-red-500';
        break;
      case 'warning':
        colorClasses = 'border-yellow-500 text-yellow-500';
        break;
      case 'info':
        colorClasses = 'border-sky-500 text-sky-500';
        break;
      default:
        colorClasses = 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300';
    }
  } else {
    switch (color) {
      case 'primary':
        colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        break;
      case 'secondary':
        colorClasses = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        break;
      case 'success':
        colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        break;
      case 'error':
        colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        break;
      case 'warning':
        colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        break;
      case 'info':
        colorClasses = 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
        break;
      default:
        colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
  
  // Clickable
  if (onClick) {
    baseClasses += ' cursor-pointer hover:opacity-80';
  }
  
  return (
    <span 
      className={`${baseClasses} ${colorClasses} ${className}`}
      style={sx}
      onClick={onClick}
    >
      {label}
    </span>
  );
};

export default Chip;
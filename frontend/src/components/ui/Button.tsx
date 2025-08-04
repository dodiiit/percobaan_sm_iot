import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const fullWidthClasses = fullWidth ? 'w-full' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && disabledClasses,
    fullWidthClasses,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      );
    }
    return icon;
  };

  const renderContent = () => {
    const iconElement = renderIcon();
    
    if (!iconElement) {
      return children;
    }

    if (iconPosition === 'right') {
      return (
        <>
          {children}
          <span className="ml-2">{iconElement}</span>
        </>
      );
    }

    return (
      <>
        <span className="mr-2">{iconElement}</span>
        {children}
      </>
    );
  };

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
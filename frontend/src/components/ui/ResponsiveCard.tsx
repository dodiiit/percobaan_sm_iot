import React from 'react';

interface ResponsiveCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  footer,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0 mr-3">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ResponsiveCard;
import React from 'react';
import Breadcrumb from '../navigation/Breadcrumb';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showBreadcrumb?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbItems,
  actions,
  showBreadcrumb = true
}) => {
  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      {showBreadcrumb && <Breadcrumb items={breadcrumbItems} />}
      
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
import React from 'react';
import ResponsiveCard from './ResponsiveCard';

interface DataItem<T> {
  label: string;
  value: keyof T | ((item: T) => React.ReactNode);
  icon?: React.ReactNode;
}

interface MobileDataListProps<T> {
  data: T[];
  items: DataItem<T>[];
  keyExtractor: (item: T) => string;
  title: string | ((item: T) => string);
  subtitle?: string | ((item: T) => string);
  icon?: React.ReactNode | ((item: T) => React.ReactNode);
  onItemClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  renderFooter?: (item: T) => React.ReactNode;
}

function MobileDataList<T>({
  data,
  items,
  keyExtractor,
  title,
  subtitle,
  icon,
  onItemClick,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
  renderFooter
}: MobileDataListProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {data.map((item) => {
        const itemTitle = typeof title === 'function' ? title(item) : title;
        const itemSubtitle = subtitle ? (typeof subtitle === 'function' ? subtitle(item) : subtitle) : undefined;
        const itemIcon = icon ? (typeof icon === 'function' ? icon(item) : icon) : undefined;
        
        return (
          <ResponsiveCard
            key={keyExtractor(item)}
            title={itemTitle}
            subtitle={itemSubtitle}
            icon={itemIcon}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
            footer={renderFooter ? renderFooter(item) : undefined}
          >
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              {items.map((dataItem, index) => {
                const value = typeof dataItem.value === 'function'
                  ? dataItem.value(item)
                  : item[dataItem.value];
                
                return (
                  <div key={index} className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      {dataItem.icon && <span className="mr-1">{dataItem.icon}</span>}
                      {dataItem.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {value as React.ReactNode}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </ResponsiveCard>
        );
      })}
    </div>
  );
}

export default MobileDataList;
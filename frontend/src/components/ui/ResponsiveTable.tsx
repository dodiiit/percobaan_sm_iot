import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  mobileRender?: boolean;
  tabletRender?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
}

function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  className = '',
  emptyMessage = 'No data available',
  loading = false,
  onRowClick
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useResponsive();

  // Filter columns based on device
  const visibleColumns = columns.filter(column => {
    if (isMobile && column.mobileRender === false) return false;
    if (isTablet && column.tabletRender === false) return false;
    return true;
  });

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
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {visibleColumns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr 
              key={keyExtractor(item)} 
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {visibleColumns.map((column, index) => {
                const value = typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : item[column.accessor];
                
                return (
                  <td
                    key={index}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${column.className || ''}`}
                  >
                    {value as React.ReactNode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResponsiveTable;
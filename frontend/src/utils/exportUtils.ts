/**
 * Utility functions for exporting data
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (keys and display names)
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string => {
  if (!data || !data.length) {
    return '';
  }

  // If headers are not provided, use the keys from the first object
  const headerKeys = headers ? headers.map(h => h.key) : Object.keys(data[0]) as (keyof T)[];
  const headerLabels = headers ? headers.map(h => h.label) : headerKeys as string[];

  // Create the header row
  const headerRow = headerLabels.map(label => `"${label}"`).join(',');

  // Create the data rows
  const rows = data.map(item => {
    return headerKeys
      .map(key => {
        const value = item[key];
        
        // Handle different types of values
        if (value === null || value === undefined) {
          return '""';
        } else if (typeof value === 'string') {
          // Escape quotes in strings
          return `"${value.replace(/"/g, '""')}"`;
        } else if (typeof value === 'object') {
          // For objects (including Date), convert to string
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return `"${value}"`;
        }
      })
      .join(',');
  });

  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Download data as a CSV file
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export const downloadCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format a date for export
 * @param date Date to format
 * @param format Format to use (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export const formatDateForExport = (
  date: Date | string,
  format: string = 'YYYY-MM-DD'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Generate a filename with timestamp
 * @param baseName Base name for the file
 * @param extension File extension (default: 'csv')
 * @returns Filename with timestamp
 */
export const generateFilename = (
  baseName: string,
  extension: string = 'csv'
): string => {
  const timestamp = formatDateForExport(new Date(), 'YYYY-MM-DD_HH-mm-ss');
  return `${baseName}_${timestamp}.${extension}`;
};
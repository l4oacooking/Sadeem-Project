import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Exports data to a CSV file and triggers a download
 * @param data Array of objects to export
 * @param filename The name of the file to download (without extension)
 * @param headers Optional custom headers (otherwise will use object keys)
 */
export function exportToCSV(data: Record<string, any>[], filename: string, headers?: string[]) {
  if (!data || !data.length) {
    return;
  }

  // Determine headers from the data if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [];
  
  // Add the headers
  csvRows.push(csvHeaders.join(','));
  
  // Add the data rows
  for (const row of data) {
    const values = csvHeaders.map(header => {
      const value = header.includes('.') 
        ? header.split('.').reduce((obj, key) => obj && obj[key], row)
        : row[header];
      
      // Handle different data types and escape commas and quotes
      const cell = value === null || value === undefined ? '' : String(value);
      return `"${cell.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Combine into CSV content
  const csvContent = csvRows.join('\n');
  
  // Create a Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

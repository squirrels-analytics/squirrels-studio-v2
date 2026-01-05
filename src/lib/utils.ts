import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function joinUrl(baseUrl: string, path: string): string {
  return baseUrl.replace(/\/$/, '') + path;
}

/**
 * Utility to download data as a CSV file
 */
export function downloadCsv(data: any[][], filename: string, headers: string[]) {
  if (data.length === 0) return;

  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      row.map(value => {
        const escaped = ('' + (value ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from '@/lib/utils';

interface ExportCsvButtonProps {
  filenamePrefix: string;
  columns: Array<{ name: string }>;
  currentRows: unknown[][];
  pageSize: number;
  currentPage: number;
  onFetchAll: () => Promise<unknown[][]>;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const ExportCsvButton: React.FC<ExportCsvButtonProps> = ({
  filenamePrefix,
  columns,
  currentRows,
  pageSize,
  currentPage,
  onFetchAll,
  onLoadingChange,
  onError,
  className
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCurrentRows = () => {
    const startRow = (currentPage - 1) * pageSize + 1;
    const endRow = (currentPage - 1) * pageSize + currentRows.length;
    const csvName = `${filenamePrefix}-rows-${startRow}-to-${endRow}.csv`;
    downloadCsv(currentRows, csvName, columns.map(c => c.name));
  };

  const handleExportAllRows = async () => {
    setIsExporting(true);
    onLoadingChange?.(true);
    try {
      const allRows = await onFetchAll();
      const csvName = `${filenamePrefix}-all.csv`;
      downloadCsv(allRows, csvName, columns.map(c => c.name));
    } catch (err) {
      console.error('Failed to export all rows:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while exporting data';
      onError?.(message);
    } finally {
      setIsExporting(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm" 
          className={`gap-2 h-8 ${className}`}
          disabled={isExporting}
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Export CSV
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCurrentRows}>
          Export current rows
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportAllRows}>
          Export all rows
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

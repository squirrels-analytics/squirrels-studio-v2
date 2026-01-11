import { type FC } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './ui/button';

interface PaginationContainerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRows: number;
  showingRows: number;
  isLoading?: boolean;
}

export const PaginationContainer: FC<PaginationContainerProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRows,
  showingRows,
  isLoading = false,
}) => {
  return (
    <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Showing {showingRows} of {totalRows} rows
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="px-3 h-8 flex items-center bg-muted rounded font-bold text-foreground min-w-[100px] justify-center">
          Page {currentPage} of {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0 || isLoading}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0 || isLoading}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

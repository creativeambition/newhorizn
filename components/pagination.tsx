import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  showItemCount?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  showItemCount = true,
}: PaginationProps) {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);
  const itemsOnCurrentPage = endItem - startItem + 1;

  if (totalItems < 1) {
    return;
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row items-center justify-between w-full">
      {showItemCount && (
        <div className="text-xs text-muted-foreground">
          {totalItems} Total - Showing {itemsOnCurrentPage} items ( {startItem}{" "}
          - {endItem} )
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft />
        </Button>

        {totalPages > 7 ? (
          <div className="flex items-center gap-1">
            {[...Array(Math.min(3, totalPages))].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i ? "default" : "outline-solid"}
                size="sm"
                onClick={() => onPageChange(i)}
              >
                {i + 1}
              </Button>
            ))}
            {currentPage > 3 && <span className="mx-1">...</span>}
            {currentPage > 2 && currentPage < totalPages - 3 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPageChange(currentPage)}
              >
                {currentPage + 1}
              </Button>
            )}
            {currentPage < totalPages - 4 && <span className="mx-1">...</span>}
            {[...Array(Math.min(3, totalPages))].map((_, i) => (
              <Button
                key={totalPages - 3 + i}
                variant={
                  currentPage === totalPages - 3 + i ? "default" : "outline-solid"
                }
                size="sm"
                onClick={() => onPageChange(totalPages - 3 + i)}
              >
                {totalPages - 2 + i}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i ? "default" : "outline-solid"}
                size="sm"
                onClick={() => onPageChange(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

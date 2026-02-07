'use client';

import { useEffect, useState } from 'react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  storageKey?: string;
  themeColor?: string;
  itemsPerPageOptions?: number[];
}

const DEFAULT_ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

/**
 * Reusable Pagination component with page numbers, navigation, and items per page selector.
 *
 * Features:
 * - Previous/Next arrow buttons
 * - Clickable page numbers with ellipsis for large page counts
 * - "Per page" dropdown selector with localStorage persistence
 * - "Showing X-Y of Z" count display
 * - Mobile-friendly "Page X / Y" simplified view
 */
export default function Pagination({
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  storageKey = 'pagination_items_per_page',
  themeColor = '#0050A0',
  itemsPerPageOptions = DEFAULT_ITEMS_PER_PAGE_OPTIONS,
}: PaginationProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load items per page from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (itemsPerPageOptions.includes(parsed) && parsed !== itemsPerPage) {
        onItemsPerPageChange(parsed);
      }
    }
  }, [storageKey]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Handle items per page change with localStorage persistence
  const handleItemsPerPageChange = (count: number) => {
    localStorage.setItem(storageKey, count.toString());
    onItemsPerPageChange(count);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Showing X-Y of Z count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{' '}
        <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
        <span className="font-medium text-gray-900">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-4">
        {/* Per page selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="items-per-page" className="text-sm text-gray-600 whitespace-nowrap">
            Per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value, 10))}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0050A0]/50 focus:border-[#0050A0] cursor-pointer"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Page navigation */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
            }`}
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile: Page X / Y */}
          {isMobile ? (
            <span className="px-3 py-1 text-sm text-gray-600">
              Page <span className="font-medium">{currentPage}</span> / {totalPages}
            </span>
          ) : (
            /* Desktop: Page numbers */
            <div className="flex items-center gap-1">
              {pageNumbers.map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`min-w-[36px] h-9 px-3 py-1 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:border-[#0050A0] hover:text-[#0050A0]'
                    }`}
                    style={isActive ? { backgroundColor: themeColor } : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
            }`}
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}

/**
 * Hook for pagination state management
 * Returns pagination state and handlers, plus the paginated data slice
 */
export function usePagination<T>(
  data: T[],
  storageKey?: string,
  defaultItemsPerPage: number = 25
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Reset to page 1 when data changes (e.g., from filter/search)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange,
    storageKey,
  };
}

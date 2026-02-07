'use client';

import React, { useState, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import { getContrastTextColor } from '@/utils/colorHelpers';

/**
 * Column definition for DataTable
 */
export interface Column<T> {
  /** Unique key matching the data property */
  key: keyof T | string;
  /** Display header text */
  header: string;
  /** Whether this column is sortable (default: true for non-link columns) */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Column width class (e.g., 'w-20', 'min-w-[200px]') */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether to hide on mobile */
  hideOnMobile?: boolean;
  /** Whether to hide on tablet */
  hideOnTablet?: boolean;
}

/**
 * Link configuration for clickable cells
 */
export interface LinkConfig {
  /** Column key that should be linked */
  column: string;
  /** Function to generate href from row data */
  getHref: (row: unknown) => string;
  /** Whether link opens in new tab */
  external?: boolean;
  /** Use team color for link */
  useTeamColor?: boolean;
}

/**
 * DataTable Props
 */
interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Team primary color for header background */
  teamColor?: string;
  /** Enable sorting functionality */
  sortable?: boolean;
  /** Default sort column key */
  defaultSortKey?: string;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Link configuration for clickable cells */
  links?: LinkConfig[];
  /** Show sort animation on sort change */
  animated?: boolean;
  /** Custom class for table container */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Unique key for each row (defaults to index) */
  rowKey?: keyof T | ((row: T, index: number) => string | number);
  /** Minimum table width */
  minWidth?: string;
}

/**
 * Shared DataTable component for consistent table rendering across the app
 *
 * Features:
 * - Sortable columns with visual indicators
 * - Team-colored headers with WCAG-compliant contrast
 * - Automatic alternating row colors
 * - Link support for player/team names
 * - Sort animation on column changes
 * - Responsive column hiding
 *
 * Usage:
 * ```tsx
 * <DataTable
 *   data={players}
 *   columns={[
 *     { key: 'name', header: 'PLAYER', width: 'min-w-[200px]' },
 *     { key: 'position', header: 'POS', width: 'w-16', align: 'center' },
 *     { key: 'age', header: 'AGE', sortable: true, align: 'center' },
 *   ]}
 *   teamColor={team.primaryColor}
 *   links={[{ column: 'name', getHref: (row) => `/players/${row.slug}` }]}
 *   sortable
 * />
 * ```
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  teamColor = '#0050A0',
  sortable = false,
  defaultSortKey,
  defaultSortDirection = 'desc',
  links = [],
  animated = true,
  className = '',
  emptyMessage = 'No data available',
  rowKey,
  minWidth,
}: DataTableProps<T>): React.ReactElement {
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  // Handle sort column click
  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    const column = columns.find((c) => c.key === columnKey);
    if (column?.sortable === false) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortable) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn as keyof T];
      let bValue = b[sortColumn as keyof T];

      // Handle numeric strings
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue) as unknown as T[keyof T];
      }
      if (typeof bValue === 'string' && !isNaN(parseFloat(bValue))) {
        bValue = parseFloat(bValue) as unknown as T[keyof T];
      }

      // Handle percentage strings
      if (typeof aValue === 'string' && aValue.includes('%')) {
        aValue = parseFloat(aValue.replace('%', '')) as unknown as T[keyof T];
      }
      if (typeof bValue === 'string' && bValue.includes('%')) {
        bValue = parseFloat(bValue.replace('%', '')) as unknown as T[keyof T];
      }

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection, sortable]);

  // Get sort icon for column header
  const getSortIcon = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey);
    if (!sortable || column?.sortable === false) return null;

    if (sortColumn !== columnKey) {
      return (
        <svg className="w-3 h-3 inline ml-1 opacity-50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 10l4-4 4 4H8zm0 4l4 4 4-4H8z" />
        </svg>
      );
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 14l4-4 4 4H8z" />
        </svg>
      );
    }

    return (
      <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 10l4 4 4-4H8z" />
      </svg>
    );
  };

  // Get row key
  const getRowKey = (row: T, index: number): string | number => {
    if (!rowKey) return index;
    if (typeof rowKey === 'function') return rowKey(row, index);
    return String(row[rowKey]) || index;
  };

  // Render cell content
  const renderCell = (column: Column<T>, row: T, index: number): ReactNode => {
    const value = row[column.key as keyof T];
    const linkConfig = links.find((l) => l.column === column.key);

    // Custom render function takes precedence
    if (column.render) {
      return column.render(value, row, index);
    }

    // Link rendering
    if (linkConfig && value) {
      const href = linkConfig.getHref(row);
      const linkStyle = linkConfig.useTeamColor ? { color: teamColor } : {};
      const linkClass = `font-medium hover:underline cursor-pointer ${
        linkConfig.useTeamColor ? '' : 'text-blue-600'
      }`;

      if (linkConfig.external) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            style={linkStyle}
          >
            {String(value)}
          </a>
        );
      }

      return (
        <Link href={href} className={linkClass} style={linkStyle}>
          {String(value)}
        </Link>
      );
    }

    // Default: display value or dash for empty
    return value !== undefined && value !== null && value !== '' ? String(value) : '-';
  };

  // Get alignment class
  const getAlignClass = (align?: 'left' | 'center' | 'right'): string => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  // Get responsive visibility class
  const getVisibilityClass = (column: Column<T>): string => {
    const classes: string[] = [];
    if (column.hideOnMobile) classes.push('hidden sm:table-cell');
    if (column.hideOnTablet) classes.push('hidden md:table-cell');
    return classes.join(' ');
  };

  const textColor = getContrastTextColor(teamColor);
  const tableClass = animated && sortColumn ? 'sort-animation' : '';
  const tableKey = `${sortColumn}-${sortDirection}`;

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-600 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className={`w-full text-sm ${tableClass}`}
        key={tableKey}
        style={minWidth ? { minWidth } : undefined}
      >
        <thead>
          <tr style={{ backgroundColor: teamColor, color: textColor }}>
            {columns.map((column) => {
              const isSortable = sortable && column.sortable !== false;
              const visibilityClass = getVisibilityClass(column);

              return (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`p-3 font-semibold text-xs uppercase tracking-wide whitespace-nowrap ${getAlignClass(column.align)} ${column.width || ''} ${visibilityClass} ${
                    isSortable ? 'cursor-pointer hover:opacity-90 active:opacity-75 transition-opacity' : ''
                  }`}
                  onClick={isSortable ? () => handleSort(String(column.key)) : undefined}
                >
                  <span className="flex items-center justify-start">
                    {column.header}
                    {getSortIcon(String(column.key))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {columns.map((column) => {
                const visibilityClass = getVisibilityClass(column);

                return (
                  <td
                    key={String(column.key)}
                    className={`p-3 whitespace-nowrap ${getAlignClass(column.align)} ${column.width || ''} ${visibilityClass}`}
                  >
                    {renderCell(column, row, index)}
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

export default DataTable;

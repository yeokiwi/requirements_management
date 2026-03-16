import React, { useCallback, useMemo } from 'react';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

export interface Column<T> {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  rowHeight?: number;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
}

function DataTableInner<T extends Record<string, any>>(
  {
    columns,
    data,
    rowKey,
    selectedIds = [],
    onSelectionChange,
    onRowClick,
    onSort,
    sortField,
    sortDirection,
    rowHeight = 44,
    emptyMessage = 'No data available',
    rowClassName,
  }: DataTableProps<T>,
) {
  const { containerRef, virtualItems, totalHeight } = useVirtualScroll({
    itemCount: data.length,
    itemHeight: rowHeight,
    overscan: 10,
  });

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allSelected = useMemo(
    () => data.length > 0 && data.every((row) => selectedSet.has(String(row[rowKey]))),
    [data, selectedSet, rowKey],
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((row) => String(row[rowKey])));
    }
  }, [allSelected, data, rowKey, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      if (selectedSet.has(id)) {
        onSelectionChange(selectedIds.filter((sid) => sid !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    },
    [selectedIds, selectedSet, onSelectionChange],
  );

  const handleSort = useCallback(
    (key: string) => {
      if (!onSort) return;
      const newDirection: 'asc' | 'desc' =
        sortField === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, newDirection);
    },
    [onSort, sortField, sortDirection],
  );

  const getSortIndicator = (key: string) => {
    if (sortField !== key) return ' \u2195';
    return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center shrink-0"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          height: rowHeight,
        }}
      >
        {onSelectionChange && (
          <div className="flex items-center justify-center shrink-0" style={{ width: 48 }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer"
            />
          </div>
        )}
        {columns.map((col) => (
          <div
            key={col.key}
            className={`px-3 text-xs font-semibold uppercase tracking-wider truncate ${
              col.sortable ? 'cursor-pointer select-none hover:opacity-80' : ''
            }`}
            style={{
              color: 'var(--color-text-secondary)',
              width: col.width ?? undefined,
              flex: col.width ? `0 0 ${col.width}px` : '1 1 0',
            }}
            onClick={() => col.sortable && handleSort(col.key)}
          >
            {col.title}
            {col.sortable && getSortIndicator(col.key)}
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      {data.length === 0 ? (
        <div
          className="flex items-center justify-center py-12 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="overflow-auto flex-1"
          style={{ minHeight: 200, maxHeight: 600 }}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            {virtualItems.map(({ index, offsetTop }) => {
              const row = data[index];
              const id = String(row[rowKey]);
              const isSelected = selectedSet.has(id);
              const isEven = index % 2 === 0;
              const extraClass = rowClassName ? rowClassName(row) : '';

              return (
                <div
                  key={id}
                  className={`flex items-center absolute w-full transition-colors duration-75 hover:brightness-110 cursor-pointer ${extraClass}`}
                  style={{
                    top: offsetTop,
                    height: rowHeight,
                    backgroundColor: isSelected
                      ? 'var(--color-accent)'
                      : isEven
                        ? 'var(--color-surface)'
                        : 'var(--color-bg)',
                    color: isSelected ? '#fff' : 'var(--color-text)',
                  }}
                  onClick={() => {
                    if (onRowClick) onRowClick(row);
                  }}
                >
                  {onSelectionChange && (
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 48 }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer"
                      />
                    </div>
                  )}
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <div
                        key={col.key}
                        className="px-3 text-sm truncate"
                        style={{
                          width: col.width ?? undefined,
                          flex: col.width ? `0 0 ${col.width}px` : '1 1 0',
                        }}
                      >
                        {col.render ? col.render(value, row) : (value ?? '')}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const DataTable = DataTableInner;
export default DataTable;

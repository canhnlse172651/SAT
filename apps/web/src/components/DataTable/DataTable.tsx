import type { KeyboardEvent, ReactNode } from 'react';
import { cx } from '../cx';
import { EmptyState } from '../EmptyState/EmptyState';
import { SortIcon } from '../icons';
import './DataTable.css';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: string;
  /** Defaults to `row[key]`. */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** Numbers are right-aligned with tabular figures. */
  align?: 'left' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  /** Accessible name of the table. */
  caption: string;
  sort?: SortState;
  /** Called with the next sort; the owner sorts (or refetches) the rows. */
  onSortChange?: (sort: SortState) => void;
  onRowClick?: (row: T) => void;
  /** Replaces the default empty state when there are no rows. */
  empty?: ReactNode;
  className?: string;
}

function ariaSort(sort: SortState | undefined, key: string): 'ascending' | 'descending' | 'none' {
  if (sort?.key !== key) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  sort,
  onSortChange,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>) {
  const nextSort = (key: string): SortState => ({
    key,
    direction: sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc',
  });

  const rowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className={cx('tbl-wrap', className)}>
      <table className="tbl">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={c.sortable ? ariaSort(sort, c.key) : undefined}
                className={cx(c.align === 'right' && 'tbl__num')}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.sortable ? (
                  <button
                    type="button"
                    className="tbl__sort"
                    onClick={() => onSortChange?.(nextSort(c.key))}
                  >
                    {c.header}
                    <SortIcon />
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="tbl__empty">
                {empty ?? <EmptyState title="Chưa có dữ liệu" />}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={cx(onRowClick && 'tbl__row--click')}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => rowKeyDown(e, row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx(c.align === 'right' && 'tbl__num')}>
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

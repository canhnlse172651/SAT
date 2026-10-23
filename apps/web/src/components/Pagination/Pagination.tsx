import { cx } from '../cx';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import './Pagination.css';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

/** Page numbers to show: first, last, and a window around the current page; `null` = ellipsis. */
function pageItems(page: number, count: number): Array<number | null> {
  const wanted = new Set([1, count, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const items: Array<number | null> = [];
  pages.forEach((p, i) => {
    const prev = pages[i - 1];
    if (prev !== undefined && p - prev > 1) items.push(null);
    items.push(p);
  });
  return items;
}

export function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const items = pageItems(page, pageCount);
  return (
    <nav aria-label="Phân trang" className={cx('pager', className)}>
      <button
        type="button"
        className="pager__btn"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeftIcon />
      </button>
      {items.map((item, i) =>
        item === null ? (
          <span key={`gap-${i}`} className="pager__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="pager__btn"
            aria-label={`Trang ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="pager__btn"
        aria-label="Trang sau"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}

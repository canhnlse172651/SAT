import { Fragment } from 'react';
import { Link } from 'react-router';

export interface Crumb {
  label: string;
  to?: string;
}

/** In-page path back to the curriculum (AC-7.1, AC-7.11): "Giáo trình › HSK1 cơ bản › Bài 1". */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="cur-crumbs" aria-label="Đường dẫn">
      {items.map((c, i) => (
        <Fragment key={`${i}-${c.label}`}>
          {i > 0 && (
            <span className="cur-crumbs__sep" aria-hidden="true">
              ›
            </span>
          )}
          {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

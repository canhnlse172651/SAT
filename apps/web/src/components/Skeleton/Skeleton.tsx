import type { CSSProperties } from 'react';
import { cx } from '../cx';
import './Skeleton.css';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  /** Renders this many text-line bars (the last one shorter). */
  lines?: number;
  circle?: boolean;
  className?: string;
}

/** Decorative placeholder: hidden from assistive tech; the owner sets `aria-busy` on the region. */
export function Skeleton({ width, height, lines, circle = false, className }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={cx('skeleton-lines', className)} aria-hidden="true" data-testid="skeleton">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className="skeleton"
            style={{ width: i === lines - 1 ? '60%' : '100%', height: height ?? 14 }}
          />
        ))}
      </div>
    );
  }
  const style: CSSProperties = { width, height: height ?? 14 };
  return (
    <span
      className={cx('skeleton', circle && 'skeleton--circle', className)}
      style={style}
      aria-hidden="true"
      data-testid="skeleton"
    />
  );
}

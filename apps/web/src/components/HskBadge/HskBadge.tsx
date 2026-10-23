import { hskLabel, hskLevelLabel, type HskBand, type HskLevel } from '@sat/shared';
import type { CSSProperties } from 'react';
import { cx } from '../cx';
import './HskBadge.css';

/** Either an HSK band (self-study, 'HSK 7–9') or a curriculum level 1–9 ('HSK7', 002). */
export type HskBadgeProps = { className?: string } & (
  { band: HskBand; level?: never } | { level: HskLevel; band?: never }
);

export function HskBadge({ band, level, className }: HskBadgeProps) {
  const colour = level ?? (band === '7-9' ? 7 : band);
  const style = { '--hc': `var(--hsk${colour})` } as CSSProperties;
  return (
    <span className={cx('hsk', className)} style={style}>
      {level !== undefined ? hskLevelLabel(level) : hskLabel(band)}
    </span>
  );
}

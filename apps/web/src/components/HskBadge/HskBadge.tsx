import { hskLabel, type HskBand } from '@sat/shared';
import type { CSSProperties } from 'react';
import { cx } from '../cx';
import './HskBadge.css';

export interface HskBadgeProps {
  band: HskBand;
  className?: string;
}

export function HskBadge({ band, className }: HskBadgeProps) {
  const style = { '--hc': `var(--hsk${band === '7-9' ? 7 : band})` } as CSSProperties;
  return (
    <span className={cx('hsk', className)} style={style}>
      {hskLabel(band)}
    </span>
  );
}

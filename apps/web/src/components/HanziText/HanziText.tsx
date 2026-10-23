import { cx } from '../cx';
import './HanziText.css';

export type HanziSize = 'md' | 'lg' | 'xl' | 'hero';

export interface HanziTextProps {
  children: string;
  /** Serif for learning content (default); `false` = sans for inputs and dense GV editors. */
  serif?: boolean;
  size?: HanziSize;
  className?: string;
}

/** Simplified Hanzi, always tagged `lang="zh-Hans"` so the right glyphs and voice are used. */
export function HanziText({ children, serif = true, size, className }: HanziTextProps) {
  return (
    <span
      lang="zh-Hans"
      className={cx('han', !serif && 'han--sans', size && `han--${size}`, className)}
    >
      {children}
    </span>
  );
}

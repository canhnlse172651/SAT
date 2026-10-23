import { numberedToToneMarks } from '@sat/shared';
import { cx } from '../cx';
import './HanziText.css';

export interface PinyinTextProps {
  /** Tone marks ("nǐ hǎo") or tone numbers ("ni3 hao3"); numbers are converted. */
  children: string;
  /** `brand` (vermilion) on vocabulary and flashcards, `muted` elsewhere (default). */
  tone?: 'brand' | 'muted';
  className?: string;
}

const HAS_TONE_NUMBER = /[a-züv:][1-5]/i;

export function PinyinText({ children, tone = 'muted', className }: PinyinTextProps) {
  const text = HAS_TONE_NUMBER.test(children) ? numberedToToneMarks(children) : children;
  return (
    <span lang="zh-Latn-pinyin" className={cx('py', tone === 'brand' && 'py--brand', className)}>
      {text}
    </span>
  );
}

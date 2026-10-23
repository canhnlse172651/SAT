import { useState } from 'react';
import { cx } from '../cx';
import './Avatar.css';

export interface AvatarProps {
  /** Full name: the accessible name and the source of the initials. */
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** First letters of the first and last words: "Nguyễn Văn An" -> "NA". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return [first, last]
    .filter((w): w is string => w !== undefined)
    .map((w) => Array.from(w)[0] ?? '')
    .join('')
    .toLocaleUpperCase('vi');
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src !== undefined && !failed;
  return (
    <span role="img" aria-label={name} className={cx('avatar', `avatar--${size}`, className)}>
      {showImage ? (
        <img src={src} alt="" onError={() => setFailed(true)} className="avatar__img" />
      ) : (
        <span aria-hidden="true">{initialsOf(name) || '?'}</span>
      )}
    </span>
  );
}

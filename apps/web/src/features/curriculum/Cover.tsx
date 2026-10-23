import { type HskLevel, hskLevelLabel } from '@sat/shared';
import type { CSSProperties } from 'react';

const HAN = ['', '你好', '谢谢', '学习', '朋友', '中国', '汉语', '文化', '历史', '世界'];

/** The cover image, or the default one in the level's colour with its label (AC-3.1, prototype `coverHTML`). */
export function Cover({
  hsk,
  url,
  name,
  size = 'md',
}: {
  hsk: HskLevel;
  url: string | null;
  name: string;
  size?: 'md' | 'sm';
}) {
  const cls = `cur-cover cur-cover--${size}`;
  if (url) return <img className={cls} src={url} alt={`Ảnh bìa ${name}`} />;
  return (
    <div
      className={`${cls} cur-cover--default`}
      style={{ '--hc': `var(--hsk${hsk})` } as CSSProperties}
      role="img"
      aria-label={`Ảnh bìa mặc định ${hskLevelLabel(hsk)}`}
    >
      <span>{hskLevelLabel(hsk)}</span>
      <span className="han" lang="zh-Hans" aria-hidden="true">
        {HAN[hsk]}
      </span>
    </div>
  );
}

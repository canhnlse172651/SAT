import type { FileRef } from '@sat/shared';

export const TEMPLATE_URL = '/api/steps/template.xlsx';

/** Duplicate key: same Chữ Hán and Pinyin (AC-12.3; a polyphone with another pinyin is not a duplicate). */
export const entryKey = (hanzi: string, pinyin: string) =>
  `${hanzi.trim()}|${pinyin.trim().toLowerCase()}`;

/** GV preview link of a stored file (the files module checks the workspace). */
export const fileUrl = (ref: FileRef) => ref.url ?? `/api/files/${ref.id}`;

/** Element id of a block, for the publish issue list (AC-7.2). */
export const blockElementId = (itemId: string, index: number) => `st-${itemId}-b${index}`;

/** Scrolls the Bài học tab to a block and flashes it (AC-7.2). */
export function scrollToBlock(itemId: string, block: number): void {
  const el = document.getElementById(blockElementId(itemId, block - 1));
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('st-block--flash');
  window.setTimeout(() => el.classList.remove('st-block--flash'), 1600);
  el.querySelector<HTMLElement>('input, textarea, select, [contenteditable="true"], button')?.focus(
    {
      preventScroll: true,
    },
  );
}

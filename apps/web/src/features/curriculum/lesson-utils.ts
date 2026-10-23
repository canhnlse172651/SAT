import { ITEM_NOUNS, type Item, type Lesson, type Section } from '@sat/shared';

/** "5 bước học · 3 đã xuất bản · 1 nháp · 1 lưu trữ" — states with 0 items are left out (AC-7.3). */
export function sectionSummary(items: readonly Item[], section: Section): string {
  const list = items.filter((i) => i.section === section);
  const n = (s: Item['status']) => list.filter((i) => i.status === s).length;
  return [
    `${list.length} ${ITEM_NOUNS[section]}`,
    n('published') && `${n('published')} đã xuất bản`,
    n('draft') && `${n('draft')} nháp`,
    n('archived') && `${n('archived')} lưu trữ`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** A draft Bài, or a published one with draft items, can be published (AC-9.3, AC-7.11). */
export const hasDrafts = (l: Lesson): boolean =>
  l.status === 'draft' || l.items.some((i) => i.status === 'draft');

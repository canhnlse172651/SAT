/** Trims and collapses inner whitespace: what names are stored and compared as (002 edge cases). */
export const normalizeSpaces = (value: string): string => value.trim().replace(/\s+/g, ' ');

/**
 * Search / uniqueness key: lower-case, whitespace collapsed, Vietnamese diacritics and pinyin tone marks removed
 * (đ → d, ǐ → i), Hanzi kept as is — "giao trinh" matches "Giáo trình", "ni hao" matches "nǐ hǎo".
 */
export function foldSearch(value: string): string {
  return normalizeSpaces(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .normalize('NFC');
}

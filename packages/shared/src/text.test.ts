import { describe, expect, it } from 'vitest';
import { foldSearch, normalizeSpaces } from './text.js';

describe('text', () => {
  it('collapses whitespace', () => {
    expect(normalizeSpaces('  Bài   1 \t– 你好 ')).toBe('Bài 1 – 你好');
  });
  it('folds Vietnamese diacritics, tone marks and case', () => {
    expect(foldSearch('  Giáo   trình HSK1 ')).toBe('giao trinh hsk1');
    expect(foldSearch('Đường nǐ hǎo')).toBe('duong ni hao');
    expect(foldSearch('Lǜ 汉语')).toBe('lu 汉语');
  });
  it('makes names that differ only by case and spaces equal', () => {
    expect(foldSearch('  tc-003   HÁN NGỮ một ')).toBe(foldSearch('TC-003 Hán ngữ Một'));
  });
});

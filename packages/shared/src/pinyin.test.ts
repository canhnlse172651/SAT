import { describe, expect, it } from 'vitest';
import { normalizePinyinQuery, numberedToToneMarks, stripTones } from './pinyin.js';

describe('numberedToToneMarks', () => {
  it.each([
    ['ni3 hao3', 'nǐ hǎo'],
    ['zhong1 guo2', 'zhōng guó'],
    ['lüe4', 'lüè'],
    ['lve4', 'lüè'],
    ['nu:3', 'nǚ'],
    ['lv4', 'lǜ'],
    ['xiong2', 'xióng'],
    ['er2', 'ér'],
    ['gou3', 'gǒu'],
    ['hui4', 'huì'],
    ['liu2', 'liú'],
    ['ai4', 'ài'],
    ['ma5', 'ma'],
    ['ma0', 'ma'],
    ['de5', 'de'],
    ['nv5', 'nü'],
    ['Zhong1', 'Zhōng'],
    ['AI4', 'ÀI'],
    ['mei2 guan1 xi5', 'méi guān xi'],
  ])('%s -> %s', (input, expected) => {
    expect(numberedToToneMarks(input)).toBe(expected);
  });
  it('leaves text without tone numbers untouched', () => {
    expect(numberedToToneMarks('hello')).toBe('hello');
  });
});

describe('stripTones / normalizePinyinQuery', () => {
  it('strips tone marks', () => {
    expect(stripTones('nǐhǎo')).toBe('nihao');
    expect(stripTones('lǜ')).toBe('lü');
    expect(stripTones('Zhōng')).toBe('Zhong');
  });
  it('normalises queries', () => {
    expect(normalizePinyinQuery('Nǐ Hǎo')).toBe('nihao');
    expect(normalizePinyinQuery('ni3 hao3')).toBe('nihao');
    expect(normalizePinyinQuery('LÜ')).toBe('lv');
    expect(normalizePinyinQuery('lu:e4')).toBe('lve');
    expect(normalizePinyinQuery('lǜ')).toBe('lv');
    expect(normalizePinyinQuery("xi'an")).toBe('xian');
  });
});

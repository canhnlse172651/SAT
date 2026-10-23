import { describe, expect, it } from 'vitest';
import { formatNumber, formatScore } from './numbers.js';

describe('numbers (vi-VN)', () => {
  it.each([
    [75.94, '75,9'],
    [75.95, '76,0'],
    [75.05, '75,1'],
    [75.049, '75,0'],
    [0, '0,0'],
    [100, '100,0'],
    [1234.56, '1.234,6'],
    [-0.04, '0,0'],
    [-2.25, '-2,3'],
  ])('formatScore(%f) = %s', (v, out) => {
    expect(formatScore(v)).toBe(out);
  });
  it('groups thousands with dots', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1234567.891, 2)).toBe('1.234.567,89');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(Number.NaN)).toBe('');
  });
});

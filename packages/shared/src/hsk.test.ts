import { describe, expect, it } from 'vitest';
import { compareHsk, HSK_BANDS, hskBandSchema, hskLabel, hskOrder, type HskBand } from './hsk.js';

describe('hsk', () => {
  it('has 7 bands with labels', () => {
    expect(HSK_BANDS).toHaveLength(7);
    expect(HSK_BANDS.map(hskLabel)).toEqual([
      'HSK 1',
      'HSK 2',
      'HSK 3',
      'HSK 4',
      'HSK 5',
      'HSK 6',
      'HSK 7–9',
    ]);
  });
  it('validates bands', () => {
    expect(hskBandSchema.parse('7-9')).toBe('7-9');
    expect(hskBandSchema.parse(3)).toBe(3);
    expect(hskBandSchema.safeParse(7).success).toBe(false);
    expect(hskBandSchema.safeParse('3').success).toBe(false);
  });
  it('orders bands', () => {
    expect(hskOrder('7-9')).toBe(6);
    const bands: HskBand[] = ['7-9', 2, 6, 1];
    expect(bands.sort(compareHsk)).toEqual([1, 2, 6, '7-9']);
  });
});

import { z } from 'zod';

export const HSK_BANDS = [1, 2, 3, 4, 5, 6, '7-9'] as const;
export type HskBand = (typeof HSK_BANDS)[number];

export const hskBandSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal('7-9'),
]);

export function hskLabel(band: HskBand): string {
  return band === '7-9' ? 'HSK 7–9' : `HSK ${band}`;
}

/** Position of a band in ascending difficulty (0-based). */
export function hskOrder(band: HskBand): number {
  return HSK_BANDS.indexOf(band);
}

export function compareHsk(a: HskBand, b: HskBand): number {
  return hskOrder(a) - hskOrder(b);
}

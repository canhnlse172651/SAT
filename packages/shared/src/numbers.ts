/** Rounds half away from zero at `decimals` places, avoiding binary float artefacts (75.95 -> 76). */
export function roundHalfUp(value: number, decimals: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return sign * Number(`${Math.round(Number(`${abs}e${decimals}`))}e-${decimals}`);
}

/** Vietnamese number format: thousands '.', decimal ',', fixed number of decimals. */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '';
  const fixed = Math.abs(roundHalfUp(value, decimals)).toFixed(decimals);
  const [int = '0', frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const negative = value < 0 && Number(fixed) !== 0;
  return `${negative ? '-' : ''}${grouped}${frac ? `,${frac}` : ''}`;
}

/** A score with one decimal, rounded half-up (spec 008 AC-1.10): 75.94 -> "75,9", 75.95 -> "76,0". */
export function formatScore(value: number): string {
  return formatNumber(value, 1);
}

/** Exercise points (spec 005 AC-16.2): up to two decimals, no trailing zeros: 7 -> "7", 0.5 -> "0,5", 1/3 -> "0,33". */
export function formatPoints(value: number): string {
  return formatNumber(value, 2).replace(/,(\d*?)0+$/, (_, kept: string) =>
    kept ? `,${kept}` : '',
  );
}

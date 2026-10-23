import { parseVnDate, toVnParts } from '@sat/shared';

/** A calendar day in Vietnam time. Calendar maths stays on plain y/m/d triples. */
export interface Ymd {
  y: number;
  m: number;
  d: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export const dayKey = ({ y, m, d }: Ymd): number => y * 10000 + m * 100 + d;

export function toYmd(date: Date): Ymd {
  const p = toVnParts(date);
  return { y: p.year, m: p.month, d: p.day };
}

/** 00:00 Vietnam time of that day as a UTC instant (via the shared parser, so one source of truth). */
export function fromYmd({ y, m, d }: Ymd): Date {
  const date = parseVnDate(`${pad(d)}/${pad(m)}/${pad(y, 4)}`);
  if (!date) throw new RangeError(`Invalid calendar day ${y}-${m}-${d}`);
  return date;
}

export const daysInMonth = (y: number, m: number): number =>
  new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 0 = Monday ... 6 = Sunday (Vietnamese calendars start the week on Monday). */
export const weekdayIndex = (y: number, m: number, d: number): number =>
  (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;

export function addDays(day: Ymd, n: number): Ymd {
  return toYmd(new Date(fromYmd(day).getTime() + n * DAY_MS));
}

/** Same day-of-month in another month, clamped to that month's length. */
export function addMonths({ y, m, d }: Ymd, n: number): Ymd {
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return { y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) };
}

export function clampDay(day: Ymd, min: Ymd | null, max: Ymd | null): Ymd {
  if (min && dayKey(day) < dayKey(min)) return min;
  if (max && dayKey(day) > dayKey(max)) return max;
  return day;
}

/** Month grid rows (Monday first); `null` pads days outside the month. */
export function monthGrid(y: number, m: number): Array<Array<number | null>> {
  const cells: Array<number | null> = Array.from({ length: weekdayIndex(y, m, 1) }, () => null);
  for (let d = 1; d <= daysInMonth(y, m); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

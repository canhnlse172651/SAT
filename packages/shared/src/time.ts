// Vietnam time is UTC+7 all year (no DST), so plain arithmetic is exact.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface VnParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

const pad = (n: number, w = 2): string => String(n).padStart(w, '0');

export function toVnParts(date: Date): VnParts {
  const s = new Date(date.getTime() + VN_OFFSET_MS);
  return {
    year: s.getUTCFullYear(),
    month: s.getUTCMonth() + 1,
    day: s.getUTCDate(),
    hour: s.getUTCHours(),
    minute: s.getUTCMinutes(),
    second: s.getUTCSeconds(),
    millisecond: s.getUTCMilliseconds(),
  };
}

export function formatVnDate(date: Date): string {
  const p = toVnParts(date);
  return `${pad(p.day)}/${pad(p.month)}/${pad(p.year, 4)}`;
}

export function formatVnTime(date: Date): string {
  const p = toVnParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatVnDateTime(date: Date): string {
  return `${formatVnTime(date)} ${formatVnDate(date)}`;
}

/** 00:00:00.000 Vietnam time of the VN calendar day containing `date`, as a UTC instant. */
export function startOfVnDay(date: Date): Date {
  const shifted = date.getTime() + VN_OFFSET_MS;
  return new Date(shifted - (((shifted % DAY_MS) + DAY_MS) % DAY_MS) - VN_OFFSET_MS);
}

/** 23:59:59.999 Vietnam time of that day, as a UTC instant (the deadline rule). */
export function endOfVnDay(date: Date): Date {
  return new Date(startOfVnDay(date).getTime() + DAY_MS - 1);
}

/** Parses 'dd/MM/yyyy' (a real calendar date) to 00:00 VN as a UTC instant; null if invalid. */
export function parseVnDate(input: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return new Date(utc.getTime() - VN_OFFSET_MS);
}

/** ISO-8601 UTC string (the API date format). */
export function isoUtc(date: Date): string {
  return date.toISOString();
}

import { describe, expect, it } from 'vitest';
import {
  endOfVnDay,
  formatVnDate,
  formatVnDateTime,
  formatVnTime,
  isoUtc,
  parseVnDate,
  startOfVnDay,
  toVnParts,
} from './time.js';

// 2026-03-31T17:30:00Z is already 01/04/2026 00:30 in Vietnam.
const across = new Date('2026-03-31T17:30:00Z');

describe('time (UTC+7)', () => {
  it('splits into VN parts across the UTC date boundary', () => {
    expect(toVnParts(across)).toEqual({
      year: 2026,
      month: 4,
      day: 1,
      hour: 0,
      minute: 30,
      second: 0,
      millisecond: 0,
    });
  });
  it('formats date, time and date-time', () => {
    expect(formatVnDate(across)).toBe('01/04/2026');
    expect(formatVnTime(across)).toBe('00:30');
    expect(formatVnDateTime(across)).toBe('00:30 01/04/2026');
  });
  it('computes start and end of the VN day', () => {
    expect(isoUtc(startOfVnDay(across))).toBe('2026-03-31T17:00:00.000Z');
    expect(isoUtc(endOfVnDay(across))).toBe('2026-04-01T16:59:59.999Z');
    const late = new Date('2026-04-01T16:59:59.999Z');
    expect(formatVnTime(late)).toBe('23:59');
    expect(endOfVnDay(late).getTime()).toBe(late.getTime());
    expect(startOfVnDay(new Date('2026-04-01T17:00:00Z')).toISOString()).toBe(
      '2026-04-01T17:00:00.000Z',
    );
  });
  it('parses dd/MM/yyyy with validation', () => {
    expect(parseVnDate('01/04/2026')?.toISOString()).toBe('2026-03-31T17:00:00.000Z');
    expect(parseVnDate('29/02/2028')).not.toBeNull();
    for (const bad of [
      '29/02/2026',
      '31/04/2026',
      '00/01/2026',
      '1/4/2026',
      '2026-04-01',
      '',
      '01/13/2026',
    ]) {
      expect(parseVnDate(bad), bad).toBeNull();
    }
  });
  it('round-trips parse and format', () => {
    expect(formatVnDate(parseVnDate('15/10/2026') as Date)).toBe('15/10/2026');
  });
});

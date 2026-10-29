import { describe, expect, it } from 'vitest';
import {
  RANKING_MESSAGES as M,
  average,
  formulaText,
  givenName,
  itemPoints,
  rankRows,
  rankingScore,
  roundOne,
} from './scoring.js';

describe('008 rounding (AC-1.2, AC-1.10)', () => {
  it('item points are the percentage rounded half-up to an integer', () => {
    expect(itemPoints(18, 20)).toBe(90);
    expect(itemPoints(2, 3)).toBe(67);
    expect(itemPoints(1, 8)).toBe(13);
    expect(itemPoints(0, 10)).toBe(0);
  });

  it('rounds to one decimal, 0,05 upwards, without float artefacts', () => {
    expect(roundOne(75.95)).toBe(76);
    expect(roundOne(75.94)).toBe(75.9);
    expect(roundOne(0.03)).toBe(0);
    expect(roundOne(0.3 * 71.1 + 0.7 * 78)).toBe(75.9);
  });

  it('averages counted items, 0 when none', () => {
    expect(average([])).toBe(0);
    expect(average([90, 70, 67])).toBe(75.7);
    expect(average([90, 0])).toBe(45);
  });

  it('weights 30 % exercise average and 70 % exam average from the rounded averages', () => {
    expect(rankingScore(75.7, 75)).toBe(75.2);
    expect(rankingScore(90, 0)).toBe(27);
    expect(rankingScore(71.1, 78)).toBe(75.9);
    expect(rankingScore(0.1, 0)).toBe(0);
  });

  it('shows the calculation with the HV numbers (AC-13.5)', () => {
    expect(formulaText(71.1, 78, 75.9)).toBe('30% × 71,1 + 70% × 78,0 = 75,9');
    expect(formulaText(90, 0, 27)).toBe('30% × 90,0 + 70% × 0,0 = 27,0');
  });
});

describe('008 ranks and order (REQ-6)', () => {
  const row = (
    name: string,
    score: number,
    achievedAt: string | null = null,
    email = `${name}@x.vn`,
  ) => ({
    name,
    email,
    score,
    achievedAt,
  });

  it('given name is the last word of the full name', () => {
    expect(givenName('Nguyễn Văn An')).toBe('An');
    expect(givenName('  Chi ')).toBe('Chi');
  });

  it('ties share a rank and the next rank skips (1, 2, 2, 4) (AC-6.1)', () => {
    const ranked = rankRows([row('A', 27), row('B', 24), row('C', 24), row('D', 21)]);
    expect(ranked.map((r) => [r.name, r.rank])).toEqual([
      ['A', 1],
      ['B', 2],
      ['C', 2],
      ['D', 4],
    ]);
  });

  it('orders a tie by time reached, then given name, full name, e-mail (AC-6.2)', () => {
    const ranked = rankRows([
      row('Trần Thị Bình', 24, '2026-11-01T02:00:00.000Z'),
      row('Phạm Thu Chi', 24, '2026-11-01T01:00:00.000Z'),
      row('Lê Văn An', 24, '2026-11-01T03:00:00.000Z', 'b@x.vn'),
      row('Lê Văn An', 24, '2026-11-01T03:00:00.000Z', 'a@x.vn'),
      row('Nguyễn Văn Ân', 24, '2026-11-01T03:00:00.000Z'),
    ]);
    expect(ranked.map((r) => [r.name, r.email])).toEqual([
      ['Phạm Thu Chi', 'Phạm Thu Chi@x.vn'],
      ['Trần Thị Bình', 'Trần Thị Bình@x.vn'],
      ['Lê Văn An', 'a@x.vn'],
      ['Lê Văn An', 'b@x.vn'],
      ['Nguyễn Văn Ân', 'Nguyễn Văn Ân@x.vn'],
    ]);
    expect(new Set(ranked.map((r) => r.rank))).toEqual(new Set([1]));
  });

  it('0,0 is unranked and comes after every ranked row, by name (AC-6.3)', () => {
    const ranked = rankRows([row('Phạm Thu Chi', 0), row('Trần Thị Bình', 0), row('An', 0.1 * 0)]);
    expect(ranked.every((r) => r.rank === null)).toBe(true);
    const mixed = rankRows([row('Phạm Thu Chi', 0), row('Lê Dũng', 3)]);
    expect(mixed.map((r) => [r.name, r.rank])).toEqual([
      ['Lê Dũng', 1],
      ['Phạm Thu Chi', null],
    ]);
  });
});

describe('008 messages', () => {
  it('formats the dynamic texts', () => {
    expect(M.upcoming('2026-11-03')).toBe(
      'Lớp bắt đầu ngày 03/11/2026. Bảng xếp hạng sẽ có khi lớp bắt đầu.',
    );
    expect(M.hiddenLine(2, 175)).toBe('Nội dung đã ẩn: 2 bộ bài tập · 175 điểm');
    expect(M.goneLine(1, 75)).toBe('Bài thi đã gỡ: 1 bài thi · 75 điểm');
    expect(M.noMatch('zzz')).toBe('Không có học viên nào khớp với “zzz”.');
    expect(M.position(11, 12)).toBe('Hạng 11/12');
  });
});

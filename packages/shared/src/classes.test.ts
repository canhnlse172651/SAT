import { describe, expect, it } from 'vitest';
import {
  addVnDays,
  classStatusOf,
  createClassBodySchema,
  dayRange,
  daySchema,
  deadlineLabel,
  formatDay,
  learnerSetStatus,
  startDateRangeMessage,
  vnDay,
  vnDayEnd,
  vnDayStart,
} from './classes.js';

describe('VN calendar days', () => {
  it('maps instants to the Vietnam day (UTC+7)', () => {
    expect(vnDay(new Date('2026-10-20T16:59:59.999Z'))).toBe('2026-10-20');
    expect(vnDay(new Date('2026-10-20T17:00:00.000Z'))).toBe('2026-10-21');
  });

  it('gives the start and the 23:59 deadline of a day', () => {
    expect(vnDayStart('2026-10-21').toISOString()).toBe('2026-10-20T17:00:00.000Z');
    expect(vnDayEnd('2026-10-21').toISOString()).toBe('2026-10-21T16:59:59.999Z');
  });

  it('adds days across months and years', () => {
    expect(addVnDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addVnDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('formats and validates days', () => {
    expect(formatDay('2026-01-05')).toBe('05/01/2026');
    expect(daySchema.safeParse('2026-02-29').success).toBe(false);
    expect(daySchema.safeParse('2028-02-29').success).toBe(true);
    expect(daySchema.safeParse('29/02/2028').success).toBe(false);
  });

  it('003:AC-2.5 range is 365 days around today', () => {
    expect(dayRange('2026-10-21')).toEqual(['2025-10-21', '2027-10-21']);
    expect(startDateRangeMessage('2026-10-21')).toBe(
      'Vui lòng chọn ngày bắt đầu từ 21/10/2025 đến 21/10/2027',
    );
  });
});

describe('003:AC-14.1 class status', () => {
  it('is ended once ended, else upcoming before the start day and active from it', () => {
    expect(classStatusOf({ startDate: '2026-10-22', endDate: null }, '2026-10-21')).toBe(
      'upcoming',
    );
    expect(classStatusOf({ startDate: '2026-10-21', endDate: null }, '2026-10-21')).toBe('active');
    expect(classStatusOf({ startDate: '2026-10-01', endDate: '2026-10-20' }, '2026-10-21')).toBe(
      'ended',
    );
  });
});

describe('003:AC-19.3 learner set status', () => {
  const now = new Date('2026-10-21T03:00:00Z'); // 10:00 VN, 21/10
  const base = { submitted: false, inProgress: false, classStatus: 'active' as const, now };

  it('follows Đã hoàn thành › Chưa mở › Quá hạn › Đang làm › Chưa làm', () => {
    expect(learnerSetStatus({ ...base, deadline: null, submitted: true })).toBe('done');
    expect(learnerSetStatus({ ...base, deadline: null, inProgress: true })).toBe('closed');
    expect(learnerSetStatus({ ...base, deadline: '2026-10-20', inProgress: true })).toBe('overdue');
    expect(learnerSetStatus({ ...base, deadline: '2026-10-21', inProgress: true })).toBe('doing');
    expect(learnerSetStatus({ ...base, deadline: '2026-10-21' })).toBe('todo');
  });

  it('003:AC-23.6 never shows Quá hạn in an ended class', () => {
    expect(learnerSetStatus({ ...base, deadline: '2026-10-01', classStatus: 'ended' })).toBe(
      'todo',
    );
  });
});

describe('003:AC-23.1 deadline label', () => {
  const base = { today: '2026-10-21', submitted: false, classStatus: 'active' as const };
  it('shows Hạn hôm nay, dd/MM, or dd/MM/yyyy in another year', () => {
    expect(deadlineLabel({ ...base, deadline: '2026-10-21' })).toBe('Hạn hôm nay');
    expect(deadlineLabel({ ...base, deadline: '2026-10-25' })).toBe('Hạn nộp 25/10');
    expect(deadlineLabel({ ...base, deadline: '2027-01-05' })).toBe('Hạn nộp 05/01/2027');
    expect(deadlineLabel({ ...base, deadline: '2026-10-21', submitted: true })).toBe(
      'Hạn nộp 21/10',
    );
    expect(deadlineLabel({ ...base, deadline: '2026-10-21', classStatus: 'ended' })).toBe(
      'Hạn nộp 21/10',
    );
  });
});

describe('003:AC-2.2 class body', () => {
  it('trims the name and rejects blank or too long names', () => {
    const body = {
      startDate: '2026-10-21',
      curriculumId: 'a'.repeat(24),
      createKey: 'k'.repeat(16),
    };
    expect(createClassBodySchema.parse({ ...body, name: '  Lớp A ' }).name).toBe('Lớp A');
    expect(
      createClassBodySchema.safeParse({ ...body, name: '   ' }).error?.issues[0]?.message,
    ).toBe('Vui lòng nhập tên lớp');
    expect(
      createClassBodySchema.safeParse({ ...body, name: 'x'.repeat(101) }).error?.issues[0]?.message,
    ).toBe('Tên lớp tối đa 100 ký tự');
  });
});

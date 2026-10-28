import { describe, expect, it } from 'vitest';
import {
  EXAM_MESSAGES as M,
  attemptEndsAt,
  examIssues,
  examStateAt,
  formatCountdown,
  formatHms,
  formatSpent,
  formatVnDateTimeInput,
  learnerRowLine,
  parseVnDateTime,
} from './exams.js';
import { newQuestion } from './exercises.js';

const at = (iso: string) => new Date(iso);
const MIN = 60_000;

describe('006 exam state from the clock (AC-3.6)', () => {
  const exam = {
    phase: 'scheduled' as const,
    opensAt: at('2026-11-20T13:00:00Z'),
    closesAt: at('2026-11-20T15:00:00Z'),
  };
  it('is scheduled before, open from the open time, closed from the close time', () => {
    expect(examStateAt(exam, at('2026-11-20T12:59:59Z'))).toBe('scheduled');
    expect(examStateAt(exam, at('2026-11-20T13:00:00Z'))).toBe('open');
    expect(examStateAt(exam, at('2026-11-20T14:59:59Z'))).toBe('open');
    expect(examStateAt(exam, at('2026-11-20T15:00:00Z'))).toBe('closed');
  });
  it('keeps draft and archived', () => {
    expect(examStateAt({ ...exam, phase: 'draft' }, at('2026-11-20T14:00:00Z'))).toBe('draft');
    expect(examStateAt({ ...exam, phase: 'archived' }, at('2026-11-20T14:00:00Z'))).toBe(
      'archived',
    );
  });
});

describe('006 attempt end = min(start + duration, close) (AC-8.3, AC-5.2)', () => {
  it('uses the full duration when the close is later', () => {
    expect(attemptEndsAt(at('2026-11-20T13:00:00Z'), 45, at('2026-11-20T15:00:00Z'))).toEqual(
      at('2026-11-20T13:45:00Z'),
    );
  });
  it('stops at the close time', () => {
    expect(attemptEndsAt(at('2026-11-20T14:40:00Z'), 45, at('2026-11-20T15:00:00Z'))).toEqual(
      at('2026-11-20T15:00:00Z'),
    );
  });
});

describe('006 VN date-time input (AC-3.2)', () => {
  it('parses dd/MM/yyyy HH:mm as Vietnam time', () => {
    expect(parseVnDateTime('20/11/2026 20:00')?.toISOString()).toBe('2026-11-20T13:00:00.000Z');
    expect(parseVnDateTime(' 01/01/2027 00:05 ')?.toISOString()).toBe('2026-12-31T17:05:00.000Z');
  });
  it('refuses impossible dates and other shapes', () => {
    expect(parseVnDateTime('31/02/2026 20:00')).toBeNull();
    expect(parseVnDateTime('20/11/2026 24:00')).toBeNull();
    expect(parseVnDateTime('2026-11-20 20:00')).toBeNull();
    expect(parseVnDateTime('20/11/2026')).toBeNull();
  });
  it('formats back to the same text whatever the device zone', () => {
    expect(formatVnDateTimeInput(at('2026-11-20T13:00:00Z'))).toBe('20/11/2026 20:00');
  });
});

describe('006 clocks', () => {
  it('counts down as mm:ss under an hour and h:mm:ss from an hour (AC-9.1)', () => {
    expect(formatCountdown(45 * MIN)).toBe('45:00');
    expect(formatCountdown(59 * MIN + 59_400)).toBe('59:59');
    expect(formatCountdown(60 * MIN)).toBe('1:00:00');
    expect(formatCountdown(89 * MIN + 5_000)).toBe('1:29:05');
    expect(formatCountdown(-5_000)).toBe('00:00');
  });
  it('shows "Mở sau hh:mm:ss" with two-digit hours (AC-7.5)', () => {
    expect(formatHms(2 * 60 * MIN - 1_000)).toBe('01:59:59');
    expect(formatHms(0)).toBe('00:00:00');
  });
  it('formats time spent in minutes and seconds', () => {
    expect(formatSpent(32 * MIN + 15_000)).toBe('32 phút 15 giây');
    expect(formatSpent(45 * MIN)).toBe('45 phút');
    expect(formatSpent(20_000)).toBe('20 giây');
  });
});

describe('006 scheduling conditions (AC-3.3, AC-3.4, AC-3.5)', () => {
  const now = at('2026-11-20T10:00:30Z');
  const ready = {
    name: 'Kiểm tra',
    content: { instructions: '', stepId: null, questions: [] as ReturnType<typeof newQuestion>[] },
    classIds: ['64b7f0c2a1b2c3d4e5f60718'],
    opensAt: at('2026-11-20T11:00:00Z'),
    durationMin: 45,
    closesAt: at('2026-11-20T13:00:00Z'),
  };
  const mcq = () => {
    const q = newQuestion('mcq');
    if (q.type !== 'mcq') throw new Error('mcq');
    q.prompt = '你好?';
    q.options = q.options.map((o, k) => ({ ...o, text: k ? 'Tạm biệt' : 'Xin chào', correct: !k }));
    return q;
  };
  const issues = (over: Partial<typeof ready>, checkOpen = true) =>
    examIssues({ ...ready, content: { ...ready.content, questions: [mcq()] }, ...over }, now, {
      checkOpen,
    }).map((i) => i.message);

  it('passes a ready exam', () => {
    expect(issues({})).toEqual([]);
  });
  it('lists every missing condition, each with its target', () => {
    const list = examIssues(
      {
        ...ready,
        name: ' ',
        classIds: [],
        opensAt: null,
        durationMin: null,
        closesAt: null,
      },
      now,
      { checkOpen: true },
    );
    expect(list.map((i) => i.target)).toEqual([
      'name',
      'questions',
      'classes',
      'open',
      'dur',
      'close',
    ]);
    expect(list[1]?.message).toBe(M.needQuestion);
  });
  it('names incomplete questions "Câu n: …"', () => {
    const q = mcq();
    q.options = q.options.map((o) => ({ ...o, correct: false }));
    const list = examIssues({ ...ready, content: { ...ready.content, questions: [q] } }, now, {
      checkOpen: true,
    });
    expect(list[0]?.target).toBe('q1');
    expect(list[0]?.message).toMatch(/^Câu 1: /);
  });
  it('allows the current minute but not an earlier one, only when asked', () => {
    expect(
      issues({ opensAt: at('2026-11-20T10:00:00Z'), closesAt: at('2026-11-20T11:00:00Z') }),
    ).toEqual([]);
    expect(issues({ opensAt: at('2026-11-20T09:59:00Z') })).toEqual([M.openPast]);
    expect(issues({ opensAt: at('2026-11-20T09:00:00Z') }, false)).toEqual([]);
  });
  it('checks the close time against open + duration and now (AC-3.3)', () => {
    expect(issues({ closesAt: at('2026-11-20T11:30:00Z') })).toEqual([M.closeTooEarly(45)]);
    expect(
      issues({ opensAt: at('2026-11-20T08:00:00Z'), closesAt: at('2026-11-20T10:00:00Z') }, false),
    ).toEqual([M.closePast]);
  });
  it('checks the duration range', () => {
    expect(issues({ durationMin: 0 })).toEqual([M.durationInvalid]);
    expect(issues({ durationMin: 1.5 })).toEqual([M.durationInvalid]);
    expect(issues({ durationMin: 301 })).toEqual([M.durationInvalid]);
  });
});

describe('006 HV row line by priority (AC-7.3)', () => {
  const closesAt = at('2026-11-20T15:00:00Z');
  const opensAt = at('2026-11-20T13:00:00Z');
  const now = at('2026-11-20T14:00:00Z');
  it('words each state', () => {
    expect(learnerRowLine({ kind: 'submitted', percent: 75 }, { opensAt, closesAt }, now)).toBe(
      'Đã nộp · 75/100',
    );
    expect(
      learnerRowLine(
        { kind: 'doing', endsAt: at('2026-11-20T14:20:05Z') },
        { opensAt, closesAt },
        now,
      ),
    ).toBe('Đang làm · còn 20:05');
    expect(learnerRowLine({ kind: 'noShow' }, { opensAt, closesAt }, now)).toBe(
      'Đã đóng · Không làm bài',
    );
    expect(learnerRowLine({ kind: 'closed' }, { opensAt, closesAt }, now)).toBe('Đã đóng');
    expect(learnerRowLine({ kind: 'notOpen' }, { opensAt, closesAt }, now)).toBe(
      'Mở lúc 20:00 20/11/2026',
    );
    expect(learnerRowLine({ kind: 'ended' }, { opensAt, closesAt }, now)).toBe(
      'Lớp đã kết thúc — không thể vào thi.',
    );
    expect(learnerRowLine({ kind: 'open' }, { opensAt, closesAt }, now)).toBe(
      'Đang mở · đóng lúc 22:00 20/11/2026',
    );
  });
});

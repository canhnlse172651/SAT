import {
  type ExamScoreRow,
  type ScoreBreakdown,
  type SetScoreRow,
  average,
  itemPoints,
  rankingScore,
  roundOne,
  vnDayEnd,
} from '@sat/shared';
import type { LessonDoc } from '../curriculum/curriculum.model.js';
import type { ClassDoc } from '../classes/classes.model.js';
import type { ExamScoringData } from '../exams/exam-results.service.js';
import type { ScoreChangeReason } from './scoring.log.js';

/*
 * The 008 score of one HV in one class, derived from the current data each time it is read (REQ-1 … REQ-5). Pure: the
 * service gathers the inputs, this decides which items count and what they are worth.
 */

export interface SetSubmission {
  score: number;
  maxScore: number;
  at: Date;
  /** Re-grades after answer-key changes, oldest first: `from` is the score until `at` (AC-3.3). */
  regrades: readonly { at: Date; from: number }[];
}

export interface ExamSubmission {
  score: number;
  maxScore: number;
  at: Date;
}

/** One membership of an HV: the periods they were in the class and since when their account is activated (§7). */
export interface MemberTimeline {
  periods: { from: Date; to: Date | null }[];
  /** null while "Chưa kích hoạt" / "Gửi email thất bại". */
  activeSince: Date | null;
}

export interface ClassInputs {
  now: Date;
  cls: Pick<ClassDoc, 'deadlines' | 'hidden'>;
  lessons: readonly LessonDoc[];
  exams: ExamScoringData['exams'];
}

/** One exercise set of the class with everything that does not depend on the HV. */
interface SetItem {
  base: Pick<SetScoreRow, 'id' | 'title' | 'lessonId' | 'lessonName' | 'deadline' | 'flag'>;
  published: boolean;
  visible: boolean;
  /** 23:59:59 VN of the deadline day. */
  end: Date | null;
  /** When a missed deadline starts to count: the deadline, or when it was set if that was later. */
  zeroFrom: Date | null;
  /** When the class hid the set's section (unsubmitted sets of a hidden section stop counting, AC-4.2). */
  hiddenAt: Date | null;
}

/** `ClassInputs` worked out once per read, so scoring each HV does not scan deadlines or hides again (NFR-2, NFR-4). */
export interface ClassScoring {
  now: Date;
  sets: SetItem[];
  exams: ExamScoringData['exams'];
  events: ScoreEvent[];
}

export interface StudentInputs {
  member: MemberTimeline;
  sets: ReadonlyMap<string, SetSubmission>;
  exams: ReadonlyMap<string, ExamSubmission>;
  /** Exams 006 recorded as "Không làm bài" for the HV in this class. */
  noShows: ReadonlySet<string>;
}

export interface ScoreEvent {
  at: Date;
  itemId: string | null;
  reason: ScoreChangeReason;
}

/** The GV's breakdown (every listed row, flagged ones included) plus the input events behind it. */
export interface StudentScore {
  breakdown: ScoreBreakdown;
  lastEvent: ScoreEvent | null;
  /**
   * AC-6.6: the last moment the displayed score changed, replayed from the times kept in the data (submissions,
   * re-grades, deadlines, closes, hides). null when it never changed, or when the replay does not end at the current
   * score (an unhide, an archive or a membership change keep no time of their own).
   */
  changed: ScoreEvent | null;
}

/** AC-1.8, AC-1.9, AC-5.2, AC-5.6, AC-5.7: a missed deadline counts 0 only while the HV was an activated member. */
export function zeroApplies(m: MemberTimeline, at: Date): boolean {
  if (!m.activeSince || at < m.activeSince) return false;
  return m.periods.some((p) => at >= p.from && (!p.to || at < p.to));
}

export function prepareClass(c: ClassInputs): ClassScoring {
  const deadlines = new Map(c.cls.deadlines.map((d) => [String(d.setId), d]));
  const hides = new Map(
    c.cls.hidden.filter((h) => h.section === 'exercise').map((h) => [String(h.lessonId), h.at]),
  );
  const sets: SetItem[] = [];
  for (const lesson of c.lessons) {
    const lessonId = String(lesson._id);
    const hiddenAt = hides.get(lessonId) ?? null;
    for (const item of lesson.items) {
      if (item.section !== 'exercise') continue;
      const id = String(item._id);
      const published = lesson.status === 'published' && item.status === 'published';
      const visible = published && !hiddenAt;
      const d = deadlines.get(id);
      const end = d ? vnDayEnd(d.date) : null;
      sets.push({
        base: {
          id,
          title: item.title,
          lessonId,
          lessonName: lesson.name,
          deadline: d?.date ?? null,
          flag: visible ? null : item.status === 'archived' ? 'archived' : 'hidden',
        },
        published,
        visible,
        end,
        zeroFrom: d && end ? (d.at > end ? d.at : end) : null,
        hiddenAt,
      });
    }
  }
  const exams = [...c.exams].sort(
    (a, b) =>
      (a.opensAt?.getTime() ?? Infinity) - (b.opensAt?.getTime() ?? Infinity) ||
      a.name.localeCompare(b.name, 'vi'),
  );
  // GV actions on the class that may change scores without an item time of their own (AC-6.6, REQ-4).
  const events: ScoreEvent[] = [
    ...[...hides].map(([lessonId, at]) => ({
      at,
      itemId: lessonId,
      reason: 'Thay đổi nội dung' as const,
    })),
    ...c.cls.deadlines.map((d) => ({
      at: d.at,
      itemId: String(d.setId),
      reason: 'Thay đổi nội dung' as const,
    })),
  ];
  return { now: c.now, sets, exams, events };
}

/** A counted item's points from `from` until `to` (open-ended when null), for the replay of AC-6.6. */
interface Span {
  exam: boolean;
  points: number;
  from: Date;
  to: Date | null;
  /** What starts the span. */
  start: ScoreEvent;
}

const earliest = (...dates: (Date | null)[]): Date | null =>
  dates.reduce<Date | null>((a, b) => (!b ? a : !a || b < a ? b : a), null);

function setRows(
  c: ClassScoring,
  s: StudentInputs,
  events: ScoreEvent[],
  spans: Span[],
): SetScoreRow[] {
  const rows: SetScoreRow[] = [];
  for (const set of c.sets) {
    const { id } = set.base;
    const sub = s.sets.get(id);
    // A missed deadline counted 0 from `zeroFrom` until the section was hidden or the HV submitted late.
    const zeroSpan = (until: Date | null) => {
      if (!set.published || !set.zeroFrom || !set.end || !zeroApplies(s.member, set.end)) return;
      const to = earliest(set.hiddenAt, until);
      if (!to || set.zeroFrom < to)
        spans.push({
          exam: false,
          points: 0,
          from: set.zeroFrom,
          to,
          start: { at: set.zeroFrom, itemId: id, reason: 'Quá hạn' },
        });
    };
    if (sub) {
      // AC-1.4: an item worth 0 points is left out entirely.
      if (sub.maxScore <= 0) continue;
      events.push({ at: sub.at, itemId: id, reason: 'Điểm mới' });
      const lastRegrade = sub.regrades.at(-1);
      if (lastRegrade) events.push({ at: lastRegrade.at, itemId: id, reason: 'Điều chỉnh điểm' });
      zeroSpan(sub.at);
      let from = sub.at;
      let start: ScoreEvent = { at: sub.at, itemId: id, reason: 'Điểm mới' };
      for (const r of sub.regrades) {
        spans.push({
          exam: false,
          points: itemPoints(r.from, sub.maxScore),
          from,
          to: r.at,
          start,
        });
        from = r.at;
        start = { at: r.at, itemId: id, reason: 'Điều chỉnh điểm' };
      }
      const points = itemPoints(sub.score, sub.maxScore);
      spans.push({ exam: false, points, from, to: null, start });
      rows.push({
        ...set.base,
        status: 'done',
        late: !!set.end && sub.at > set.end,
        got: sub.score,
        max: sub.maxScore,
        points,
        counted: true,
      });
      continue;
    }
    // AC-1.11: no deadline and no submission — not part of the score, not listed.
    if (!set.end) continue;
    const passed = set.end <= c.now;
    // AC-4.2, AC-4.6: unsubmitted sets of a hidden section or archived stop counting (the GV still sees them).
    const zero = set.visible && passed && zeroApplies(s.member, set.end);
    if (zero) events.push({ at: set.end, itemId: id, reason: 'Quá hạn' });
    zeroSpan(null);
    rows.push({
      ...set.base,
      status: zero || (!set.visible && passed) ? 'overdue' : 'todo',
      late: false,
      got: null,
      max: null,
      points: zero ? 0 : null,
      counted: zero,
    });
  }
  return rows;
}

function examRows(
  c: ClassScoring,
  s: StudentInputs,
  events: ScoreEvent[],
  spans: Span[],
): ExamScoreRow[] {
  const rows: ExamScoreRow[] = [];
  for (const exam of c.exams) {
    const base = {
      id: exam.id,
      name: exam.name,
      opensAt: exam.opensAt?.toISOString() ?? null,
      closesAt: exam.closesAt?.toISOString() ?? null,
      // AC-4.9: an archived exam is "gỡ khỏi lớp" for scoring.
      flag: exam.archived ? ('removed' as const) : null,
    };
    const sub = s.exams.get(exam.id);
    if (sub) {
      if (sub.maxScore <= 0) continue;
      const start: ScoreEvent = { at: sub.at, itemId: exam.id, reason: 'Điểm mới' };
      events.push(start);
      const points = itemPoints(sub.score, sub.maxScore);
      spans.push({ exam: true, points, from: sub.at, to: null, start });
      rows.push({
        ...base,
        status: 'done',
        got: sub.score,
        max: sub.maxScore,
        points,
        counted: true,
      });
      continue;
    }
    const closed = !!exam.closesAt && exam.closesAt <= c.now;
    const noShow = s.noShows.has(exam.id);
    const zero = noShow && !exam.archived;
    if (zero) {
      const at = exam.closesAt ?? new Date(0);
      const start: ScoreEvent = { at, itemId: exam.id, reason: 'Quá hạn' };
      if (exam.closesAt) events.push(start);
      spans.push({ exam: true, points: 0, from: at, to: null, start });
    }
    rows.push({
      ...base,
      status: closed ? 'noShow' : 'todo',
      got: null,
      max: null,
      points: zero ? 0 : null,
      counted: zero,
    });
  }
  return rows;
}

/**
 * AC-6.6: replays the displayed Điểm xếp hạng over time from the spans and returns what changed it last. null when it
 * never changed or when the replay does not end at `score` (a change the data keeps no time for).
 */
function lastChange(spans: readonly Span[], now: Date, score: number): ScoreEvent | null {
  const end = now.getTime();
  const steps: { t: number; exam: boolean; points: number; n: number; start: ScoreEvent | null }[] =
    [];
  for (const sp of spans) {
    const from = sp.from.getTime();
    if (from > end) continue;
    steps.push({ t: from, exam: sp.exam, points: sp.points, n: 1, start: sp.start });
    if (sp.to && sp.to.getTime() <= end)
      steps.push({ t: sp.to.getTime(), exam: sp.exam, points: -sp.points, n: -1, start: null });
  }
  steps.sort((a, b) => a.t - b.t);
  const mean = (total: number, n: number) => (n ? roundOne(total / n) : 0);
  let ex = 0;
  let nEx = 0;
  let exam = 0;
  let nExam = 0;
  let current = 0;
  let changed: ScoreEvent | null = null;
  let i = 0;
  while (i < steps.length) {
    const t = steps[i]?.t;
    let cause: ScoreEvent | null = null;
    for (let st = steps[i]; st && st.t === t; st = steps[++i]) {
      if (st.exam) {
        exam += st.points;
        nExam += st.n;
      } else {
        ex += st.points;
        nEx += st.n;
      }
      cause ??= st.start;
    }
    const next = rankingScore(mean(ex, nEx), mean(exam, nExam));
    if (next !== current && t !== undefined)
      changed = {
        at: new Date(t),
        itemId: cause?.itemId ?? null,
        reason: cause?.reason ?? 'Thay đổi nội dung',
      };
    current = next;
  }
  return current === score ? changed : null;
}

/** REQ-1 … REQ-5 for one HV of the class. */
export function scoreStudent(c: ClassScoring, s: StudentInputs): StudentScore {
  const events: ScoreEvent[] = [...c.events];
  const spans: Span[] = [];
  const sets = setRows(c, s, events, spans);
  const exams = examRows(c, s, events, spans);
  const setPoints = sets.filter((r) => r.counted).map((r) => r.points ?? 0);
  const examPoints = exams.filter((r) => r.counted).map((r) => r.points ?? 0);
  const avgEx = average(setPoints);
  const avgExam = average(examPoints);
  const score = rankingScore(avgEx, avgExam);
  const open = sets.filter((r) => !r.flag && r.deadline);
  const lastEvent = events
    .filter((e) => e.at <= c.now)
    .reduce<ScoreEvent | null>((best, e) => (!best || e.at > best.at ? e : best), null);
  return {
    breakdown: {
      score,
      avgEx,
      nEx: setPoints.length,
      avgExam,
      nExam: examPoints.length,
      submitted: open.filter((r) => r.status === 'done').length,
      withDeadline: open.length,
      sets,
      exams,
      hidden: null,
      gone: null,
    },
    lastEvent,
    changed: lastChange(spans, c.now, score),
  };
}

/**
 * What the HV sees of their own breakdown (AC-11.1, AC-11.3, AC-11.8, AC-11.10, NFR-7): flagged items only as the two
 * aggregate lines, never by name; closed exams that do not count for them are not listed.
 */
export function studentView(b: ScoreBreakdown): ScoreBreakdown {
  const line = (rows: { counted: boolean; points: number | null }[]) => {
    const counted = rows.filter((r) => r.counted);
    return counted.length
      ? { k: counted.length, sum: counted.reduce((a, r) => a + (r.points ?? 0), 0) }
      : null;
  };
  return {
    ...b,
    sets: b.sets.filter((r) => !r.flag),
    exams: b.exams.filter((r) => !r.flag && (r.status !== 'noShow' || r.counted)),
    hidden: line(b.sets.filter((r) => r.flag)),
    gone: line(b.exams.filter((r) => r.flag)),
  };
}

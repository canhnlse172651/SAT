import {
  type ExamScoreRow,
  type ScoreBreakdown,
  type SetScoreRow,
  average,
  itemPoints,
  rankingScore,
  vnDayEnd,
} from '@sat/shared';
import type { LessonDoc } from '../curriculum/curriculum.model.js';
import { deadlineOf, isHidden } from '../classes/class-visibility.js';
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
  regradedAt: Date | null;
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

/** The GV's breakdown (every listed row, flagged ones included) plus the latest input event behind it. */
export interface StudentScore {
  breakdown: ScoreBreakdown;
  lastEvent: ScoreEvent | null;
}

/** AC-1.8, AC-1.9, AC-5.2, AC-5.6, AC-5.7: a missed deadline counts 0 only while the HV was an activated member. */
export function zeroApplies(m: MemberTimeline, at: Date): boolean {
  if (!m.activeSince || at < m.activeSince) return false;
  return m.periods.some((p) => at >= p.from && (!p.to || at < p.to));
}

function setRows(c: ClassInputs, s: StudentInputs, events: ScoreEvent[]): SetScoreRow[] {
  const rows: SetScoreRow[] = [];
  for (const lesson of c.lessons) {
    const hiddenSection = isHidden(c.cls, lesson._id, 'exercise');
    for (const item of lesson.items) {
      if (item.section !== 'exercise') continue;
      const id = String(item._id);
      const visible =
        lesson.status === 'published' && item.status === 'published' && !hiddenSection;
      const flag = visible ? null : item.status === 'archived' ? 'archived' : 'hidden';
      const deadline = deadlineOf(c.cls, item._id);
      const end = deadline ? vnDayEnd(deadline) : null;
      const sub = s.sets.get(id);
      const base = {
        id,
        title: item.title,
        lessonId: String(lesson._id),
        lessonName: lesson.name,
        deadline,
        flag,
      } as const;
      if (sub) {
        // AC-1.4: an item worth 0 points is left out entirely.
        if (sub.maxScore <= 0) continue;
        events.push({ at: sub.at, itemId: id, reason: 'Điểm mới' });
        if (sub.regradedAt)
          events.push({ at: sub.regradedAt, itemId: id, reason: 'Điều chỉnh điểm' });
        rows.push({
          ...base,
          status: 'done',
          late: !!end && sub.at > end,
          got: sub.score,
          max: sub.maxScore,
          points: itemPoints(sub.score, sub.maxScore),
          counted: true,
        });
        continue;
      }
      // AC-1.11: no deadline and no submission — not part of the score, not listed.
      if (!end) continue;
      const passed = end <= c.now;
      // AC-4.2, AC-4.6: unsubmitted sets of a hidden section or archived stop counting (the GV still sees them).
      const zero = visible && passed && zeroApplies(s.member, end);
      if (zero) events.push({ at: end, itemId: id, reason: 'Quá hạn' });
      rows.push({
        ...base,
        status: zero || (!visible && passed) ? 'overdue' : 'todo',
        late: false,
        got: null,
        max: null,
        points: zero ? 0 : null,
        counted: zero,
      });
    }
  }
  return rows;
}

function examRows(c: ClassInputs, s: StudentInputs, events: ScoreEvent[]): ExamScoreRow[] {
  const byOpen = [...c.exams].sort(
    (a, b) =>
      (a.opensAt?.getTime() ?? Infinity) - (b.opensAt?.getTime() ?? Infinity) ||
      a.name.localeCompare(b.name, 'vi'),
  );
  const rows: ExamScoreRow[] = [];
  for (const exam of byOpen) {
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
      events.push({ at: sub.at, itemId: exam.id, reason: 'Điểm mới' });
      rows.push({
        ...base,
        status: 'done',
        got: sub.score,
        max: sub.maxScore,
        points: itemPoints(sub.score, sub.maxScore),
        counted: true,
      });
      continue;
    }
    const closed = !!exam.closesAt && exam.closesAt <= c.now;
    const noShow = s.noShows.has(exam.id);
    const zero = noShow && !exam.archived;
    if (zero && exam.closesAt)
      events.push({ at: exam.closesAt, itemId: exam.id, reason: 'Quá hạn' });
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

/** GV actions on the class that may change scores without an item time of their own (AC-6.6, REQ-4). */
function classEvents(c: ClassInputs): ScoreEvent[] {
  return [
    ...c.cls.hidden
      .filter((h) => h.section === 'exercise')
      .map((h) => ({ at: h.at, itemId: String(h.lessonId), reason: 'Thay đổi nội dung' as const })),
    ...c.cls.deadlines.map((d) => ({
      at: d.at,
      itemId: String(d.setId),
      reason: 'Thay đổi nội dung' as const,
    })),
  ];
}

/** REQ-1 … REQ-5 for one HV of the class. */
export function scoreStudent(c: ClassInputs, s: StudentInputs): StudentScore {
  const events: ScoreEvent[] = classEvents(c);
  const sets = setRows(c, s, events);
  const exams = examRows(c, s, events);
  const setPoints = sets.filter((r) => r.counted).map((r) => r.points ?? 0);
  const examPoints = exams.filter((r) => r.counted).map((r) => r.points ?? 0);
  const avgEx = average(setPoints);
  const avgExam = average(examPoints);
  const open = sets.filter((r) => !r.flag && r.deadline);
  const lastEvent = events
    .filter((e) => e.at <= c.now)
    .reduce<ScoreEvent | null>((best, e) => (!best || e.at > best.at ? e : best), null);
  return {
    breakdown: {
      score: rankingScore(avgEx, avgExam),
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

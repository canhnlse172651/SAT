import type { Progress, Section } from '@sat/shared';
import type { Types } from 'mongoose';
import type { ItemDoc, LessonDoc } from '../curriculum/curriculum.model.js';
import type { ClassDoc } from './classes.model.js';

/*
 * REQ-17 / REQ-22: what an HV of one class sees of the class's curriculum. Every HV read and the reminder sweep go
 * through these rules, so S02, S11, item access, progress and e-mails always agree (AC-13.6).
 */

type ClassRules = Pick<ClassDoc, 'hidden' | 'deadlines'>;
const same = (a: Types.ObjectId, b: Types.ObjectId | string) => String(a) === String(b);

export const isHidden = (c: ClassRules, lessonId: Types.ObjectId | string, section: Section) =>
  c.hidden.some((h) => same(h.lessonId, lessonId) && h.section === section);

export const deadlineOf = (c: ClassRules, setId: Types.ObjectId | string): string | null =>
  c.deadlines.find((d) => same(d.setId, setId))?.date ?? null;

/** A Bài as an HV of the class sees it: published, not both sections hidden; published items of shown sections. */
export interface VisibleUnit {
  lesson: LessonDoc;
  steps: ItemDoc[];
  sets: ItemDoc[];
}

/** AC-17.1, AC-17.2, AC-17.4 (archived and draft items are absent; a hidden section leaves no trace). */
export function visibleUnit(c: ClassRules, lesson: LessonDoc): VisibleUnit | null {
  if (lesson.status !== 'published') return null;
  const hideSteps = isHidden(c, lesson._id, 'lesson');
  const hideSets = isHidden(c, lesson._id, 'exercise');
  if (hideSteps && hideSets) return null;
  const pick = (section: Section) =>
    lesson.items.filter((i) => i.section === section && i.status === 'published');
  return {
    lesson,
    steps: hideSteps ? [] : pick('lesson'),
    sets: hideSets ? [] : pick('exercise'),
  };
}

export const visibleUnits = (c: ClassRules, lessons: readonly LessonDoc[]): VisibleUnit[] =>
  lessons.map((l) => visibleUnit(c, l)).filter((u): u is VisibleUnit => !!u);

/** AC-22.5: a deadline counts only while its set is visible to the class's HV. */
export const effectiveDeadline = (
  c: ClassRules,
  unit: VisibleUnit | null,
  setId: Types.ObjectId | string,
): string | null => (unit?.sets.some((s) => same(s._id, setId)) ? deadlineOf(c, setId) : null);

export type UnitLabel = 'noExercise' | 'noContent' | 'closed' | null;

/**
 * Progress of a Bài with 009's definition (done / visible sets that are open — have an effective deadline) or the
 * label that replaces it (AC-13.3, AC-13.4, AC-13.7).
 */
export function unitProgress(
  c: ClassRules,
  unit: VisibleUnit,
  submitted: ReadonlySet<string>,
): { progress: Progress | null; label: UnitLabel } {
  if (!unit.sets.length)
    return { progress: null, label: unit.steps.length ? 'noExercise' : 'noContent' };
  const open = unit.sets.filter((s) => deadlineOf(c, s._id));
  if (!open.length) return { progress: null, label: 'closed' };
  return {
    progress: { done: open.filter((s) => submitted.has(String(s._id))).length, total: open.length },
    label: null,
  };
}

/** The class total of `unitProgress` (S01, S02). */
export function classProgress(
  c: ClassRules,
  units: readonly VisibleUnit[],
  submitted: ReadonlySet<string>,
): Progress {
  return units.reduce(
    (sum, u) => {
      const p = unitProgress(c, u, submitted).progress;
      return p ? { done: sum.done + p.done, total: sum.total + p.total } : sum;
    },
    { done: 0, total: 0 },
  );
}

/** Number of questions of a set (interim 005 content shape of 002). */
export const questionCount = (item: ItemDoc): number =>
  Array.isArray((item.content as { questions?: unknown[] } | null)?.questions)
    ? (item.content as { questions: unknown[] }).questions.length
    : 0;

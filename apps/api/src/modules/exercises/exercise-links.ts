import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { scoped } from '../../common/tenancy/scoped.js';
import type { ClassLearning, LearningRecord } from '../classes/classes.ports.js';
import { LESSON_MODEL, type LessonDoc } from '../curriculum/curriculum.model.js';
import type { LearningData } from '../curriculum/curriculum.ports.js';
import type { StepPractice } from '../steps/steps.ports.js';
import { ATTEMPT_MODEL, type AttemptDoc } from './exercises.model.js';
import { logExercise } from './exercises.log.js';

const oids = (ids: readonly string[]) =>
  ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

/**
 * What other modules read from 005: learning data of sets (002 `LEARNING_DATA`), attempts and submissions per class
 * (003 `CLASS_LEARNING`, which 001's `STUDENT_LINKS` also uses) and the "Bước học liên kết" of sets (004
 * `STEP_PRACTICE`, stored as `content.stepId` of the set).
 */
@Injectable()
export class ExerciseLinks implements LearningData, ClassLearning, StepPractice {
  constructor(
    @InjectModel(ATTEMPT_MODEL) private readonly attempts: Model<AttemptDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
  ) {}

  /* ---------- 002: a set with an attempt or a submission is never deleted (AC-22.2) ---------- */

  async setsWithData(workspaceId: string, itemIds: readonly string[]) {
    if (!itemIds.length) return new Set<string>();
    const ids = await scoped(this.attempts, workspaceId)
      .find({ setId: { $in: oids(itemIds) } })
      .distinct('setId');
    return new Set(ids.map(String));
  }

  /* ---------- 003: attempts in progress and the one submission (AC-17.6) ---------- */

  async records(
    workspaceId: string,
    classId: string,
    filter: { studentIds?: readonly string[]; setIds?: readonly string[] } = {},
  ): Promise<LearningRecord[]> {
    if (!Types.ObjectId.isValid(classId)) return [];
    const rows = await scoped(this.attempts, workspaceId)
      .find({
        classId: new Types.ObjectId(classId),
        ...(filter.studentIds ? { studentId: { $in: oids(filter.studentIds) } } : {}),
        ...(filter.setIds ? { setId: { $in: oids(filter.setIds) } } : {}),
      })
      .select({
        studentId: 1,
        setId: 1,
        status: 1,
        submittedAt: 1,
        score: 1,
        maxScore: 1,
        regrades: 1,
      })
      .lean<AttemptDoc[]>();
    return rows.map((r) => ({
      studentId: String(r.studentId),
      setId: String(r.setId),
      inProgress: r.status === 'doing',
      submission:
        r.status === 'submitted' && r.submittedAt
          ? {
              score: r.score ?? 0,
              maxScore: r.maxScore ?? 0,
              at: r.submittedAt,
              regradedAt: r.regrades?.at(-1)?.at ?? null,
            }
          : null,
    }));
  }

  async classesWithSubmissions(workspaceId: string, classIds: readonly string[]) {
    if (!classIds.length) return new Set<string>();
    const ids = await scoped(this.attempts, workspaceId)
      .find({ classId: { $in: oids(classIds) }, status: 'submitted' })
      .distinct('classId');
    return new Set(ids.map(String));
  }

  async studentHasSubmissions(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return false;
    return !!(await scoped(this.attempts, workspaceId).exists({
      studentId: new Types.ObjectId(studentId),
      status: 'submitted',
    }));
  }

  async purgeStudent(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return;
    const r = await scoped(this.attempts, workspaceId).deleteMany({
      studentId: new Types.ObjectId(studentId),
    });
    if (r.deletedCount) logExercise({ action: 'attempt.purge', count: r.deletedCount });
  }

  /* ---------- 004: sets linked to steps (AC-1.3, AC-1.4) ---------- */

  async setsOf(workspaceId: string, stepIds: readonly string[]) {
    const out = new Map<string, string[]>();
    if (!stepIds.length) return out;
    const wanted = new Set(stepIds);
    const docs = await scoped(this.lessons, workspaceId)
      .find({ 'items.content.stepId': { $in: [...wanted] } })
      .select({ items: 1 })
      .lean<Pick<LessonDoc, 'items'>[]>();
    for (const item of docs.flatMap((d) => d.items)) {
      const stepId = (item.content as { stepId?: unknown } | null)?.stepId;
      if (item.section !== 'exercise' || typeof stepId !== 'string' || !wanted.has(stepId))
        continue;
      out.set(stepId, [...(out.get(stepId) ?? []), String(item._id)]);
    }
    return out;
  }

  /** AC-1.4: sets linked to deleted steps become "Không liên kết" (any status, archived included). */
  async unlink(workspaceId: string, stepIds: readonly string[]) {
    if (!stepIds.length) return;
    await scoped(this.lessons, workspaceId).updateMany(
      { 'items.content.stepId': { $in: [...stepIds] } },
      { $set: { 'items.$[set].content.stepId': null } },
      {
        arrayFilters: [{ 'set.section': 'exercise', 'set.content.stepId': { $in: [...stepIds] } }],
      },
    );
  }
}

/* ---------- outside production the 002–004 QA stand-ins still count next to real data ---------- */

export const mergedLearningData = (real: LearningData, dev: LearningData): LearningData => ({
  async setsWithData(workspaceId, itemIds) {
    const [a, b] = await Promise.all([
      real.setsWithData(workspaceId, itemIds),
      dev.setsWithData(workspaceId, itemIds),
    ]);
    return new Set([...a, ...b]);
  },
});

export const mergedClassLearning = (real: ClassLearning, dev: ClassLearning): ClassLearning => ({
  async records(workspaceId, classId, filter) {
    const [a, b] = await Promise.all([
      real.records(workspaceId, classId, filter),
      dev.records(workspaceId, classId, filter),
    ]);
    return [...a, ...b];
  },
  async classesWithSubmissions(workspaceId, classIds) {
    const [a, b] = await Promise.all([
      real.classesWithSubmissions(workspaceId, classIds),
      dev.classesWithSubmissions(workspaceId, classIds),
    ]);
    return new Set([...a, ...b]);
  },
  async studentHasSubmissions(workspaceId, studentId) {
    const [a, b] = await Promise.all([
      real.studentHasSubmissions(workspaceId, studentId),
      dev.studentHasSubmissions(workspaceId, studentId),
    ]);
    return a || b;
  },
  async purgeStudent(workspaceId, studentId) {
    await Promise.all([
      real.purgeStudent(workspaceId, studentId),
      dev.purgeStudent(workspaceId, studentId),
    ]);
  },
});

export const mergedStepPractice = (real: StepPractice, dev: StepPractice): StepPractice => ({
  async setsOf(workspaceId, stepIds) {
    const [a, b] = await Promise.all([
      real.setsOf(workspaceId, stepIds),
      dev.setsOf(workspaceId, stepIds),
    ]);
    const out = new Map(a);
    for (const [step, sets] of b) out.set(step, [...new Set([...(out.get(step) ?? []), ...sets])]);
    return out;
  },
  async unlink(workspaceId, stepIds) {
    await Promise.all([real.unlink(workspaceId, stepIds), dev.unlink(workspaceId, stepIds)]);
  },
});

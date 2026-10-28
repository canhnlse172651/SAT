import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { scoped } from '../../common/tenancy/scoped.js';
import { MEMBER_MODEL, type MemberDoc } from '../classes/classes.model.js';
import type { ClassExams } from '../classes/classes.ports.js';
import {
  EXAM_ATTEMPT_MODEL,
  EXAM_MODEL,
  EXAM_NOSHOW_MODEL,
  type ExamAttemptDoc,
  type ExamDoc,
  type ExamNoShowDoc,
} from './exams.model.js';
import { logExam } from './exams.log.js';

const oids = (ids: readonly string[]) =>
  ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

/**
 * What 003 reads from 006 (`CLASS_EXAMS`, also behind 001's `STUDENT_LINKS`): exam submissions of a class (003 AC-11.3),
 * exams an HV of the class sees (003 AC-13.8), removing a deleted class from its exams (003 AC-11.5) and a deleted
 * student's attempts in progress.
 */
@Injectable()
export class ExamLinks implements ClassExams {
  constructor(
    @InjectModel(EXAM_MODEL) private readonly exams: Model<ExamDoc>,
    @InjectModel(EXAM_ATTEMPT_MODEL) private readonly attempts: Model<ExamAttemptDoc>,
    @InjectModel(EXAM_NOSHOW_MODEL) private readonly noShows: Model<ExamNoShowDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
  ) {}

  /** A class "has submissions" when a member (removed ones included) submitted an exam assigned to it. */
  async classesWithSubmissions(workspaceId: string, classIds: readonly string[]) {
    const out = new Set<string>();
    const ids = oids(classIds);
    if (!ids.length) return out;
    const exams = await scoped(this.exams, workspaceId)
      .find({ classIds: { $in: ids }, phase: { $ne: 'deleted' } })
      .select({ classIds: 1 })
      .lean<Pick<ExamDoc, '_id' | 'classIds'>[]>();
    if (!exams.length) return out;
    const done = await scoped(this.attempts, workspaceId)
      .find({ examId: { $in: exams.map((e) => e._id) }, status: 'submitted' })
      .select({ examId: 1, studentId: 1 })
      .lean<Pick<ExamAttemptDoc, 'examId' | 'studentId'>[]>();
    if (!done.length) return out;
    const rows = await scoped(this.members, workspaceId)
      .find({ classId: { $in: ids }, studentId: { $in: done.map((a) => a.studentId) } })
      .select({ classId: 1, studentId: 1 })
      .lean<Pick<MemberDoc, 'classId' | 'studentId'>[]>();
    const submitters = new Map<string, Set<string>>();
    for (const a of done) {
      const set = submitters.get(String(a.examId)) ?? new Set<string>();
      set.add(String(a.studentId));
      submitters.set(String(a.examId), set);
    }
    for (const m of rows)
      for (const e of exams)
        if (
          e.classIds.some((c) => c.equals(m.classId)) &&
          submitters.get(String(e._id))?.has(String(m.studentId))
        )
          out.add(String(m.classId));
    return out;
  }

  /** 006 AC-7.1: exams of the class its HV can see (scheduled, open or closed; not draft, archived or deleted). */
  visibleCount(workspaceId: string, classId: string) {
    if (!Types.ObjectId.isValid(classId)) return Promise.resolve(0);
    return scoped(this.exams, workspaceId).count({
      classIds: new Types.ObjectId(classId),
      phase: 'scheduled',
    });
  }

  async studentHasSubmissions(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return false;
    return !!(await scoped(this.attempts, workspaceId).exists({
      studentId: new Types.ObjectId(studentId),
      status: 'submitted',
    }));
  }

  /** 006 §10 (003 confirmation 2): a deleted class (never with submissions) leaves the exams it was assigned to. */
  async removeClass(workspaceId: string, classId: string) {
    if (!Types.ObjectId.isValid(classId)) return;
    const id = new Types.ObjectId(classId);
    const r = await scoped(this.exams, workspaceId).updateMany(
      { classIds: id },
      { $pull: { classIds: id }, $inc: { version: 1 } },
    );
    await scoped(this.noShows, workspaceId).deleteMany({ classId: id });
    if (r.modifiedCount) logExam({ action: 'exam.class.removed', classId, count: r.modifiedCount });
  }

  /** 001 AC-13.2: a student is deleted only without submissions; attempts in progress and results go with them. */
  async purgeStudent(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return;
    const sid = new Types.ObjectId(studentId);
    const r = await scoped(this.attempts, workspaceId).deleteMany({ studentId: sid });
    await scoped(this.noShows, workspaceId).deleteMany({ studentId: sid });
    if (r.deletedCount) logExam({ action: 'exam.attempt.purge', count: r.deletedCount });
  }
}

/** Outside production 003's QA stand-in (`dev_class_links` exams) still counts next to real exams. */
export const mergedClassExams = (real: ClassExams, dev: ClassExams): ClassExams => ({
  async classesWithSubmissions(workspaceId, classIds) {
    const [a, b] = await Promise.all([
      real.classesWithSubmissions(workspaceId, classIds),
      dev.classesWithSubmissions(workspaceId, classIds),
    ]);
    return new Set([...a, ...b]);
  },
  async visibleCount(workspaceId, classId) {
    const [a, b] = await Promise.all([
      real.visibleCount(workspaceId, classId),
      dev.visibleCount(workspaceId, classId),
    ]);
    return a + b;
  },
  async studentHasSubmissions(workspaceId, studentId) {
    const [a, b] = await Promise.all([
      real.studentHasSubmissions(workspaceId, studentId),
      dev.studentHasSubmissions(workspaceId, studentId),
    ]);
    return a || b;
  },
  async removeClass(workspaceId, classId) {
    await Promise.all([
      real.removeClass(workspaceId, classId),
      dev.removeClass(workspaceId, classId),
    ]);
  },
  async purgeStudent(workspaceId, studentId) {
    await Promise.all([
      real.purgeStudent(workspaceId, studentId),
      dev.purgeStudent(workspaceId, studentId),
    ]);
  },
});

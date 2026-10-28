import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { UsingClass } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { scoped } from '../../common/tenancy/scoped.js';
import type { StudentLinks } from '../accounts/student-links.js';
import type { CurriculumClasses } from '../curriculum/curriculum.ports.js';
import { statusOf, todayOf } from './class-status.js';
import { CLASS_MODEL, type ClassDoc, MEMBER_MODEL, type MemberDoc } from './classes.model.js';
import { logClass } from './classes.log.js';
import {
  CLASS_EXAMS,
  CLASS_LEARNING,
  type ClassExams,
  type ClassLearning,
} from './classes.ports.js';

const oids = (ids: readonly string[]) =>
  ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

/** 002's `CURRICULUM_CLASSES`: the classes using a curriculum and the curricula an HV studies (002 REQ-10). */
@Injectable()
export class ClassCurriculumLinks implements CurriculumClasses {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async usage(workspaceId: string, curriculumIds: readonly string[]) {
    const out = new Map<string, UsingClass[]>(curriculumIds.map((id) => [id, []]));
    const today = todayOf(this.clock);
    const docs = await scoped(this.classes, workspaceId)
      .find({ curriculumId: { $in: oids(curriculumIds) } })
      .sort({ startDate: 1, _id: 1 })
      .lean<ClassDoc[]>();
    for (const c of docs)
      out.get(String(c.curriculumId))?.push({
        id: String(c._id),
        name: c.name,
        status: statusOf(c, today),
        startDate: c.startDate,
      });
    return out;
  }

  /** Curricula of the classes the HV is in that have started (nothing opens before the start day — AC-14.3). */
  async curriculaOfStudent(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return [];
    const rows = await scoped(this.members, workspaceId)
      .find({ studentId: new Types.ObjectId(studentId), removedAt: null })
      .lean<MemberDoc[]>();
    const today = todayOf(this.clock);
    const docs = await scoped(this.classes, workspaceId)
      .find({ _id: { $in: rows.map((r) => r.classId) } })
      .lean<ClassDoc[]>();
    return [
      ...new Set(
        docs.filter((c) => statusOf(c, today) !== 'upcoming').map((c) => String(c.curriculumId)),
      ),
    ];
  }
}

/** Outside production 002's QA stand-in classes (`/api/dev/curriculum/classes`) still count next to real ones. */
export const mergedCurriculumClasses = (
  real: CurriculumClasses,
  dev: CurriculumClasses,
): CurriculumClasses => ({
  async usage(workspaceId, curriculumIds) {
    const [a, b] = await Promise.all([
      real.usage(workspaceId, curriculumIds),
      dev.usage(workspaceId, curriculumIds),
    ]);
    return new Map(curriculumIds.map((id) => [id, [...(a.get(id) ?? []), ...(b.get(id) ?? [])]]));
  },
  async curriculaOfStudent(workspaceId, studentId) {
    const [a, b] = await Promise.all([
      real.curriculaOfStudent(workspaceId, studentId),
      dev.curriculaOfStudent(workspaceId, studentId),
    ]);
    return [...new Set([...a, ...b])];
  },
});

/** 001's `STUDENT_LINKS`: class counts, submissions (005 / 006) and removal from classes on delete (001 AC-13.2). */
@Injectable()
export class ClassStudentLinks implements StudentLinks {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    @Inject(CLASS_EXAMS) private readonly exams: ClassExams,
  ) {}

  async classCounts(workspaceId: string, studentIds: readonly string[]) {
    const rows = (await scoped(this.members, workspaceId).aggregate([
      { $match: { studentId: { $in: oids(studentIds) }, removedAt: null } },
      { $group: { _id: '$studentId', n: { $sum: 1 } } },
    ])) as { _id: Types.ObjectId; n: number }[];
    return new Map(rows.map((r) => [String(r._id), r.n]));
  }

  async hasSubmissions(workspaceId: string, studentId: string) {
    const [a, b] = await Promise.all([
      this.learning.studentHasSubmissions(workspaceId, studentId),
      this.exams.studentHasSubmissions(workspaceId, studentId),
    ]);
    return a || b;
  }

  /** A deleted student leaves every class at once, freeing the seat (edge case "HV bị xóa"). */
  async onStudentDeleted(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return;
    const sid = new Types.ObjectId(studentId);
    const scope = scoped(this.members, workspaceId);
    const active = await scope.find({ studentId: sid, removedAt: null }).lean<MemberDoc[]>();
    await scope.deleteMany({ studentId: sid });
    await this.learning.purgeStudent(workspaceId, studentId);
    if (active.length)
      await scoped(this.classes, workspaceId).updateMany(
        { _id: { $in: active.map((m) => m.classId) }, memberCount: { $gt: 0 } },
        { $inc: { memberCount: -1 } },
      );
    logClass({ action: 'class.students.purge', classes: active.length });
  }
}

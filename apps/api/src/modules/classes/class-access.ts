import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CLASS_ERROR_CODES as E,
  CLASS_MESSAGES as M,
  type ClassStatus,
  upcomingMessage,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { CurriculumReader } from '../curriculum/curriculum-reader.js';
import type { ItemDoc, LessonDoc } from '../curriculum/curriculum.model.js';
import { HV_PATHS } from './class-common.js';
import { statusOf, todayOf } from './class-status.js';
import { CURRICULUM_CLASSES, type CurriculumClasses } from '../curriculum/curriculum.ports.js';
import { effectiveDeadline, isHidden, type VisibleUnit, visibleUnit } from './class-visibility.js';
import { CLASS_MODEL, type ClassDoc, MEMBER_MODEL, type MemberDoc } from './classes.model.js';
import { CLASS_LEARNING, type ClassLearning } from './classes.ports.js';

export interface ClassView {
  cls: ClassDoc;
  member: MemberDoc;
  today: string;
  status: ClassStatus;
}

export interface ItemInClass extends ClassView {
  lesson: LessonDoc;
  item: ItemDoc;
  /** null when the Bài is not visible to the class's HV. */
  unit: VisibleUnit | null;
  visible: boolean;
}

/** AC-14.5, AC-20.7: not a member (removed, other class, deleted class) — one answer, back to S01. */
export const notMember = (): AppError =>
  new AppError(404, E.CLASS_NOT_MEMBER, M.notMember, { back: HV_PATHS.s01 });

/** AC-14.3: nothing of an upcoming class opens, direct links included. */
export const notStarted = (c: ClassDoc): AppError =>
  new AppError(409, E.CLASS_NOT_STARTED, upcomingMessage(c.startDate), {
    back: HV_PATHS.s02(String(c._id)),
  });

/**
 * The HV side of a class: membership, status and what a member may open or work on (REQ-14, REQ-17, REQ-18).
 * Exported so 004 (S03/S04) and 005 (S05/S06) apply exactly the same rules.
 */
@Injectable()
export class ClassAccess {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    @Inject(CURRICULUM_CLASSES) private readonly usage: CurriculumClasses,
    private readonly curricula: CurriculumReader,
  ) {}

  /**
   * 004 AC-7.4: classes that are not ended, use the curriculum and do not hide the Bài học section of the Bài — real
   * classes plus 002's dev stand-in classes (which have no hidden sections).
   */
  async stepsAudience(
    workspaceId: string,
    curriculumId: string,
    lessonId: string,
  ): Promise<number> {
    const using = (await this.usage.usage(workspaceId, [curriculumId])).get(curriculumId) ?? [];
    const open = using.filter((u) => u.status !== 'ended');
    if (!open.length) return 0;
    const real = await scoped(this.classes, workspaceId)
      .find({ _id: { $in: open.map((u) => u.id).filter((id) => Types.ObjectId.isValid(id)) } })
      .lean<ClassDoc[]>();
    const hidden = new Set(
      real.filter((c) => isHidden(c, lessonId, 'lesson')).map((c) => String(c._id)),
    );
    return open.filter((u) => !hidden.has(u.id)).length;
  }

  /** The class of an active membership of the caller, else `notMember` (malformed ids included). */
  async view(p: AuthPrincipal, classId: string): Promise<ClassView> {
    if (!Types.ObjectId.isValid(classId)) throw notMember();
    const [cls, member] = await Promise.all([
      scoped(this.classes, p.workspaceId).findById(classId).lean<ClassDoc>(),
      scoped(this.members, p.workspaceId)
        .findOne({
          classId: new Types.ObjectId(classId),
          studentId: new Types.ObjectId(p.userId),
          removedAt: null,
        })
        .lean<MemberDoc>(),
    ]);
    if (!cls || !member) throw notMember();
    const today = todayOf(this.clock);
    return { cls, member, today, status: statusOf(cls, today) };
  }

  /** `view` of a class that has started (AC-14.3). */
  async started(p: AuthPrincipal, classId: string): Promise<ClassView> {
    const v = await this.view(p, classId);
    if (v.status === 'upcoming') throw notStarted(v.cls);
    return v;
  }

  lessons(workspaceId: string, cls: ClassDoc): Promise<LessonDoc[]> {
    return this.curricula.lessons(workspaceId, cls.curriculumId);
  }

  /** A step or set of the class's curriculum, with whether the class's HV may see it (AC-17.1). */
  async item(p: AuthPrincipal, classId: string, itemId: string): Promise<ItemInClass | null> {
    const v = await this.started(p, classId);
    if (!Types.ObjectId.isValid(itemId)) return null;
    for (const lesson of await this.lessons(p.workspaceId, v.cls)) {
      const item = lesson.items.find((i) => String(i._id) === itemId);
      if (!item) continue;
      const unit = visibleUnit(v.cls, lesson);
      const visible = !!unit && [...unit.steps, ...unit.sets].some((i) => i._id.equals(item._id));
      return { ...v, lesson, item, unit, visible };
    }
    return null;
  }

  /** Where a refused HV goes: the Bài if it is still visible, else the class page (AC-18.1, AC-18.2). */
  backOf(found: Pick<ItemInClass, 'cls' | 'lesson' | 'unit'>): string {
    return found.unit
      ? HV_PATHS.s11(String(found.cls._id), String(found.lesson._id))
      : HV_PATHS.s02(String(found.cls._id));
  }

  /**
   * AC-10.5, AC-14.4, AC-18.2, AC-23.4, AC-19.9: whether the caller may save or submit an attempt of the set now —
   * the gate 005 calls before every save / submit. Returns the effective deadline (late after it).
   */
  async assertCanWork(
    p: AuthPrincipal,
    classId: string,
    setId: string,
  ): Promise<{ cls: ClassDoc; deadline: string }> {
    const found = await this.item(p, classId, setId);
    if (!found || found.item.section !== 'exercise')
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy nội dung bạn yêu cầu.', {
        back: HV_PATHS.s02(classId),
      });
    if (found.status === 'ended') throw new AppError(409, E.CLASS_ENDED, M.classEndedWork);
    if (!found.visible)
      throw new AppError(409, E.WORK_UNAVAILABLE, M.workUnavailable, { back: this.backOf(found) });
    const [record] = await this.learning.records(p.workspaceId, classId, {
      studentIds: [p.userId],
      setIds: [setId],
    });
    if (record?.submission)
      throw new AppError(409, 'CONFLICT', 'Bạn đã nộp bộ bài tập này.', {
        back: this.backOf(found),
      });
    const deadline = effectiveDeadline(found.cls, found.unit, setId);
    if (!deadline)
      throw new AppError(409, E.WORK_UNAVAILABLE, M.setClosedWork, { back: this.backOf(found) });
    return { cls: found.cls, deadline };
  }
}

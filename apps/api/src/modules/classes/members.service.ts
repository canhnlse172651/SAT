import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CLASS_ERROR_CODES as E,
  CLASS_LIMITS,
  type ClassMember,
  seatsLeftMessage,
  studentsRemovedMessage,
  vnDayStart,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { StudentDirectory, type StudentInfo } from '../accounts/student-directory.js';
import { assertNotEnded, isDuplicateKey, loadClass } from './class-common.js';
import { todayOf } from './class-status.js';
import { CLASS_MODEL, type ClassDoc, MEMBER_MODEL, type MemberDoc } from './classes.model.js';
import { logClass } from './classes.log.js';

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));
const byName = (a: { displayName: string }, b: { displayName: string }) =>
  a.displayName.localeCompare(b.displayName, 'vi');

/** Students count as activated for tracking and the members list once they could sign in (AC-8.9, AC-20.3). */
export const isActivated = (s: Pick<StudentInfo, 'status'>): boolean =>
  s.status === 'active' || s.status === 'locked';

export interface RosterRow {
  member: MemberDoc;
  student: StudentInfo;
}

/** REQ-8: the members of a class (T04 tab Học viên). */
@Injectable()
export class MembersService {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly students: StudentDirectory,
  ) {}

  /** Active memberships of a class with the students' account data, A→Z. */
  async roster(workspaceId: string, classId: Types.ObjectId | string): Promise<RosterRow[]> {
    const rows = await scoped(this.members, workspaceId)
      .find({ classId: oid(classId), removedAt: null })
      .lean<MemberDoc[]>();
    const info = new Map(
      (
        await this.students.byIds(
          workspaceId,
          rows.map((r) => String(r.studentId)),
        )
      ).map((s) => [s.id, s]),
    );
    return rows
      .map((member) => ({ member, student: info.get(String(member.studentId)) }))
      .filter((r): r is RosterRow => !!r.student)
      .sort((a, b) => byName(a.student, b.student));
  }

  /** AC-8.1, AC-8.7 */
  async list(
    p: AuthPrincipal,
    classId: string,
  ): Promise<{ items: ClassMember[]; memberCount: number }> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    const roster = await this.roster(p.workspaceId, c._id);
    return {
      items: roster.map(({ member, student }) => ({
        id: student.id,
        displayName: student.displayName,
        email: student.email,
        status: student.status,
        joinedAt: member.joinedAt,
        avatarUrl: null,
      })),
      memberCount: c.memberCount,
    };
  }

  /** AC-8.9: who the Tiến độ (009) and Xếp hạng (008) tabs list — activated members, locked ones included. */
  async tracked(
    p: AuthPrincipal,
    classId: string,
  ): Promise<{ items: { id: string; displayName: string }[] }> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    const roster = await this.roster(p.workspaceId, c._id);
    return {
      items: roster
        .filter((r) => isActivated(r.student))
        .map((r) => ({ id: r.student.id, displayName: r.student.displayName })),
    };
  }

  /**
   * AC-8.3, AC-8.4: all or nothing within the 100 cap, even under concurrent adds — seats are reserved with a guarded
   * `$inc` first, then the memberships written; seats of students someone else added meanwhile are given back.
   */
  async add(
    p: AuthPrincipal,
    classId: string,
    studentIds: readonly string[],
  ): Promise<{ added: number; memberCount: number }> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    const today = todayOf(this.clock);
    assertNotEnded(c, today);
    const ids = [...new Set(studentIds)];
    const found = await this.students.byIds(p.workspaceId, ids);
    if (found.length < ids.length) {
      const have = new Set(found.map((s) => s.id));
      const missing = ids.filter((id) => !have.has(id));
      if (await this.students.anyElsewhere(p.workspaceId, missing)) throw notFound();
      throw new AppError(409, E.STUDENTS_MISSING, studentsRemovedMessage(missing.length), {
        missingIds: missing,
      });
    }
    const memberScope = scoped(this.members, p.workspaceId);
    const already = new Set(
      (
        await memberScope
          .find({ classId: c._id, removedAt: null, studentId: { $in: ids.map(oid) } })
          .select({ studentId: 1 })
          .lean<MemberDoc[]>()
      ).map((m) => String(m.studentId)),
    );
    const toAdd = ids.filter((id) => !already.has(id));
    if (!toAdd.length) return { added: 0, memberCount: c.memberCount };

    const classScope = scoped(this.classes, p.workspaceId);
    const reserved = await classScope
      .findOneAndUpdate(
        { _id: c._id, memberCount: { $lte: CLASS_LIMITS.maxStudents - toAdd.length } },
        { $inc: { memberCount: toAdd.length } },
        { returnDocument: 'after' },
      )
      .lean<ClassDoc>();
    if (!reserved) {
      const now = await classScope.findById(c._id).lean<ClassDoc>();
      const left = Math.max(0, CLASS_LIMITS.maxStudents - (now?.memberCount ?? c.memberCount));
      logClass({ action: 'class.students.add', result: 'denied', actorId: p.userId, classId });
      throw new AppError(409, E.CLASS_FULL, seatsLeftMessage(left), { left });
    }

    let added = 0;
    const addedAt = this.clock.now();
    for (const studentId of toAdd) {
      const back = await memberScope.updateOne(
        { classId: c._id, studentId: oid(studentId), removedAt: { $ne: null } },
        { $set: { removedAt: null, joinedAt: today, addedAt } },
      );
      if (back.modifiedCount) {
        added++;
        continue;
      }
      try {
        await memberScope.create({
          classId: c._id,
          studentId: oid(studentId),
          joinedAt: today,
          addedAt,
          removedAt: null,
        });
        added++;
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
      }
    }
    let memberCount = reserved.memberCount;
    if (added < toAdd.length) {
      const fixed = await classScope
        .findOneAndUpdate(
          { _id: c._id },
          { $inc: { memberCount: added - toAdd.length } },
          { returnDocument: 'after' },
        )
        .lean<ClassDoc>();
      memberCount = fixed?.memberCount ?? memberCount;
    }
    logClass({ action: 'class.students.add', actorId: p.userId, classId, students: added });
    return { added, memberCount };
  }

  /** AC-8.5, AC-8.6: the membership row is kept (with `removedAt`) so a re-added HV gets their data back. */
  async remove(p: AuthPrincipal, classId: string, studentId: string): Promise<void> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    assertNotEnded(c, todayOf(this.clock));
    if (!Types.ObjectId.isValid(studentId)) throw notFound();
    const scope = scoped(this.members, p.workspaceId);
    const filter = { classId: c._id, studentId: oid(studentId), removedAt: null };
    const member = await scope.findOne(filter).lean<MemberDoc>();
    if (!member) throw notFound();
    const now = this.clock.now();
    const res = await scope.updateOne(filter, {
      $set: { removedAt: now },
      // 008 AC-5.2: the period just ended, so a missed deadline inside it still counts after a re-add.
      $push: { history: { from: member.addedAt ?? vnDayStart(member.joinedAt), to: now } },
    });
    if (!res.modifiedCount) throw notFound();
    await scoped(this.classes, p.workspaceId).updateOne(
      { _id: c._id, memberCount: { $gt: 0 } },
      { $inc: { memberCount: -1 } },
    );
    logClass({ action: 'class.students.remove', actorId: p.userId, classId, students: 1 });
  }
}

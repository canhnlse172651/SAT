import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { type Connection, Types } from 'mongoose';

/*
 * What 003 needs from modules that do not exist yet. Each module re-binds its token when it ships:
 * - 005 Bài tập: attempts in progress and the one submission (score, time) per HV, set and class (AC-9.3, AC-11.3,
 *   AC-16.3, AC-19.3, AC-24.2);
 * - 006 Bài thi: exam submissions of a class (AC-11.3), exams an HV of the class sees (AC-13.8), removing a deleted
 *   class from its exams (AC-11.5).
 */

export interface LearningRecord {
  studentId: string;
  setId: string;
  /** An attempt with saved answers and no submission. */
  inProgress: boolean;
  /** `regradedAt`: the last re-grade after an answer-key change (008 AC-3.3). */
  submission: { score: number; maxScore: number; at: Date; regradedAt?: Date | null } | null;
}

export interface ClassLearning {
  /** Records of a class, optionally limited to some students / sets (removed students included). */
  records(
    workspaceId: string,
    classId: string,
    filter?: { studentIds?: readonly string[]; setIds?: readonly string[] },
  ): Promise<LearningRecord[]>;
  /** The classes (of `classIds`) with at least one exercise submission, removed students included. */
  classesWithSubmissions(workspaceId: string, classIds: readonly string[]): Promise<Set<string>>;
  studentHasSubmissions(workspaceId: string, studentId: string): Promise<boolean>;
  /** A deleted student's attempts go (001 AC-13.2: deleting is only allowed without submissions). */
  purgeStudent(workspaceId: string, studentId: string): Promise<void>;
}

export interface ClassExams {
  classesWithSubmissions(workspaceId: string, classIds: readonly string[]): Promise<Set<string>>;
  /** Exams assigned to the class that its HV can see (006 AC-7.1). */
  visibleCount(workspaceId: string, classId: string): Promise<number>;
  studentHasSubmissions(workspaceId: string, studentId: string): Promise<boolean>;
  removeClass(workspaceId: string, classId: string): Promise<void>;
  /** A deleted student's attempts in progress and results go (001 AC-13.2: deleting is only allowed without submissions). */
  purgeStudent(workspaceId: string, studentId: string): Promise<void>;
}

export const CLASS_LEARNING = Symbol('CLASS_LEARNING');
export const CLASS_EXAMS = Symbol('CLASS_EXAMS');

export const DEV_CLASS_LINKS_COLLECTION = 'dev_class_links';

/** One stand-in row: an attempt / submission (005) or an exam with its submissions (006). */
export interface DevClassLinkDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  kind: 'attempt' | 'exam';
  classId?: Types.ObjectId;
  studentId?: Types.ObjectId;
  setId?: Types.ObjectId;
  submittedAt?: Date | null;
  score?: number;
  maxScore?: number;
  classIds?: Types.ObjectId[];
  name?: string;
  visible?: boolean;
  submissions?: { classId: Types.ObjectId; studentId: Types.ObjectId }[];
}

const oid = (id: string) => new Types.ObjectId(id);
const oids = (ids: readonly string[]) => ids.filter((id) => Types.ObjectId.isValid(id)).map(oid);

/** Rows of the dev/test stand-in (raw collection: rows always carry and are filtered by `workspaceId`). */
const devRows = (connection: Connection) =>
  connection.collection<DevClassLinkDoc>(DEV_CLASS_LINKS_COLLECTION);

/** Dev/test stand-in for 005 (attempts and submissions). Nothing writes it in production: no data there. */
@Injectable()
export class DevClassLearning implements ClassLearning {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async records(
    workspaceId: string,
    classId: string,
    filter: { studentIds?: readonly string[]; setIds?: readonly string[] } = {},
  ): Promise<LearningRecord[]> {
    const rows = await devRows(this.connection)
      .find({
        workspaceId: oid(workspaceId),
        kind: 'attempt',
        classId: oid(classId),
        ...(filter.studentIds ? { studentId: { $in: oids(filter.studentIds) } } : {}),
        ...(filter.setIds ? { setId: { $in: oids(filter.setIds) } } : {}),
      })
      .toArray();
    return rows.map((r) => ({
      studentId: String(r.studentId),
      setId: String(r.setId),
      inProgress: !r.submittedAt,
      submission: r.submittedAt
        ? { score: r.score ?? 0, maxScore: r.maxScore ?? 0, at: r.submittedAt }
        : null,
    }));
  }

  async classesWithSubmissions(workspaceId: string, classIds: readonly string[]) {
    if (!classIds.length) return new Set<string>();
    const ids = await devRows(this.connection).distinct('classId', {
      workspaceId: oid(workspaceId),
      kind: 'attempt',
      classId: { $in: oids(classIds) },
      submittedAt: { $ne: null },
    });
    return new Set(ids.map(String));
  }

  async studentHasSubmissions(workspaceId: string, studentId: string) {
    return !!(await devRows(this.connection).findOne({
      workspaceId: oid(workspaceId),
      kind: 'attempt',
      studentId: oid(studentId),
      submittedAt: { $ne: null },
    }));
  }

  async purgeStudent(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return;
    await devRows(this.connection).deleteMany({
      workspaceId: oid(workspaceId),
      kind: 'attempt',
      studentId: oid(studentId),
    });
  }
}

/** Dev/test stand-in for 006 (exams assigned to classes and their submissions). */
@Injectable()
export class DevClassExams implements ClassExams {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async classesWithSubmissions(workspaceId: string, classIds: readonly string[]) {
    if (!classIds.length) return new Set<string>();
    const exams = await devRows(this.connection)
      .find({
        workspaceId: oid(workspaceId),
        kind: 'exam',
        'submissions.classId': { $in: oids(classIds) },
      })
      .toArray();
    const wanted = new Set(classIds);
    return new Set(
      exams
        .flatMap((e) => e.submissions ?? [])
        .map((s) => String(s.classId))
        .filter((id) => wanted.has(id)),
    );
  }

  visibleCount(workspaceId: string, classId: string) {
    return devRows(this.connection).countDocuments({
      workspaceId: oid(workspaceId),
      kind: 'exam',
      classIds: oid(classId),
      visible: true,
    });
  }

  async studentHasSubmissions(workspaceId: string, studentId: string) {
    return !!(await devRows(this.connection).findOne({
      workspaceId: oid(workspaceId),
      kind: 'exam',
      'submissions.studentId': oid(studentId),
    }));
  }

  async removeClass(workspaceId: string, classId: string) {
    await devRows(this.connection).updateMany(
      { workspaceId: oid(workspaceId), kind: 'exam', classIds: oid(classId) },
      { $pull: { classIds: oid(classId) } },
    );
  }

  async purgeStudent(workspaceId: string, studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) return;
    await devRows(this.connection).updateMany(
      { workspaceId: oid(workspaceId), kind: 'exam' },
      { $pull: { submissions: { studentId: oid(studentId) } } },
    );
  }
}

/** Dev-only fault injection for "connection or system error" (AC-5.5, AC-16.5, AC-22.3). */
export type ClassFaultOp = 'create' | 'visibility' | 'deadlines';

@Injectable()
export class ClassFaults {
  private readonly next = new Map<ClassFaultOp, { fail: boolean; delayMs: number }>();

  set(op: ClassFaultOp, fault: { fail: boolean; delayMs: number }): void {
    this.next.set(op, fault);
  }

  async apply(op: ClassFaultOp): Promise<void> {
    const fault = this.next.get(op);
    if (!fault) return;
    this.next.delete(op);
    if (fault.delayMs) await new Promise((r) => setTimeout(r, fault.delayMs));
    if (fault.fail) throw new Error(`injected ${op} failure`);
  }
}

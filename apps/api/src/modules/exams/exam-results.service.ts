import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type ExamClassResults,
  type ExamResultRow,
  type ExamSubmission,
  type T16Kind,
  examStateAt,
  reviewRows,
  setPoints,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { StudentDirectory } from '../accounts/student-directory.js';
import {
  CLASS_MODEL,
  type ClassDoc,
  MEMBER_MODEL,
  type MemberDoc,
} from '../classes/classes.model.js';
import { isActivated } from '../classes/members.service.js';
import { ExamSettleService, examContent } from './exam-settle.service.js';
import {
  EXAM_ATTEMPT_MODEL,
  EXAM_MODEL,
  EXAM_NOSHOW_MODEL,
  type ExamAttemptDoc,
  type ExamDoc,
  type ExamNoShowDoc,
} from './exams.model.js';

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));
const isoOf = (d: Date | null | undefined) => d?.toISOString() ?? null;

/** `ExamResultsService.scoringData` — read by 008 Điểm & Xếp hạng. */
export interface ExamScoringData {
  exams: {
    id: string;
    name: string;
    opensAt: Date | null;
    closesAt: Date | null;
    archived: boolean;
    maxScore: number;
  }[];
  submissions: {
    examId: string;
    studentId: string;
    score: number;
    maxScore: number;
    submittedAt: Date;
  }[];
  noShows: { examId: string; studentId: string }[];
}

/**
 * T16 / T14 of the GV (REQ-15) and the exam results 006 provides to 008 / 009 (AC-13.4 … AC-13.6): one result per HV and
 * assigned class — the HV's one submission, or "Không làm bài" (0) recorded at the close.
 */
@Injectable()
export class ExamResultsService {
  constructor(
    @InjectModel(EXAM_MODEL) private readonly exams: Model<ExamDoc>,
    @InjectModel(EXAM_ATTEMPT_MODEL) private readonly attempts: Model<ExamAttemptDoc>,
    @InjectModel(EXAM_NOSHOW_MODEL) private readonly noShows: Model<ExamNoShowDoc>,
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly settle: ExamSettleService,
    private readonly students: StudentDirectory,
  ) {}

  private async exam(p: AuthPrincipal, id: string): Promise<ExamDoc> {
    if (!Types.ObjectId.isValid(id)) throw notFound();
    const doc = await scoped(this.exams, p.workspaceId)
      .findOne({ _id: oid(id), phase: { $ne: 'deleted' } })
      .lean<ExamDoc>();
    if (!doc) throw notFound();
    await this.settle.settle(p.workspaceId, doc._id);
    return doc;
  }

  /** AC-15.1 … AC-15.3, AC-15.6: one row per activated current member of the selected class (default: first A→Z). */
  async classResults(p: AuthPrincipal, id: string, classId?: string): Promise<ExamClassResults> {
    const exam = await this.exam(p, id);
    const now = this.clock.now();
    const content = examContent(exam);
    const state = examStateAt(
      { ...exam, phase: exam.phase === 'deleted' ? 'draft' : exam.phase },
      now,
    );
    const classes = (
      await scoped(this.classes, p.workspaceId)
        .find({ _id: { $in: exam.classIds } })
        .lean<ClassDoc[]>()
    )
      .map((c) => ({ id: String(c._id), name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    const head = {
      exam: {
        id,
        name: exam.name,
        opensAt: isoOf(exam.opensAt),
        durationMin: exam.durationMin,
        closesAt: isoOf(exam.closesAt),
        state,
        questionCount: content.questions.length,
        totalPoints: setPoints(content),
      },
      classes,
      serverNow: now.toISOString(),
    };
    if (state === 'draft' || !classes.length) return { ...head, classId: null, rows: [] };
    const chosen = classes.find((c) => c.id === classId) ?? classes[0];
    if (!chosen) return { ...head, classId: null, rows: [] };
    const rows = await scoped(this.members, p.workspaceId)
      .find({ classId: oid(chosen.id), removedAt: null })
      .lean<MemberDoc[]>();
    const students = (
      await this.students.byIds(
        p.workspaceId,
        rows.map((r) => String(r.studentId)),
      )
    ).filter(isActivated);
    const sids = students.map((s) => oid(s.id));
    const [attempts, noShows] = await Promise.all([
      scoped(this.attempts, p.workspaceId)
        .find({ examId: exam._id, studentId: { $in: sids } })
        .lean<ExamAttemptDoc[]>(),
      scoped(this.noShows, p.workspaceId)
        .find({ examId: exam._id, classId: oid(chosen.id), studentId: { $in: sids } })
        .lean<ExamNoShowDoc[]>(),
    ]);
    const attemptOf = new Map(attempts.map((a) => [String(a.studentId), a]));
    const noShow = new Set(noShows.map((n) => String(n.studentId)));
    const closed = state === 'closed' || state === 'archived';
    return {
      ...head,
      classId: chosen.id,
      rows: students
        .map((s) => {
          const a = attemptOf.get(s.id);
          const kind: T16Kind =
            a?.status === 'submitted'
              ? 'submitted'
              : a
                ? 'doing'
                : noShow.has(s.id)
                  ? 'noShow'
                  : closed
                    ? 'lateJoin'
                    : 'todo';
          return {
            student: { id: s.id, name: s.displayName, locked: s.status === 'locked' },
            kind,
            percent: kind === 'submitted' ? (a?.percent ?? 0) : kind === 'noShow' ? 0 : null,
            startedAt: isoOf(a?.startedAt),
            endsAt: isoOf(a?.endsAt),
            submittedAt: isoOf(a?.submittedAt),
            auto: !!a?.auto,
          };
        })
        .sort((x, y) => x.student.name.localeCompare(y.student.name, 'vi')),
    };
  }

  /** AC-15.5: the HV's submission, read-only, with keys and explanations — even before the close. */
  async submission(
    p: AuthPrincipal,
    id: string,
    studentId: string,
    classId: string,
  ): Promise<ExamSubmission> {
    const exam = await this.exam(p, id);
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(classId)) throw notFound();
    if (!exam.classIds.some((c) => c.equals(oid(classId)))) throw notFound();
    const [attempt, cls, student] = await Promise.all([
      scoped(this.attempts, p.workspaceId)
        .findOne({ examId: exam._id, studentId: oid(studentId), status: 'submitted' })
        .lean<ExamAttemptDoc>(),
      scoped(this.classes, p.workspaceId).findById(classId).lean<ClassDoc>(),
      this.students.byIds(p.workspaceId, [studentId]),
    ]);
    if (!attempt?.submittedAt || !cls) throw notFound();
    const content = examContent(exam);
    return {
      student: { id: studentId, name: student[0]?.displayName ?? '—' },
      class: { id: classId, name: cls.name },
      exam: { id, name: exam.name },
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt.toISOString(),
      auto: attempt.auto,
      score: attempt.score ?? 0,
      maxScore: attempt.maxScore ?? 0,
      percent: attempt.percent ?? 0,
      rows: reviewRows(content, attempt.answers ?? {}, attempt.results ?? []),
    };
  }

  /**
   * What 008 scores for one class (AC-13.4 … AC-13.6 of 006, settled first): the exams of the class an HV can see or that
   * were archived, the submitted attempts of those exams (any student — one attempt counts in every assigned class,
   * 008 AC-1.12) and the "Không làm bài" records of the class.
   */
  async scoringData(workspaceId: string, classId: string): Promise<ExamScoringData> {
    if (!Types.ObjectId.isValid(classId)) return { exams: [], submissions: [], noShows: [] };
    await this.settle.settle(workspaceId);
    const exams = await scoped(this.exams, workspaceId)
      .find({ classIds: oid(classId), phase: { $in: ['scheduled', 'archived'] } })
      .lean<ExamDoc[]>();
    if (!exams.length) return { exams: [], submissions: [], noShows: [] };
    const examIds = exams.map((e) => e._id);
    const [attempts, noShows] = await Promise.all([
      scoped(this.attempts, workspaceId)
        .find({ examId: { $in: examIds }, status: 'submitted' })
        .select({ examId: 1, studentId: 1, score: 1, maxScore: 1, submittedAt: 1 })
        .lean<ExamAttemptDoc[]>(),
      scoped(this.noShows, workspaceId)
        .find({ examId: { $in: examIds }, classId: oid(classId) })
        .select({ examId: 1, studentId: 1 })
        .lean<ExamNoShowDoc[]>(),
    ]);
    return {
      exams: exams.map((e) => ({
        id: String(e._id),
        name: e.name,
        opensAt: e.opensAt,
        closesAt: e.closesAt,
        archived: e.phase === 'archived',
        maxScore: setPoints(examContent(e)),
      })),
      submissions: attempts.map((a) => ({
        examId: String(a.examId),
        studentId: String(a.studentId),
        score: a.score ?? 0,
        maxScore: a.maxScore ?? 0,
        submittedAt: a.submittedAt ?? a.updatedAt,
      })),
      noShows: noShows.map((n) => ({ examId: String(n.examId), studentId: String(n.studentId) })),
    };
  }

  /**
   * AC-13.4 … AC-13.6: per HV × assigned class (current members only): the one submission, or "Không làm bài" (0)
   * recorded at the close; nothing for an attempt in progress or an exam not closed yet. Archived exams keep their rows,
   * flagged (AC-6.3). This is what 008 / 009 read.
   */
  async rows(
    workspaceId: string,
    filter: { classIds?: readonly string[] } = {},
  ): Promise<ExamResultRow[]> {
    await this.settle.settle(workspaceId);
    const classFilter = filter.classIds
      ? { classIds: { $in: filter.classIds.filter((c) => Types.ObjectId.isValid(c)).map(oid) } }
      : {};
    const exams = await scoped(this.exams, workspaceId)
      .find({ phase: { $in: ['scheduled', 'archived'] }, ...classFilter })
      .lean<ExamDoc[]>();
    if (!exams.length) return [];
    const wanted = (c: Types.ObjectId) => !filter.classIds || filter.classIds.includes(String(c));
    const classIds = [...new Set(exams.flatMap((e) => e.classIds.filter(wanted).map(String)))].map(
      oid,
    );
    const [members, attempts, noShows] = await Promise.all([
      scoped(this.members, workspaceId)
        .find({ classId: { $in: classIds }, removedAt: null })
        .select({ classId: 1, studentId: 1 })
        .lean<Pick<MemberDoc, 'classId' | 'studentId'>[]>(),
      scoped(this.attempts, workspaceId)
        .find({ examId: { $in: exams.map((e) => e._id) }, status: 'submitted' })
        .lean<ExamAttemptDoc[]>(),
      scoped(this.noShows, workspaceId)
        .find({ examId: { $in: exams.map((e) => e._id) }, classId: { $in: classIds } })
        .lean<ExamNoShowDoc[]>(),
    ]);
    const membersOf = new Map<string, Set<string>>();
    for (const m of members) {
      const set = membersOf.get(String(m.classId)) ?? new Set<string>();
      set.add(String(m.studentId));
      membersOf.set(String(m.classId), set);
    }
    const out: ExamResultRow[] = [];
    for (const exam of exams) {
      const closesAt = exam.closesAt?.toISOString() ?? '';
      const archived = exam.phase === 'archived';
      const mine = attempts.filter((a) => a.examId.equals(exam._id));
      for (const classId of exam.classIds.filter(wanted)) {
        const inClass = membersOf.get(String(classId)) ?? new Set<string>();
        for (const a of mine)
          if (inClass.has(String(a.studentId)))
            out.push({
              examId: String(exam._id),
              classId: String(classId),
              studentId: String(a.studentId),
              kind: 'submitted',
              percent: a.percent ?? 0,
              submittedAt: isoOf(a.submittedAt),
              auto: a.auto,
              closesAt,
              archived,
            });
        for (const n of noShows)
          if (
            n.examId.equals(exam._id) &&
            n.classId.equals(classId) &&
            inClass.has(String(n.studentId))
          )
            out.push({
              examId: String(exam._id),
              classId: String(classId),
              studentId: String(n.studentId),
              kind: 'noShow',
              percent: 0,
              submittedAt: null,
              auto: false,
              closesAt,
              archived,
            });
      }
    }
    return out;
  }
}

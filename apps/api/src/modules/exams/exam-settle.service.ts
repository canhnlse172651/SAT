import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  EXAM_LIMITS,
  type ExerciseSetContent,
  gradeSet,
  scorePercent,
  setContentSchema,
  vnDay,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { JOB_SCHEDULER, type JobScheduler } from '../../common/ports/scheduler.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { StudentDirectory } from '../accounts/student-directory.js';
import { MEMBER_MODEL, type MemberDoc } from '../classes/classes.model.js';
import { isActivated } from '../classes/members.service.js';
import {
  EXAM_ATTEMPT_MODEL,
  EXAM_MODEL,
  EXAM_NOSHOW_MODEL,
  type ExamAttemptDoc,
  type ExamDoc,
  type ExamNoShowDoc,
} from './exams.model.js';
import { logExam } from './exams.log.js';

export const SETTLE_JOB = 'exams.settle';
const GRACE = EXAM_LIMITS.graceMs;

export const examContent = (exam: Pick<ExamDoc, 'content'>): ExerciseSetContent => {
  const parsed = setContentSchema.safeParse(exam.content);
  return parsed.success ? parsed.data : { instructions: '', stepId: null, questions: [] };
};

/** Grade an attempt's answers with the exam's (locked) content (AC-13.1, AC-13.2). */
export function gradeAttempt(content: ExerciseSetContent, answers: ExamAttemptDoc['answers']) {
  const ids = new Set(content.questions.map((q) => q.id));
  const known = Object.fromEntries(Object.entries(answers ?? {}).filter(([id]) => ids.has(id)));
  const grade = gradeSet(content, known);
  return { ...grade, answers: known, percent: scorePercent(grade.score, grade.maxScore) };
}

/**
 * REQ-12, AC-13.3: attempts past `endsAt + 10 s` are submitted automatically ("Nộp tự động" at `endsAt`); once an exam's
 * close time + 10 s has passed, every HV counted at the close time without a submission gets "Không làm bài". Runs lazily
 * before every exam read / write (exact results for any reader) and as the `exams.settle` job.
 */
@Injectable()
export class ExamSettleService implements OnModuleInit {
  constructor(
    @InjectModel(EXAM_MODEL) private readonly exams: Model<ExamDoc>,
    @InjectModel(EXAM_ATTEMPT_MODEL) private readonly attempts: Model<ExamAttemptDoc>,
    @InjectModel(EXAM_NOSHOW_MODEL) private readonly noShows: Model<ExamNoShowDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(JOB_SCHEDULER) private readonly jobs: JobScheduler,
    private readonly students: StudentDirectory,
  ) {}

  onModuleInit(): void {
    this.jobs.handle(SETTLE_JOB, async (payload) => {
      const { workspaceId } = (payload ?? {}) as { workspaceId?: string };
      if (workspaceId) await this.settle(workspaceId);
    });
  }

  /** Runs the settle job at `at` (an attempt's end or the close time, plus the grace period). */
  async scheduleAt(workspaceId: string, at: Date): Promise<void> {
    await this.jobs.schedule(SETTLE_JOB, new Date(at.getTime() + GRACE + 1000), { workspaceId });
  }

  /** Everything due in the workspace (optionally one exam only). */
  async settle(workspaceId: string, examId?: Types.ObjectId): Promise<void> {
    const now = this.clock.now();
    const due = new Date(now.getTime() - GRACE);
    const late = await scoped(this.attempts, workspaceId)
      .find({ status: 'doing', endsAt: { $lte: due }, ...(examId ? { examId } : {}) })
      .lean<ExamAttemptDoc[]>();
    const examIds = [...new Set(late.map((a) => String(a.examId)))];
    const byId = new Map(
      (
        await scoped(this.exams, workspaceId)
          .find({ _id: { $in: examIds.map((id) => new Types.ObjectId(id)) } })
          .lean<ExamDoc[]>()
      ).map((e) => [String(e._id), e]),
    );
    for (const a of late) {
      const exam = byId.get(String(a.examId));
      if (exam) await this.autoSubmit(workspaceId, exam, a);
    }
    const closed = await scoped(this.exams, workspaceId)
      .find({
        phase: { $in: ['scheduled', 'archived'] },
        settledAt: null,
        closesAt: { $lte: due },
        ...(examId ? { _id: examId } : {}),
      })
      .lean<ExamDoc[]>();
    for (const exam of closed) await this.finalize(workspaceId, exam);
  }

  /** AC-12.1, AC-12.2: the answers the system had at `endsAt + 10 s`, submitted at `endsAt` with "Nộp tự động". */
  async autoSubmit(workspaceId: string, exam: ExamDoc, attempt: ExamAttemptDoc): Promise<void> {
    const g = gradeAttempt(examContent(exam), attempt.answers);
    const done = await scoped(this.attempts, workspaceId).updateOne(
      { _id: attempt._id, status: 'doing' },
      {
        $set: {
          status: 'submitted',
          submittedAt: attempt.endsAt,
          auto: true,
          answers: g.answers,
          score: g.score,
          maxScore: g.maxScore,
          percent: g.percent,
          results: g.results,
        },
        $inc: { version: 1 },
      },
    );
    if (done.modifiedCount)
      logExam({
        action: 'exam.attempt.autosubmit',
        examId: String(exam._id),
        attemptId: String(attempt._id),
        studentId: String(attempt.studentId),
        percent: g.percent,
      });
  }

  /**
   * AC-13.3: "Không làm bài" (0) for each activated HV (locked included) without a submission who was a member of an
   * assigned class at the close time — per class; nobody who joined after the close.
   */
  private async finalize(workspaceId: string, exam: ExamDoc): Promise<void> {
    const closesAt = exam.closesAt;
    if (!closesAt) return;
    const doing = await scoped(this.attempts, workspaceId)
      .find({ examId: exam._id, status: 'doing' })
      .lean<ExamAttemptDoc[]>();
    for (const a of doing) await this.autoSubmit(workspaceId, exam, a);
    const closeDay = vnDay(closesAt);
    const rows = await scoped(this.members, workspaceId)
      .find({
        classId: { $in: exam.classIds },
        createdAt: { $lte: closesAt },
        joinedAt: { $lte: closeDay },
        $or: [{ removedAt: null }, { removedAt: { $gt: closesAt } }],
      })
      .lean<MemberDoc[]>();
    const submitted = new Set(
      (
        await scoped(this.attempts, workspaceId)
          .find({ examId: exam._id, status: 'submitted' })
          .select({ studentId: 1 })
          .lean<Pick<ExamAttemptDoc, 'studentId'>[]>()
      ).map((a) => String(a.studentId)),
    );
    const candidates = rows.filter((m) => !submitted.has(String(m.studentId)));
    const activated = new Set(
      (
        await this.students.byIds(workspaceId, [
          ...new Set(candidates.map((m) => String(m.studentId))),
        ])
      )
        .filter(isActivated)
        .map((s) => s.id),
    );
    const docs = candidates
      .filter((m) => activated.has(String(m.studentId)))
      .map((m) => ({ examId: exam._id, classId: m.classId, studentId: m.studentId }));
    const scope = scoped(this.noShows, workspaceId);
    await Promise.all(
      docs.map((d) =>
        scope.create(d).catch((err: unknown) => {
          // A concurrent settle recorded it already (unique index).
          if ((err as { code?: number }).code !== 11000) throw err;
        }),
      ),
    );
    await scoped(this.exams, workspaceId).updateOne(
      { _id: exam._id, settledAt: null },
      { $set: { settledAt: this.clock.now() } },
    );
    logExam({ action: 'exam.close.noshows', examId: String(exam._id), count: docs.length });
  }
}

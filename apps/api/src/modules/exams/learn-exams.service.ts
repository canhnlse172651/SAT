import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  EXAM_ERROR_CODES as E,
  EXAM_LIMITS,
  EXAM_MESSAGES as M,
  type ExamAttempt,
  type ExamClock,
  type ExamResult,
  type ExamSaveAnswers,
  type ExamState,
  type ExamSubmit,
  type LearnerExam,
  type LearnerExamView,
  type LearnerRow,
  attemptEndsAt,
  examStateAt,
  learnQuestion,
  makeShuffles,
  reviewRows,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { statusOf, todayOf } from '../classes/class-status.js';
import {
  CLASS_MODEL,
  type ClassDoc,
  MEMBER_MODEL,
  type MemberDoc,
} from '../classes/classes.model.js';
import { ExamSettleService, examContent, gradeAttempt } from './exam-settle.service.js';
import {
  EXAM_ATTEMPT_MODEL,
  EXAM_MODEL,
  EXAM_NOSHOW_MODEL,
  type ExamAttemptDoc,
  type ExamDoc,
  type ExamNoShowDoc,
} from './exams.model.js';
import { logExam } from './exams.log.js';

const GRACE = EXAM_LIMITS.graceMs;
const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));

/** The caller's current classes among an exam's assigned classes, with their status today. */
interface Mine {
  classes: { cls: ClassDoc; status: 'upcoming' | 'active' | 'ended' }[];
}

const stateOf = (exam: ExamDoc, now: Date): ExamState =>
  examStateAt({ ...exam, phase: exam.phase === 'deleted' ? 'draft' : exam.phase }, now);

/** S07 / S08 of the HV (REQ-7 … REQ-12, REQ-14, REQ-16). The device clock is never trusted: every answer carries `serverNow`. */
@Injectable()
export class LearnExamsService {
  constructor(
    @InjectModel(EXAM_MODEL) private readonly exams: Model<ExamDoc>,
    @InjectModel(EXAM_ATTEMPT_MODEL) private readonly attempts: Model<ExamAttemptDoc>,
    @InjectModel(EXAM_NOSHOW_MODEL) private readonly noShows: Model<ExamNoShowDoc>,
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly settle: ExamSettleService,
  ) {}

  /* ---------- who sees what (AC-7.1, AC-16.2) ---------- */

  /** Current memberships of the caller with their classes. */
  private async myClasses(p: AuthPrincipal): Promise<Map<string, Mine['classes'][number]>> {
    const rows = await scoped(this.members, p.workspaceId)
      .find({ studentId: oid(p.userId), removedAt: null })
      .select({ classId: 1 })
      .lean<Pick<MemberDoc, 'classId'>[]>();
    const today = todayOf(this.clock);
    const docs = await scoped(this.classes, p.workspaceId)
      .find({ _id: { $in: rows.map((r) => r.classId) } })
      .lean<ClassDoc[]>();
    return new Map(docs.map((c) => [String(c._id), { cls: c, status: statusOf(c, today) }]));
  }

  private mine(exam: ExamDoc, classes: Map<string, Mine['classes'][number]>): Mine {
    return {
      classes: exam.classIds.flatMap((c) => {
        const m = classes.get(String(c));
        return m ? [m] : [];
      }),
    };
  }

  /** AC-7.1: scheduled / open / closed, and a current member of an assigned class that is not "Sắp bắt đầu". */
  private visible(exam: ExamDoc, mine: Mine): boolean {
    return exam.phase === 'scheduled' && mine.classes.some((c) => c.status !== 'upcoming');
  }

  private attemptOf(p: AuthPrincipal, examId: Types.ObjectId) {
    return scoped(this.attempts, p.workspaceId)
      .findOne({ examId, studentId: oid(p.userId) })
      .lean<ExamAttemptDoc>();
  }

  private async loadExam(p: AuthPrincipal, id: string): Promise<ExamDoc> {
    if (!Types.ObjectId.isValid(id)) throw notFound();
    const exam = await scoped(this.exams, p.workspaceId)
      .findOne({ _id: oid(id), phase: { $ne: 'deleted' } })
      .lean<ExamDoc>();
    if (!exam) throw notFound();
    return exam;
  }

  /**
   * The exam as the caller may see it, everything due settled first. An HV with an attempt in progress keeps access to
   * it (removed from the class, AC-12.5); anyone else not seeing the exam gets A05 (AC-16.2).
   */
  private async context(p: AuthPrincipal, id: string) {
    const first = await this.loadExam(p, id);
    await this.settle.settle(p.workspaceId, first._id);
    const exam = await this.loadExam(p, id);
    const [classes, attempt] = await Promise.all([this.myClasses(p), this.attemptOf(p, exam._id)]);
    const mine = this.mine(exam, classes);
    const visible = this.visible(exam, mine);
    const keeps = exam.phase === 'scheduled' && attempt?.status === 'doing';
    if (!visible && !keeps) throw notFound();
    return { exam, mine, attempt, visible, now: this.clock.now() };
  }

  /** AC-7.3: the one state of the HV for the exam, by priority. */
  private row(
    exam: ExamDoc,
    mine: Mine,
    attempt: ExamAttemptDoc | null,
    noShow: boolean,
    now: Date,
  ): LearnerRow {
    const state = stateOf(exam, now);
    if (attempt?.status === 'submitted')
      return { kind: 'submitted', percent: attempt.percent ?? 0, endsAt: null };
    if (attempt) return { kind: 'doing', percent: null, endsAt: attempt.endsAt.toISOString() };
    if (noShow) return { kind: 'noShow', percent: null, endsAt: null };
    if (state === 'closed') return { kind: 'closed', percent: null, endsAt: null };
    if (state === 'scheduled') return { kind: 'notOpen', percent: null, endsAt: null };
    if (!mine.classes.some((c) => c.status === 'active'))
      return { kind: 'ended', percent: null, endsAt: null };
    return { kind: 'open', percent: null, endsAt: null };
  }

  private summary(exam: ExamDoc, mine: Mine, row: LearnerRow): LearnerExam {
    return {
      id: String(exam._id),
      name: exam.name,
      classNames: mine.classes
        .filter((c) => c.status !== 'upcoming')
        .map((c) => c.cls.name)
        .sort((a, b) => a.localeCompare(b, 'vi')),
      questionCount: examContent(exam).questions.length,
      durationMin: exam.durationMin ?? 0,
      opensAt: exam.opensAt?.toISOString() ?? '',
      closesAt: exam.closesAt?.toISOString() ?? '',
      row,
    };
  }

  /* ---------- S07 (REQ-7) ---------- */

  async list(p: AuthPrincipal): Promise<{ items: LearnerExam[]; serverNow: string }> {
    await this.settle.settle(p.workspaceId);
    const now = this.clock.now();
    const classes = await this.myClasses(p);
    const seeable = [...classes.values()]
      .filter((c) => c.status !== 'upcoming')
      .map((c) => c.cls._id);
    const exams = seeable.length
      ? await scoped(this.exams, p.workspaceId)
          .find({ phase: 'scheduled', classIds: { $in: seeable } })
          .lean<ExamDoc[]>()
      : [];
    const [attempts, noShows] = await Promise.all([
      scoped(this.attempts, p.workspaceId)
        .find({ examId: { $in: exams.map((e) => e._id) }, studentId: oid(p.userId) })
        .lean<ExamAttemptDoc[]>(),
      scoped(this.noShows, p.workspaceId)
        .find({ examId: { $in: exams.map((e) => e._id) }, studentId: oid(p.userId) })
        .select({ examId: 1 })
        .lean<Pick<ExamNoShowDoc, 'examId'>[]>(),
    ]);
    const attemptOf = new Map(attempts.map((a) => [String(a.examId), a]));
    const noShow = new Set(noShows.map((n) => String(n.examId)));
    const t = (d: Date | null) => d?.getTime() ?? 0;
    const items = exams.map((exam) => {
      const mine = this.mine(exam, classes);
      const row = this.row(
        exam,
        mine,
        attemptOf.get(String(exam._id)) ?? null,
        noShow.has(String(exam._id)),
        now,
      );
      const state = stateOf(exam, now);
      // AC-7.4: in progress, open not taken (close soonest), not open yet (open soonest), the rest (latest close).
      const group =
        row.kind === 'doing'
          ? 0
          : state === 'open' && (row.kind === 'open' || row.kind === 'ended')
            ? 1
            : state === 'scheduled'
              ? 2
              : 3;
      const key =
        group === 1 ? t(exam.closesAt) : group === 2 ? t(exam.opensAt) : -t(exam.closesAt);
      return { item: this.summary(exam, mine, row), group, key };
    });
    items.sort((a, b) => a.group - b.group || a.key - b.key);
    return { items: items.map((i) => i.item), serverNow: now.toISOString() };
  }

  /* ---------- lobby / result (REQ-8, REQ-14) ---------- */

  async view(p: AuthPrincipal, id: string): Promise<LearnerExamView> {
    const { exam, mine, attempt, now } = await this.context(p, id);
    const noShow = !!(await scoped(this.noShows, p.workspaceId).exists({
      examId: exam._id,
      studentId: oid(p.userId),
    }));
    const row = this.row(exam, mine, attempt, noShow, now);
    const state = stateOf(exam, now);
    const content = examContent(exam);
    return {
      exam: { ...this.summary(exam, mine, row), instructions: content.instructions },
      state,
      canStart: row.kind === 'open',
      attempt: attempt
        ? {
            status: attempt.status,
            startedAt: attempt.startedAt.toISOString(),
            endsAt: attempt.endsAt.toISOString(),
          }
        : null,
      result: await this.result(p, exam, state, attempt, noShow),
      serverNow: now.toISOString(),
    };
  }

  /** AC-14.1 … AC-14.5: the score at once; answers and explanations only once closed and every attempt submitted. */
  private async result(
    p: AuthPrincipal,
    exam: ExamDoc,
    state: ExamState,
    attempt: ExamAttemptDoc | null,
    noShow: boolean,
  ): Promise<ExamResult | null> {
    if (attempt?.status === 'submitted' && attempt.submittedAt) {
      const revealed =
        state === 'closed' &&
        !(await scoped(this.attempts, p.workspaceId).exists({ examId: exam._id, status: 'doing' }));
      return {
        kind: 'submitted',
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt.toISOString(),
        auto: attempt.auto,
        score: attempt.score ?? 0,
        maxScore: attempt.maxScore ?? 0,
        percent: attempt.percent ?? 0,
        revealed,
        // AC-16.4: no key, no explanation reaches the device before then.
        rows: revealed
          ? reviewRows(examContent(exam), attempt.answers ?? {}, attempt.results ?? [])
          : [],
      };
    }
    if (attempt) return null;
    if (noShow) return { kind: 'noShow' };
    if (state === 'closed') return { kind: 'closed' };
    return null;
  }

  /* ---------- the attempt (REQ-8 … REQ-12) ---------- */

  private payload(exam: ExamDoc, a: ExamAttemptDoc): ExamAttempt {
    const content = examContent(exam);
    const ids = new Set(content.questions.map((q) => q.id));
    return {
      examId: String(exam._id),
      name: exam.name,
      startedAt: a.startedAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      // AC-9.5: authored order; per-attempt order of matching items / tiles (AC-16.4: no key, no explanation).
      questions: content.questions.map((q) => learnQuestion(q, a.shuffles)),
      answers: Object.fromEntries(Object.entries(a.answers ?? {}).filter(([k]) => ids.has(k))),
      lastIndex: Math.min(a.lastIndex ?? 0, Math.max(0, content.questions.length - 1)),
      serverNow: this.clock.now().toISOString(),
    };
  }

  /** AC-10.4: the device that opened last holds the attempt. */
  private async take(p: AuthPrincipal, exam: ExamDoc, a: ExamAttemptDoc, holder: string) {
    const held = await scoped(this.attempts, p.workspaceId).findOneAndUpdate(
      { _id: a._id, status: 'doing' },
      { $set: { holder } },
      { returnDocument: 'after' },
    );
    if (!held) throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.');
    return this.payload(exam, held.toObject() as ExamAttemptDoc);
  }

  /** AC-8.3 … AC-8.6: the one attempt, also under concurrent starts; the exam locks in the same write (AC-4.3). */
  async start(p: AuthPrincipal, id: string, holder: string): Promise<ExamAttempt> {
    const { exam, mine, attempt, now } = await this.context(p, id);
    if (attempt?.status === 'doing') return this.take(p, exam, attempt, holder);
    if (attempt) throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.');
    const row = this.row(exam, mine, null, false, now);
    if (row.kind !== 'open') {
      logExam({ action: 'exam.attempt.start', result: 'denied', examId: id, code: row.kind });
      throw new AppError(409, E.EXAM_NOT_STARTABLE, 'Bài thi không còn mở để bắt đầu.', { row });
    }
    const locked = await scoped(this.exams, p.workspaceId).findOneAndUpdate(
      { _id: exam._id, phase: 'scheduled', opensAt: { $lte: now }, closesAt: { $gt: now } },
      { $set: { locked: true } },
      { returnDocument: 'after' },
    );
    if (!locked) {
      const again = await scoped(this.exams, p.workspaceId).findById(exam._id).lean<ExamDoc>();
      if (!again || again.phase !== 'scheduled') throw notFound();
      throw new AppError(409, E.EXAM_NOT_STARTABLE, 'Bài thi không còn mở để bắt đầu.');
    }
    const doc = locked.toObject() as ExamDoc;
    const content = examContent(doc);
    if (!doc.durationMin || !doc.closesAt) throw notFound();
    try {
      const created = await scoped(this.attempts, p.workspaceId).create({
        examId: doc._id,
        studentId: oid(p.userId),
        status: 'doing',
        startedAt: now,
        endsAt: attemptEndsAt(now, doc.durationMin, doc.closesAt),
        holder,
        shuffles: makeShuffles(content),
        answers: {},
      });
      const a = created.toObject() as ExamAttemptDoc;
      await this.settle.scheduleAt(p.workspaceId, a.endsAt);
      logExam({ action: 'exam.attempt.start', examId: id, attemptId: String(a._id) });
      return this.payload(doc, a);
    } catch (err) {
      // The other device / tab created it first: continue that attempt (AC-8.5).
      if ((err as { code?: number }).code !== 11000) throw err;
      const existing = await this.attemptOf(p, doc._id);
      if (existing?.status !== 'doing')
        throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.');
      return this.take(p, doc, existing, holder);
    }
  }

  /** AC-10.3: resume the same attempt (reload, another device, after signing in again) — this device now holds it. */
  async open(p: AuthPrincipal, id: string, holder: string): Promise<ExamAttempt> {
    const { exam, attempt } = await this.context(p, id);
    if (!attempt) throw new AppError(409, E.EXAM_NOT_STARTABLE, 'Bạn chưa bắt đầu bài thi này.');
    if (attempt.status !== 'doing')
      throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.');
    return this.take(p, exam, attempt, holder);
  }

  /** Still a current member of an assigned class (AC-12.4: an ended class counts; AC-12.5: removal does not). */
  private async member(p: AuthPrincipal, exam: ExamDoc): Promise<boolean> {
    return !!(await scoped(this.members, p.workspaceId).exists({
      studentId: oid(p.userId),
      classId: { $in: exam.classIds },
      removedAt: null,
    }));
  }

  /** What every save / submit checks; a refusal never touches the saved answers. */
  private async writable(p: AuthPrincipal, id: string, holder: string) {
    const exam = await this.loadExam(p, id);
    const attempt = await this.attemptOf(p, exam._id);
    if (!attempt) throw notFound();
    if (attempt.status === 'submitted')
      throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.', { auto: attempt.auto });
    const now = this.clock.now();
    if (now.getTime() > attempt.endsAt.getTime() + GRACE) {
      await this.settle.settle(p.workspaceId, exam._id);
      throw new AppError(409, E.EXAM_TIME_OVER, M.autoSubmitted(attempt.endsAt), { auto: true });
    }
    if (attempt.holder !== holder) throw new AppError(409, E.EXAM_HELD_ELSEWHERE, M.heldElsewhere);
    if (!(await this.member(p, exam))) throw new AppError(409, E.EXAM_NOT_MEMBER, M.removed);
    return { exam, attempt, now };
  }

  /** AC-9.3, AC-10.2, AC-12.2: autosave of the changed questions until `endsAt + 10 s`. */
  async save(p: AuthPrincipal, id: string, body: ExamSaveAnswers): Promise<{ savedAt: string }> {
    const { exam, attempt, now } = await this.writable(p, id, body.holder).catch((err: unknown) => {
      logExam({
        action: 'exam.attempt.save',
        result: 'denied',
        examId: id,
        code: (err as AppError).code,
      });
      throw err;
    });
    const ids = new Set(examContent(exam).questions.map((q) => q.id));
    const $set: Record<string, unknown> = {};
    for (const [qid, a] of Object.entries(body.answers ?? {}))
      if (ids.has(qid)) $set[`answers.${qid}`] = a;
    if (body.lastIndex !== undefined) $set['lastIndex'] = body.lastIndex;
    const r = await scoped(this.attempts, p.workspaceId).updateOne(
      { _id: attempt._id, status: 'doing', holder: body.holder },
      { $set, $inc: { version: 1 } },
    );
    if (!r.matchedCount) {
      const again = await this.attemptOf(p, exam._id);
      if (again?.status === 'submitted')
        throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.');
      throw new AppError(409, E.EXAM_HELD_ELSEWHERE, M.heldElsewhere);
    }
    return { savedAt: now.toISOString() };
  }

  /** AC-11.2, AC-11.3: one submission; a submit at / after the end is the automatic one, at the end time (AC-12.1). */
  async submit(p: AuthPrincipal, id: string, body: ExamSubmit): Promise<{ submitted: true }> {
    const exam = await this.loadExam(p, id);
    const before = await this.attemptOf(p, exam._id);
    if (before?.status === 'submitted') {
      if (before.submitKey === body.submitKey) return { submitted: true };
      throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.', { auto: before.auto });
    }
    const { attempt, now } = await this.writable(p, id, body.holder);
    const answers = { ...(attempt.answers ?? {}), ...(body.answers ?? {}) };
    const g = gradeAttempt(examContent(exam), answers);
    const auto = now >= attempt.endsAt;
    const done = await scoped(this.attempts, p.workspaceId).findOneAndUpdate(
      { _id: attempt._id, status: 'doing' },
      {
        $set: {
          status: 'submitted',
          submittedAt: auto ? attempt.endsAt : now,
          auto,
          submitKey: body.submitKey,
          answers: g.answers,
          score: g.score,
          maxScore: g.maxScore,
          percent: g.percent,
          results: g.results,
        },
        $inc: { version: 1 },
      },
    );
    if (!done) {
      const again = await this.attemptOf(p, exam._id);
      if (again?.status === 'submitted' && again.submitKey === body.submitKey)
        return { submitted: true };
      throw new AppError(409, E.EXAM_SUBMITTED, 'Bài thi đã được nộp.', { auto: !!again?.auto });
    }
    logExam({
      action: auto ? 'exam.attempt.autosubmit' : 'exam.attempt.submit',
      examId: id,
      attemptId: String(attempt._id),
      percent: g.percent,
    });
    return { submitted: true };
  }

  /** 5 s poll of S08: server time, the attempt's end (a later close moves it, AC-5.2), who holds it, removal (AC-12.5). */
  async clockOf(p: AuthPrincipal, id: string): Promise<ExamClock> {
    const { exam, attempt, now } = await this.context(p, id);
    return {
      serverNow: now.toISOString(),
      status: attempt?.status ?? 'none',
      endsAt: attempt?.endsAt.toISOString() ?? null,
      holder: attempt?.holder ?? null,
      removed: attempt?.status === 'doing' ? !(await this.member(p, exam)) : false,
      submittedAt: attempt?.submittedAt?.toISOString() ?? null,
      auto: !!attempt?.auto,
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CONFLICT,
  EXAM_ERROR_CODES as E,
  EXAM_LIMITS as L,
  EXAM_MESSAGES as M,
  EXERCISE_ERROR_CODES,
  type Exam,
  type ExamClassOption,
  type ExamDraft,
  type ExamListItem,
  type ExerciseSetContent,
  type FileRef,
  type Option,
  type Question,
  type SubQuestion,
  durationProblem,
  examIssues,
  examStateAt,
  firstInvalidSetProblem,
  foldSearch,
  nameProblem,
  saveRefusedMessage,
  setContentSchema,
  setCopyTitle,
  setFileIds,
  setPoints,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { StudentDirectory } from '../accounts/student-directory.js';
import { statusOf, todayOf } from '../classes/class-status.js';
import {
  CLASS_MODEL,
  type ClassDoc,
  MEMBER_MODEL,
  type MemberDoc,
} from '../classes/classes.model.js';
import { isActivated } from '../classes/members.service.js';
import { StepFilesService } from '../steps/step-files.service.js';
import { ExamSettleService, examContent } from './exam-settle.service.js';
import {
  EXAM_ATTEMPT_MODEL,
  EXAM_MODEL,
  type ExamAttemptDoc,
  type ExamDoc,
} from './exams.model.js';
import { logExam } from './exams.log.js';

type Input = {
  name: string;
  content: unknown;
  classIds: string[];
  opensAt: string | null;
  durationMin: number | null;
  closesAt: string | null;
};

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));
const date = (v: string | null) => (v ? new Date(v) : null);
const same = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null);
const ids = (xs: readonly (string | Types.ObjectId)[]) => xs.map(String).sort().join(',');

const invalid = (field: string, message: string) =>
  new AppError(422, E.INVALID_EXAM, message, { field });

/** T10 / T22 of the GV (REQ-1 … REQ-6). Every read and write settles due attempts first (REQ-12). */
@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(EXAM_MODEL) private readonly exams: Model<ExamDoc>,
    @InjectModel(EXAM_ATTEMPT_MODEL) private readonly attempts: Model<ExamAttemptDoc>,
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly settle: ExamSettleService,
    private readonly files: StepFilesService,
    private readonly students: StudentDirectory,
  ) {}

  /** An exam of the caller's workspace (not deleted); anything else is the uniform 404 (AC-16.1). */
  async load(p: AuthPrincipal, id: string): Promise<ExamDoc> {
    if (!Types.ObjectId.isValid(id)) throw notFound();
    const doc = await scoped(this.exams, p.workspaceId)
      .findOne({ _id: oid(id), phase: { $ne: 'deleted' } })
      .lean<ExamDoc>();
    if (!doc) throw notFound();
    return doc;
  }

  private classDocs(workspaceId: string, classIds: readonly Types.ObjectId[]) {
    return scoped(this.classes, workspaceId)
      .find({ _id: { $in: classIds } })
      .lean<ClassDoc[]>();
  }

  private attemptCount(workspaceId: string, examId: Types.ObjectId) {
    return scoped(this.attempts, workspaceId).count({ examId });
  }

  private async dto(p: AuthPrincipal, doc: ExamDoc): Promise<Exam> {
    const now = this.clock.now();
    const today = todayOf(this.clock);
    const [classes, attemptCount] = await Promise.all([
      this.classDocs(p.workspaceId, doc.classIds),
      this.attemptCount(p.workspaceId, doc._id),
    ]);
    return {
      id: String(doc._id),
      name: doc.name,
      content: examContent(doc),
      classIds: classes.map((c) => String(c._id)),
      classes: classes
        .map((c) => ({
          id: String(c._id),
          name: c.name,
          status: statusOf(c, today),
          startDate: c.startDate,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      opensAt: doc.opensAt?.toISOString() ?? null,
      durationMin: doc.durationMin,
      closesAt: doc.closesAt?.toISOString() ?? null,
      state: examStateAt({ ...doc, phase: doc.phase === 'deleted' ? 'draft' : doc.phase }, now),
      locked: doc.locked || attemptCount > 0,
      attemptCount,
      version: doc.version,
      updatedAt: doc.updatedAt.toISOString(),
      serverNow: now.toISOString(),
    };
  }

  /* ---------- T10 (REQ-1) ---------- */

  async list(p: AuthPrincipal): Promise<{ items: ExamListItem[]; serverNow: string }> {
    await this.settle.settle(p.workspaceId);
    const now = this.clock.now();
    const today = todayOf(this.clock);
    const docs = await scoped(this.exams, p.workspaceId)
      .find({ phase: { $ne: 'deleted' } })
      .lean<ExamDoc[]>();
    const classIds = [...new Set(docs.flatMap((d) => d.classIds.map(String)))].map(oid);
    const classes = new Map(
      (await this.classDocs(p.workspaceId, classIds)).map((c) => [String(c._id), c]),
    );
    const rows = await scoped(this.members, p.workspaceId)
      .find({ classId: { $in: classIds }, removedAt: null })
      .select({ classId: 1, studentId: 1 })
      .lean<Pick<MemberDoc, 'classId' | 'studentId'>[]>();
    const activated = new Set(
      (await this.students.byIds(p.workspaceId, [...new Set(rows.map((r) => String(r.studentId)))]))
        .filter(isActivated)
        .map((s) => s.id),
    );
    const counts: { _id: Types.ObjectId; n: number; done: number }[] = await scoped(
      this.attempts,
      p.workspaceId,
    ).aggregate([
      { $match: { examId: { $in: docs.map((d) => d._id) } } },
      {
        $group: {
          _id: '$examId',
          n: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        },
      },
    ]);
    const byExam = new Map(counts.map((c) => [String(c._id), c]));
    const items = docs.map((d): ExamListItem => {
      const content = examContent(d);
      const assigned = d.classIds.map((c) => classes.get(String(c))).filter((c) => !!c);
      // "HV dự thi": activated current members of an assigned class that has started (entity "HV dự thi").
      const takers = new Set(
        rows
          .filter((r) => {
            const c = classes.get(String(r.classId));
            return (
              c &&
              d.classIds.some((x) => x.equals(r.classId)) &&
              statusOf(c, today) !== 'upcoming' &&
              activated.has(String(r.studentId))
            );
          })
          .map((r) => String(r.studentId)),
      );
      const c = byExam.get(String(d._id));
      return {
        id: String(d._id),
        name: d.name,
        questionCount: content.questions.length,
        totalPoints: setPoints(content),
        classes: assigned
          .map((x) => ({ id: String(x._id), name: x.name }))
          .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        opensAt: d.opensAt?.toISOString() ?? null,
        durationMin: d.durationMin,
        closesAt: d.closesAt?.toISOString() ?? null,
        state: examStateAt({ ...d, phase: d.phase === 'deleted' ? 'draft' : d.phase }, now),
        locked: d.locked || (c?.n ?? 0) > 0,
        submitted: c?.done ?? 0,
        takers: takers.size,
        updatedAt: d.updatedAt.toISOString(),
      };
    });
    return { items, serverNow: now.toISOString() };
  }

  /** AC-3.1: classes that can be assigned — Sắp bắt đầu or Đang học, with their size. */
  async classOptions(p: AuthPrincipal): Promise<{ items: ExamClassOption[] }> {
    const today = todayOf(this.clock);
    const docs = await scoped(this.classes, p.workspaceId)
      .find({ endDate: null })
      .lean<ClassDoc[]>();
    return {
      items: docs
        .map((c) => ({
          id: String(c._id),
          name: c.name,
          status: statusOf(c, today),
          startDate: c.startDate,
          memberCount: c.memberCount,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    };
  }

  async get(p: AuthPrincipal, id: string): Promise<Exam> {
    const doc = await this.load(p, id);
    await this.settle.settle(p.workspaceId, doc._id);
    return this.dto(p, await this.load(p, id));
  }

  /* ---------- input rules (AC-2.2, AC-2.3, AC-2.4) ---------- */

  /** Field rules that block every save, then the content with its images taken from the workspace's file registry. */
  private async prepare(p: AuthPrincipal, input: Input): Promise<ExamDraft> {
    const name = input.name.trim();
    const nameIssue = nameProblem(name);
    if (nameIssue) throw invalid('name', nameIssue);
    const durIssue = durationProblem(input.durationMin);
    if (durIssue) throw invalid('dur', durIssue);
    const raw = input.content as { instructions?: unknown; questions?: unknown } | null;
    if (typeof raw?.instructions === 'string' && [...raw.instructions].length > L.instructionsMax)
      throw invalid('instructions', 'Hướng dẫn tối đa 2.000 ký tự');
    if (Array.isArray(raw?.questions) && raw.questions.length > L.questionsMax)
      throw invalid('questions', M.questionLimit);
    const parsed = setContentSchema.safeParse({ ...(raw ?? {}), stepId: null });
    if (!parsed.success)
      throw new AppError(
        422,
        EXERCISE_ERROR_CODES.INVALID_CONTENT,
        'Nội dung câu hỏi không hợp lệ',
      );
    const content = { ...parsed.data, stepId: null };
    const bad = firstInvalidSetProblem('-', content);
    if (bad)
      throw new AppError(
        422,
        EXERCISE_ERROR_CODES.INVALID_CONTENT,
        saveRefusedMessage(bad.message),
        {
          path: bad.path,
        },
      );
    return {
      name,
      content: await this.withFiles(p.workspaceId, content),
      classIds: [...new Set(input.classIds)],
      opensAt: date(input.opensAt),
      durationMin: input.durationMin,
      closesAt: date(input.closesAt),
    };
  }

  /** Every image is a registered file of the workspace (its metadata taken from there), like 005 sets. */
  private async withFiles(
    workspaceId: string,
    content: ExerciseSetContent,
  ): Promise<ExerciseSetContent> {
    const refs = new Map<string, FileRef>();
    for (const id of setFileIds(content)) {
      const row = await this.files.find(workspaceId, id);
      if (!row || row.kind !== 'block')
        throw new AppError(
          422,
          EXERCISE_ERROR_CODES.INVALID_CONTENT,
          saveRefusedMessage('Tệp không hợp lệ'),
        );
      refs.set(id, {
        id,
        name: row.name,
        size: row.size,
        contentType: row.contentType,
        pages: null,
      });
    }
    const ref = (r: FileRef | null) => (r ? (refs.get(r.id) ?? null) : null);
    const options = (os: Option[]) => os.map((o) => ({ ...o, image: ref(o.image) }));
    const question = <Q extends Question | SubQuestion>(q: Q): Q => {
      const out = { ...q, image: ref(q.image) };
      if (out.type === 'mcq' || out.type === 'vocab') out.options = options(out.options);
      if (out.type === 'reading') out.subs = out.subs.map(question);
      return out;
    };
    return { ...content, questions: content.questions.map(question) };
  }

  /** Assigned classes must be classes of the workspace (a foreign id is a missing one, AC-16.1). */
  private async checkClasses(p: AuthPrincipal, classIds: readonly string[]): Promise<ClassDoc[]> {
    if (!classIds.length) return [];
    const docs = await this.classDocs(p.workspaceId, classIds.map(oid));
    if (docs.length !== classIds.length) throw notFound();
    return docs;
  }

  private notReady(issues: ReturnType<typeof examIssues>): AppError {
    return new AppError(422, E.EXAM_NOT_READY, issues[0]?.message ?? M.needQuestion, { issues });
  }

  /* ---------- create / save (REQ-2, REQ-4, REQ-5) ---------- */

  /** AC-2.1: an exam exists from its first save, as "Nháp". */
  async create(p: AuthPrincipal, input: Input): Promise<Exam> {
    const draft = await this.prepare(p, input);
    const classes = await this.checkClasses(p, draft.classIds);
    const today = todayOf(this.clock);
    if (classes.some((c) => statusOf(c, today) === 'ended')) throw notFound();
    const doc = await scoped(this.exams, p.workspaceId).create({
      name: draft.name,
      searchKey: foldSearch(draft.name),
      content: draft.content,
      classIds: draft.classIds.map(oid),
      opensAt: draft.opensAt,
      durationMin: draft.durationMin,
      closesAt: draft.closesAt,
      phase: 'draft',
    });
    logExam({ action: 'exam.create', examId: String(doc._id) });
    return this.dto(p, doc.toObject() as ExamDoc);
  }

  /**
   * "Lưu nháp" / "Lưu thay đổi": a draft keeps whatever is valid field by field (AC-2.2); a scheduled exam must still meet
   * every condition (AC-4.1); after the first attempt only name, instructions, classes and a later close (AC-4.2, REQ-5);
   * a closed exam only name and instructions (AC-4.4). Never over a newer save (AC-2.7).
   */
  async save(p: AuthPrincipal, id: string, input: Input & { expectedVersion: number }) {
    const before = await this.load(p, id);
    await this.settle.settle(p.workspaceId, before._id);
    const doc = await this.load(p, id);
    if (doc.version !== input.expectedVersion)
      throw new AppError(409, CONFLICT, M.changedElsewhere, {
        currentVersion: doc.version,
        updatedAt: doc.updatedAt.toISOString(),
      });
    const now = this.clock.now();
    const state = examStateAt(
      { ...doc, phase: doc.phase === 'deleted' ? 'draft' : doc.phase },
      now,
    );
    const draft = await this.prepare(p, input);
    const old = examContent(doc);
    const questionsChanged =
      JSON.stringify(old.questions) !== JSON.stringify(draft.content.questions);
    const openChanged = !same(doc.opensAt, draft.opensAt);
    const durChanged = doc.durationMin !== draft.durationMin;
    const closeChanged = !same(doc.closesAt, draft.closesAt);
    const added = draft.classIds.filter((c) => !doc.classIds.some((x) => String(x) === c));
    const removed = doc.classIds.filter((x) => !draft.classIds.includes(String(x)));
    const classesChanged = ids(doc.classIds) !== ids(draft.classIds);
    const classes = await this.checkClasses(p, added);
    const today = todayOf(this.clock);
    if (classes.some((c) => statusOf(c, today) === 'ended')) throw notFound();

    if (state === 'closed' || state === 'archived') {
      if (questionsChanged || openChanged || durChanged || closeChanged || classesChanged)
        throw new AppError(409, E.EXAM_CLOSED, M.closedBanner);
    }
    const locked = doc.locked || (await this.attemptCount(p.workspaceId, doc._id)) > 0;
    if (locked && state !== 'closed' && state !== 'archived') {
      if (questionsChanged || openChanged || durChanged)
        throw new AppError(409, E.EXAM_LOCKED, M.justLocked);
      if (closeChanged && doc.closesAt && draft.closesAt && draft.closesAt < doc.closesAt)
        throw new AppError(409, E.EXAM_CLOSE_EARLIER, M.closeOnlyLater);
      await this.assertRemovable(p, doc, removed);
    }
    if (doc.phase === 'scheduled' && (state === 'scheduled' || state === 'open')) {
      const issues = examIssues(draft, now, { checkOpen: openChanged });
      if (issues.length) throw this.notReady(issues);
    }

    const guardLock = questionsChanged || openChanged || durChanged || removed.length > 0;
    const updated = await scoped(this.exams, p.workspaceId).findOneAndUpdate(
      {
        _id: doc._id,
        version: input.expectedVersion,
        phase: doc.phase,
        ...(guardLock ? { locked: false } : {}),
      },
      {
        $set: {
          name: draft.name,
          searchKey: foldSearch(draft.name),
          content: draft.content,
          classIds: draft.classIds.map(oid),
          opensAt: draft.opensAt,
          durationMin: draft.durationMin,
          closesAt: draft.closesAt,
        },
        $inc: { version: 1 },
      },
      { returnDocument: 'after' },
    );
    if (!updated) {
      const now2 = await this.load(p, id);
      if (now2.version !== input.expectedVersion)
        throw new AppError(409, CONFLICT, M.changedElsewhere, { currentVersion: now2.version });
      if (now2.locked && removed.length && !questionsChanged && !openChanged && !durChanged)
        await this.assertRemovable(p, now2, removed);
      throw new AppError(409, E.EXAM_LOCKED, M.justLocked);
    }
    const after = updated.toObject() as ExamDoc;
    if (closeChanged && after.closesAt && doc.phase === 'scheduled') await this.extend(p, after);
    logExam({
      action: 'exam.save',
      examId: id,
      state,
      classes: classesChanged ? after.classIds.length : undefined,
      schedule: openChanged || durChanged || closeChanged ? true : undefined,
    });
    return this.dto(p, after);
  }

  /** AC-5.4: a class can leave only when none of its current members has an attempt. */
  private async assertRemovable(
    p: AuthPrincipal,
    exam: ExamDoc,
    removed: readonly Types.ObjectId[],
  ) {
    if (!removed.length) return;
    const takers = await scoped(this.attempts, p.workspaceId)
      .find({ examId: exam._id })
      .select({ studentId: 1 })
      .lean<Pick<ExamAttemptDoc, 'studentId'>[]>();
    if (!takers.length) return;
    for (const classId of removed) {
      const hit = await scoped(this.members, p.workspaceId).exists({
        classId,
        removedAt: null,
        studentId: { $in: takers.map((t) => t.studentId) },
      });
      if (!hit) continue;
      const cls = await scoped(this.classes, p.workspaceId).findById(classId).lean<ClassDoc>();
      logExam({
        action: 'exam.class.remove',
        result: 'denied',
        examId: String(exam._id),
        classId: String(classId),
      });
      throw new AppError(409, E.EXAM_HAS_ATTEMPTS, M.cannotRemoveClass(cls?.name ?? ''), {
        classId: String(classId),
      });
    }
  }

  /** AC-5.2: a later close moves the end of every running attempt to min(start + duration, new close). */
  private async extend(p: AuthPrincipal, exam: ExamDoc) {
    const close = exam.closesAt;
    if (!close || !exam.durationMin) return;
    const r = await scoped(this.attempts, p.workspaceId).updateMany(
      { examId: exam._id, status: 'doing' },
      [
        {
          $set: {
            endsAt: {
              $min: [{ $add: ['$startedAt', exam.durationMin * 60_000] }, close],
            },
          },
        },
      ] as never,
    );
    await this.settle.scheduleAt(p.workspaceId, close);
    if (r.modifiedCount)
      logExam({ action: 'exam.close.extend', examId: String(exam._id), count: r.modifiedCount });
  }

  /* ---------- schedule / unschedule (REQ-3) ---------- */

  /** AC-3.4, AC-3.5: "Lên lịch" saves and schedules a draft that meets every condition; otherwise nothing changes. */
  async schedule(p: AuthPrincipal, id: string, input: Input & { expectedVersion: number }) {
    const doc = await this.load(p, id);
    if (doc.phase !== 'draft') throw new AppError(409, E.EXAM_STATE, 'Bài thi đã được lên lịch.');
    if (doc.version !== input.expectedVersion)
      throw new AppError(409, CONFLICT, M.changedElsewhere, { currentVersion: doc.version });
    const draft = await this.prepare(p, input);
    const classes = await this.checkClasses(p, draft.classIds);
    const today = todayOf(this.clock);
    if (classes.some((c) => statusOf(c, today) === 'ended')) throw notFound();
    const issues = examIssues(draft, this.clock.now(), { checkOpen: true });
    if (issues.length) {
      logExam({ action: 'exam.schedule', result: 'denied', examId: id, count: issues.length });
      throw this.notReady(issues);
    }
    const updated = await scoped(this.exams, p.workspaceId).findOneAndUpdate(
      { _id: doc._id, version: input.expectedVersion, phase: 'draft' },
      {
        $set: {
          name: draft.name,
          searchKey: foldSearch(draft.name),
          content: draft.content,
          classIds: draft.classIds.map(oid),
          opensAt: draft.opensAt,
          durationMin: draft.durationMin,
          closesAt: draft.closesAt,
          phase: 'scheduled',
          settledAt: null,
        },
        $inc: { version: 1 },
      },
      { returnDocument: 'after' },
    );
    if (!updated) throw new AppError(409, CONFLICT, M.changedElsewhere);
    if (draft.closesAt) await this.settle.scheduleAt(p.workspaceId, draft.closesAt);
    logExam({ action: 'exam.schedule', examId: id, classes: draft.classIds.length });
    return this.dto(p, updated.toObject() as ExamDoc);
  }

  /** AC-3.8: back to "Nháp" while nobody has started; content, classes and schedule kept. */
  async unschedule(p: AuthPrincipal, id: string, expectedVersion: number) {
    const doc = await this.load(p, id);
    const state = examStateAt(
      { ...doc, phase: doc.phase === 'deleted' ? 'draft' : doc.phase },
      this.clock.now(),
    );
    if (state !== 'scheduled' && state !== 'open')
      throw new AppError(409, E.EXAM_STATE, 'Chỉ hủy lịch được bài thi Đã lên lịch hoặc Đang mở.');
    const updated = await scoped(this.exams, p.workspaceId).findOneAndUpdate(
      { _id: doc._id, phase: 'scheduled', locked: false, version: expectedVersion },
      { $set: { phase: 'draft' }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
    if (!updated) {
      const now = await this.load(p, id);
      if (now.locked) {
        logExam({ action: 'exam.unschedule', result: 'denied', examId: id });
        throw new AppError(
          409,
          E.EXAM_HAS_ATTEMPTS,
          'Bài thi đã có học viên làm bài nên không hủy lịch được.',
        );
      }
      throw new AppError(409, CONFLICT, M.changedElsewhere, { currentVersion: now.version });
    }
    logExam({ action: 'exam.unschedule', examId: id });
    return this.dto(p, updated.toObject() as ExamDoc);
  }

  /* ---------- delete / archive / restore / duplicate (REQ-6) ---------- */

  /** AC-6.1, AC-6.2: only without any attempt — also one started after the confirmation opened (atomic on `locked`). */
  async remove(p: AuthPrincipal, id: string): Promise<void> {
    const doc = await this.load(p, id);
    const hasAttempts = (await this.attemptCount(p.workspaceId, doc._id)) > 0;
    const r = hasAttempts
      ? { modifiedCount: 0 }
      : await scoped(this.exams, p.workspaceId).updateOne(
          { _id: doc._id, locked: false, phase: { $ne: 'deleted' } },
          { $set: { phase: 'deleted' }, $inc: { version: 1 } },
        );
    if (!r.modifiedCount) {
      logExam({ action: 'exam.delete', result: 'denied', examId: id });
      throw new AppError(409, E.EXAM_HAS_ATTEMPTS, M.hasAttempts);
    }
    logExam({ action: 'exam.delete', examId: id });
  }

  /** AC-6.3, AC-6.4: only a closed exam; attempts, submissions and results are kept. */
  async archive(p: AuthPrincipal, id: string) {
    const doc = await this.load(p, id);
    await this.settle.settle(p.workspaceId, doc._id);
    const state = examStateAt(
      { ...doc, phase: doc.phase === 'deleted' ? 'draft' : doc.phase },
      this.clock.now(),
    );
    if (state !== 'closed') throw new AppError(409, E.EXAM_STATE, M.archiveOnlyClosed);
    const updated = await scoped(this.exams, p.workspaceId).findOneAndUpdate(
      { _id: doc._id, phase: 'scheduled' },
      { $set: { phase: 'archived' }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
    if (!updated) throw new AppError(409, E.EXAM_STATE, M.archiveOnlyClosed);
    logExam({ action: 'exam.archive', examId: id });
    return this.dto(p, updated.toObject() as ExamDoc);
  }

  /** AC-6.5: back to "Đã đóng" (its close time has passed), visible again with its results. */
  async restore(p: AuthPrincipal, id: string) {
    const doc = await this.load(p, id);
    const updated = await scoped(this.exams, p.workspaceId).findOneAndUpdate(
      { _id: doc._id, phase: 'archived' },
      { $set: { phase: 'scheduled' }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    );
    if (!updated) throw new AppError(409, E.EXAM_STATE, 'Bài thi không ở trạng thái Lưu trữ.');
    logExam({ action: 'exam.restore', examId: id });
    return this.dto(p, updated.toObject() as ExamDoc);
  }

  /** AC-6.6: a new draft with the questions, instructions and duration; no classes, times, attempts. */
  async duplicate(p: AuthPrincipal, id: string): Promise<Exam> {
    const doc = await this.load(p, id);
    const name = setCopyTitle(doc.name);
    const copy = await scoped(this.exams, p.workspaceId).create({
      name,
      searchKey: foldSearch(name),
      content: examContent(doc),
      classIds: [],
      opensAt: null,
      durationMin: doc.durationMin,
      closesAt: null,
      phase: 'draft',
    });
    logExam({ action: 'exam.duplicate', examId: String(copy._id), from: id });
    return this.dto(p, copy.toObject() as ExamDoc);
  }
}

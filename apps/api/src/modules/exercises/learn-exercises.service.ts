import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type Answers,
  CLASS_ERROR_CODES,
  EXERCISE_ERROR_CODES as E,
  EXERCISE_LEARN_MESSAGES as LM,
  type ExerciseSetContent,
  type ExerciseView,
  type Review,
  type SaveAttemptBody,
  type SubmitBody,
  answerState,
  gradeSet,
  learnQuestion,
  makeShuffles,
  reviewRows,
  scorePercent,
  setContentSchema,
  setPoints,
  vnDayEnd,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { ClassAccess, type ItemInClass } from '../classes/class-access.js';
import { effectiveDeadline } from '../classes/class-visibility.js';
import { LearnClassesService } from '../classes/learn-classes.service.js';
import type { ItemDoc } from '../curriculum/curriculum.model.js';
import { ATTEMPT_MODEL, type AttemptDoc } from './exercises.model.js';
import { logExercise } from './exercises.log.js';

const reviewPath = (classId: string, setId: string) =>
  `/hv/lop/${classId}/bai-tap/${setId}/ket-qua`;

const contentOf = (item: ItemDoc): ExerciseSetContent => {
  const parsed = setContentSchema.safeParse(item.content);
  if (!parsed.success) throw notFound();
  return parsed.data;
};

/** Answers of known questions only (unknown ids are dropped, never stored). */
const known = (content: ExerciseSetContent, answers: Answers): Answers => {
  const ids = new Set(content.questions.map((q) => q.id));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => ids.has(id)));
};

/** S05 / S06 of the HV (REQ-14 … REQ-17, REQ-21, REQ-23): one attempt per set and class, graded at submission. */
@Injectable()
export class LearnExercisesService {
  constructor(
    @InjectModel(ATTEMPT_MODEL) private readonly attempts: Model<AttemptDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: ClassAccess,
    private readonly classes: LearnClassesService,
  ) {}

  /** The set in the caller's class (member and started, else 003's refusals); A05 for anything else. */
  private async found(p: AuthPrincipal, classId: string, setId: string): Promise<ItemInClass> {
    const found = await this.access.item(p, classId, setId);
    if (!found || found.item.section !== 'exercise') throw notFound();
    return found;
  }

  private attemptOf(p: AuthPrincipal, classId: string, setId: string) {
    return scoped(this.attempts, p.workspaceId)
      .findOne({
        classId: new Types.ObjectId(classId),
        setId: new Types.ObjectId(setId),
        studentId: new Types.ObjectId(p.userId),
      })
      .lean<AttemptDoc>();
  }

  private alreadySubmitted(classId: string, setId: string): AppError {
    return new AppError(409, E.ALREADY_SUBMITTED, LM.alreadySubmitted, {
      review: reviewPath(classId, setId),
    });
  }

  /**
   * What every start / save / submit checks: not submitted (AC-17.7, AC-14.9), visible and class not ended (AC-21.6,
   * AC-21.8), open = a current deadline (AC-23.9). Saved answers are never touched by a refusal.
   */
  private async workGate(p: AuthPrincipal, classId: string, setId: string) {
    const found = await this.found(p, classId, setId);
    const attempt = await this.attemptOf(p, classId, setId);
    if (attempt?.status === 'submitted') throw this.alreadySubmitted(classId, setId);
    if (!found.visible && !attempt) throw notFound();
    if (!found.visible || found.status === 'ended')
      throw new AppError(409, CLASS_ERROR_CODES.WORK_UNAVAILABLE, LM.unavailable, {
        back: this.access.backOf(found),
      });
    if (!effectiveDeadline(found.cls, found.unit, setId))
      throw new AppError(
        409,
        E.NOT_OPEN,
        attempt ? `${LM.notOpen} ${LM.keptAnswers}` : LM.notOpen,
        { kept: !!attempt },
      );
    return { found, attempt, content: contentOf(found.item) };
  }

  /** S05 (AC-14.1, AC-1.5, AC-23.3, AC-23.8): the start screen, plus the questions of an attempt in progress. */
  async view(p: AuthPrincipal, classId: string, setId: string): Promise<ExerciseView> {
    const { set } = await this.classes.item(p, classId, setId, false);
    const found = await this.found(p, classId, setId);
    if (!set) throw notFound();
    const content = contentOf(found.item);
    const attempt = await this.attemptOf(p, classId, setId);
    const step = content.stepId
      ? found.unit?.steps.find((s) => String(s._id) === content.stepId)
      : undefined;
    const doing = attempt?.status === 'doing' && set.canWork;
    if (doing && attempt.notice)
      await scoped(this.attempts, p.workspaceId).updateOne(
        { _id: attempt._id },
        { $set: { notice: false } },
      );
    return {
      classId,
      classStatus: found.status,
      lesson: { id: String(found.lesson._id), name: found.lesson.name },
      set: {
        ...set,
        instructions: content.instructions,
        questionCount: content.questions.length,
        totalPoints: setPoints(content),
      },
      practiceFor: step ? { id: String(step._id), title: step.title } : null,
      hasAttempt: !!attempt,
      attempt: doing
        ? {
            questions: content.questions.map((q) => learnQuestion(q, attempt.shuffles)),
            answers: known(content, attempt.answers ?? {}),
            lastIndex: Math.min(attempt.lastIndex ?? 0, Math.max(0, content.questions.length - 1)),
            updated: attempt.notice,
          }
        : null,
    };
  }

  /** "Bắt đầu làm" (AC-17.1, AC-14.8): one attempt, also when two devices start at once (unique index). */
  async start(p: AuthPrincipal, classId: string, setId: string): Promise<ExerciseView> {
    const { found, attempt, content } = await this.workGate(p, classId, setId);
    if (!attempt) {
      try {
        await scoped(this.attempts, p.workspaceId).create({
          classId: new Types.ObjectId(classId),
          setId: new Types.ObjectId(setId),
          lessonId: found.lesson._id,
          studentId: new Types.ObjectId(p.userId),
          status: 'doing',
          startedAt: this.clock.now(),
          shuffles: makeShuffles(content),
          answers: {},
        });
        logExercise({ action: 'attempt.start', classId, setId });
      } catch (err) {
        // The other device created it first: continue that attempt.
        if ((err as { code?: number }).code !== 11000) throw err;
      }
    }
    return this.view(p, classId, setId);
  }

  /** Autosave (AC-14.4): the changed questions, last write wins per question. */
  async save(
    p: AuthPrincipal,
    classId: string,
    setId: string,
    body: SaveAttemptBody,
  ): Promise<{ savedAt: string }> {
    const { attempt, content } = await this.workGate(p, classId, setId).catch((err: unknown) => {
      logExercise({
        action: 'attempt.save',
        result: 'denied',
        classId,
        setId,
        code: (err as AppError).code,
      });
      throw err;
    });
    if (!attempt) throw notFound();
    const $set: Record<string, unknown> = {};
    for (const [id, a] of Object.entries(known(content, body.answers ?? {})))
      $set[`answers.${id}`] = a;
    if (body.lastIndex !== undefined) $set['lastIndex'] = body.lastIndex;
    const r = await scoped(this.attempts, p.workspaceId).updateOne(
      { _id: attempt._id, status: 'doing' },
      { $set, $inc: { version: 1 } },
    );
    if (!r.matchedCount) throw this.alreadySubmitted(classId, setId);
    return { savedAt: this.clock.now().toISOString() };
  }

  /** "Nộp bài" (AC-15.2, AC-15.3, AC-15.5, AC-16.1): graded once with the current key; the same key is the same submission. */
  async submit(
    p: AuthPrincipal,
    classId: string,
    setId: string,
    body: SubmitBody,
  ): Promise<{ submitted: true }> {
    const before = await this.attemptOf(p, classId, setId);
    if (before?.status === 'submitted') {
      if (before.submitKey === body.submitKey) return { submitted: true };
      throw this.alreadySubmitted(classId, setId);
    }
    const { found, attempt, content } = await this.workGate(p, classId, setId);
    if (!attempt) throw notFound();
    const answers = {
      ...known(content, attempt.answers ?? {}),
      ...known(content, body.answers ?? {}),
    };
    if (!content.questions.some((q) => answerState(q, answers[q.id]) !== 'none'))
      throw new AppError(422, E.NOTHING_ANSWERED, LM.nothingAnswered);
    const grade = gradeSet(content, answers);
    const done = await scoped(this.attempts, p.workspaceId).findOneAndUpdate(
      { _id: attempt._id, status: 'doing' },
      {
        $set: {
          answers,
          status: 'submitted',
          submittedAt: this.clock.now(),
          submitKey: body.submitKey,
          score: grade.score,
          maxScore: grade.maxScore,
          results: grade.results,
          gradedVersion: found.item.version,
        },
        $inc: { version: 1 },
      },
    );
    if (!done) {
      const now = await this.attemptOf(p, classId, setId);
      if (now?.submitKey === body.submitKey) return { submitted: true };
      throw this.alreadySubmitted(classId, setId);
    }
    logExercise({
      action: 'attempt.submit',
      classId,
      setId,
      score: grade.score,
      max: grade.maxScore,
    });
    return { submitted: true };
  }

  /** S06 "Xem lại bài làm" (AC-16.2 … AC-16.5, AC-21.4, AC-21.8, AC-23.1). */
  async review(p: AuthPrincipal, classId: string, setId: string): Promise<Review> {
    const found = await this.found(p, classId, setId);
    if (!found.visible) throw notFound();
    const attempt = await this.attemptOf(p, classId, setId);
    const base = {
      classId,
      lesson: { id: String(found.lesson._id), name: found.lesson.name },
      setId,
      title: found.item.title,
    };
    if (attempt?.status !== 'submitted' || !attempt.submittedAt)
      return {
        ...base,
        submitted: false,
        submittedAt: null,
        late: false,
        deadline: null,
        score: null,
        maxScore: null,
        percent: null,
        regrade: null,
        rows: [],
      };
    const content = contentOf(found.item);
    const deadline = effectiveDeadline(found.cls, found.unit, setId);
    const score = attempt.score ?? 0;
    const max = attempt.maxScore ?? 0;
    const last = attempt.regrades?.at(-1);
    return {
      ...base,
      submitted: true,
      submittedAt: attempt.submittedAt.toISOString(),
      late: !!deadline && attempt.submittedAt > vnDayEnd(deadline),
      deadline,
      score,
      maxScore: max,
      percent: scorePercent(score, max),
      regrade: last ? { at: last.at.toISOString(), from: last.from, to: last.to } : null,
      rows: reviewRows(content, attempt.answers ?? {}, attempt.results ?? []),
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  EXERCISE_ERROR_CODES as E,
  type ExerciseSetContent,
  type FileRef,
  type Option,
  type Question,
  type SubQuestion,
  firstInvalidSetProblem,
  gradeSet,
  keptAnswers,
  lockedRule,
  regradeQuestion,
  saveRefusedMessage,
  setContentSchema,
  setFileIds,
  setStructure,
} from '@sat/shared';
import type { Model, Types } from 'mongoose';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import type { ItemDoc } from '../curriculum/curriculum.model.js';
import type { SetHooks } from '../curriculum/curriculum.ports.js';
import { StepFilesService } from '../steps/step-files.service.js';
import { ATTEMPT_MODEL, type AttemptDoc } from './exercises.model.js';
import { logExercise } from './exercises.log.js';

const contentOf = (item: ItemDoc): ExerciseSetContent | null => {
  const parsed = setContentSchema.safeParse(item.content);
  return parsed.success ? parsed.data : null;
};

type Graded = Pick<AttemptDoc, '_id' | 'answers' | 'score' | 'results'>;

/** Submissions whose recorded grade differs from a grading against `content` (AC-19.1, AC-19.2, AC-19.4). */
const regraded = (content: ExerciseSetContent, attempts: readonly Graded[]) =>
  attempts.flatMap((a) => {
    const grade = gradeSet(content, a.answers ?? {});
    const same =
      grade.score === a.score && JSON.stringify(grade.results) === JSON.stringify(a.results);
    return same ? [] : [{ attempt: a, grade }];
  });

const REGRADE_CHUNK = 100;

const fileIdsOf = (item: ItemDoc): string[] => {
  const c = contentOf(item);
  return c ? setFileIds(c) : [];
};

/** 005's side of 002's set lifecycle (bound to `SET_HOOKS`). */
@Injectable()
export class SetHooksService implements SetHooks {
  constructor(
    private readonly files: StepFilesService,
    @InjectModel(ATTEMPT_MODEL) private readonly attempts: Model<AttemptDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  private submitted(workspaceId: string, setId: Types.ObjectId): Promise<Graded[]> {
    return scoped(this.attempts, workspaceId)
      .find({ setId, status: 'submitted' })
      .select({ answers: 1, score: 1, results: 1 })
      .lean<Graded[]>();
  }

  /** Submissions of a set in every class (AC-18.1, AC-18.2). */
  submissions(workspaceId: string, setId: Types.ObjectId): Promise<number> {
    return scoped(this.attempts, workspaceId).count({ setId, status: 'submitted' });
  }

  /**
   * AC-12.14: no invalid field; every image is a registered file of the workspace (its metadata taken from there).
   * AC-18.1: once the set has a submission its structure stays as it is.
   * AC-19.1, AC-19.2: a change that alters the score of a submission needs "Chấm lại và lưu" (`confirmRegrade`).
   */
  async prepare(
    workspaceId: string,
    title: string,
    raw: unknown,
    before: ItemDoc,
    confirmRegrade = false,
  ): Promise<ExerciseSetContent> {
    const content = setContentSchema.parse(raw);
    const invalid = firstInvalidSetProblem(title, content);
    if (invalid)
      throw new AppError(422, E.INVALID_CONTENT, saveRefusedMessage(invalid.message), {
        path: invalid.path,
      });
    const previous = contentOf(before);
    if (previous && setStructure(previous) !== setStructure(content)) {
      const n = await this.submissions(workspaceId, before._id);
      if (n) throw new AppError(409, E.SET_LOCKED, saveRefusedMessage(lockedRule(n)), { count: n });
    }
    if (previous && !confirmRegrade) {
      const n = regraded(content, await this.submitted(workspaceId, before._id)).filter(
        (r) => r.grade.score !== r.attempt.score,
      ).length;
      if (n) throw new AppError(409, E.REGRADE_REQUIRED, regradeQuestion(n), { count: n });
    }
    const refs = new Map<string, FileRef>();
    for (const id of setFileIds(content)) {
      const row = await this.files.find(workspaceId, id);
      if (!row || row.kind !== 'block')
        throw new AppError(422, E.INVALID_CONTENT, saveRefusedMessage('Tệp không hợp lệ'));
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

  /**
   * AC-3.5: images the set no longer uses are released when nothing else uses them.
   * AC-18.4: after a structure change, attempts in progress keep the answers of the parts that still exist and are told.
   */
  async saved(workspaceId: string, before: ItemDoc, after: ItemDoc): Promise<void> {
    if (after.section !== 'exercise') return;
    const still = new Set(fileIdsOf(after));
    await this.files.release(
      workspaceId,
      fileIdsOf(before).filter((id) => !still.has(id)),
    );
    const [old, now] = [contentOf(before), contentOf(after)];
    if (!old || !now) return;
    await this.regrade(workspaceId, after, now);
    if (setStructure(old) === setStructure(now)) return;
    const scope = scoped(this.attempts, workspaceId);
    const doing = await scope
      .find({ setId: after._id, status: 'doing' })
      .select({ answers: 1 })
      .lean<Pick<AttemptDoc, '_id' | 'answers'>[]>();
    if (!doing.length) return;
    await Promise.all(
      doing.map((a) =>
        scope.updateOne(
          { _id: a._id, status: 'doing' },
          { $set: { answers: keptAnswers(now, a.answers ?? {}), notice: true } },
        ),
      ),
    );
    logExercise({ action: 'set.structure', setId: String(after._id), count: doing.length });
  }

  /** AC-3.5, AC-22.1, AC-13.9: images of deleted sets are released when nothing else uses them. */
  async removed(workspaceId: string, items: readonly ItemDoc[]): Promise<void> {
    const sets = items.filter((i) => i.section === 'exercise');
    if (sets.length) await this.files.release(workspaceId, sets.flatMap(fileIdsOf));
  }

  /**
   * AC-19.4 … AC-19.6: every submission of the set in every class (hidden sections and ended classes included) is graded
   * with the saved key; a changed score is recorded with a re-grade entry (S06 / T14 note) and read by 008 / 009.
   */
  private async regrade(workspaceId: string, item: ItemDoc, content: ExerciseSetContent) {
    const changed = regraded(content, await this.submitted(workspaceId, item._id));
    if (!changed.length) return;
    const scope = scoped(this.attempts, workspaceId);
    const at = this.clock.now();
    let scores = 0;
    for (let k = 0; k < changed.length; k += REGRADE_CHUNK) {
      await Promise.all(
        changed.slice(k, k + REGRADE_CHUNK).map(({ attempt, grade }) => {
          const moved = grade.score !== attempt.score;
          if (moved) scores++;
          return scope.updateOne(
            { _id: attempt._id, status: 'submitted' },
            {
              $set: {
                score: grade.score,
                maxScore: grade.maxScore,
                results: grade.results,
                gradedVersion: item.version,
              },
              ...(moved
                ? { $push: { regrades: { at, from: attempt.score ?? 0, to: grade.score } } }
                : {}),
            },
          );
        }),
      );
    }
    logExercise({ action: 'set.regrade', setId: String(item._id), count: scores });
  }
}

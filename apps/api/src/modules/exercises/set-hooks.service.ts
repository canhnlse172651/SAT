import { Injectable } from '@nestjs/common';
import {
  EXERCISE_ERROR_CODES as E,
  type ExerciseSetContent,
  type FileRef,
  type Option,
  type Question,
  type SubQuestion,
  firstInvalidSetProblem,
  saveRefusedMessage,
  setContentSchema,
  setFileIds,
} from '@sat/shared';
import { AppError } from '../../errors.js';
import type { ItemDoc } from '../curriculum/curriculum.model.js';
import type { SetHooks } from '../curriculum/curriculum.ports.js';
import { StepFilesService } from '../steps/step-files.service.js';

const contentOf = (item: ItemDoc): ExerciseSetContent | null => {
  const parsed = setContentSchema.safeParse(item.content);
  return parsed.success ? parsed.data : null;
};

const fileIdsOf = (item: ItemDoc): string[] => {
  const c = contentOf(item);
  return c ? setFileIds(c) : [];
};

/** 005's side of 002's set lifecycle (bound to `SET_HOOKS`). */
@Injectable()
export class SetHooksService implements SetHooks {
  constructor(private readonly files: StepFilesService) {}

  /** AC-12.14: no invalid field; every image is a registered file of the workspace (its metadata taken from there). */
  async prepare(workspaceId: string, title: string, raw: unknown): Promise<ExerciseSetContent> {
    const content = setContentSchema.parse(raw);
    const invalid = firstInvalidSetProblem(title, content);
    if (invalid)
      throw new AppError(422, E.INVALID_CONTENT, saveRefusedMessage(invalid.message), {
        path: invalid.path,
      });
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

  /** AC-3.5: images the set no longer uses are released when nothing else uses them. */
  async saved(workspaceId: string, before: ItemDoc, after: ItemDoc): Promise<void> {
    if (after.section !== 'exercise') return;
    const still = new Set(fileIdsOf(after));
    await this.files.release(
      workspaceId,
      fileIdsOf(before).filter((id) => !still.has(id)),
    );
  }

  /** AC-3.5, AC-22.1, AC-13.9: images of deleted sets are released when nothing else uses them. */
  async removed(workspaceId: string, items: readonly ItemDoc[]): Promise<void> {
    const sets = items.filter((i) => i.section === 'exercise');
    if (sets.length) await this.files.release(workspaceId, sets.flatMap(fileIdsOf));
  }
}

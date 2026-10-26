import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type Block,
  type FileRef,
  STEP_ERROR_CODES,
  type StepContent,
  sanitizeRichText,
  saveBlockedMessage,
  stepContentSchema,
  stepFileIds,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { ClassAccess } from '../classes/class-access.js';
import type { ItemDoc } from '../curriculum/curriculum.model.js';
import type { StepHooks } from '../curriculum/curriculum.ports.js';
import { StepFilesService } from './step-files.service.js';
import { CARD_MARK_MODEL, type CardMarkDoc } from './steps.model.js';
import { STEP_PRACTICE, type StepPractice } from './steps.ports.js';

const contentOf = (item: ItemDoc): StepContent => {
  const parsed = stepContentSchema.safeParse(item.content);
  return parsed.success ? parsed.data : { goal: '', blocks: [] };
};

const cardIds = (content: StepContent): Set<string> =>
  new Set(content.blocks.flatMap((b) => (b.type === 'deck' ? b.cards.map((c) => c.id) : [])));

/** 004's side of 002's step lifecycle (bound to `STEP_HOOKS`). */
@Injectable()
export class StepHooksService implements StepHooks {
  constructor(
    @InjectModel(CARD_MARK_MODEL) private readonly marks: Model<CardMarkDoc>,
    @Inject(STEP_PRACTICE) private readonly practice: StepPractice,
    private readonly files: StepFilesService,
    private readonly access: ClassAccess,
  ) {}

  /** Rich text sanitised (AC-3.7, NFR-6); every file must be a registered file of the workspace (NFR-6). */
  async prepare(workspaceId: string, raw: unknown): Promise<StepContent> {
    const content = stepContentSchema.parse(raw);
    const refs = new Map<string, FileRef>();
    for (const id of new Set(stepFileIds(content))) {
      const row = await this.files.find(workspaceId, id);
      if (!row || (row.kind !== 'block' && row.kind !== 'card')) {
        throw new AppError(
          422,
          STEP_ERROR_CODES.INVALID_CONTENT,
          saveBlockedMessage('Tệp không hợp lệ'),
        );
      }
      refs.set(id, {
        id,
        name: row.name,
        size: row.size,
        contentType: row.contentType,
        pages: row.preview ? row.preview.length : null,
      });
    }
    const ref = (r: FileRef | null) => (r ? (refs.get(r.id) ?? null) : null);
    const block = (b: Block): Block => {
      switch (b.type) {
        case 'text':
          return { ...b, html: sanitizeRichText(b.html) };
        case 'grammar':
          return { ...b, explanation: sanitizeRichText(b.explanation) };
        case 'deck':
          return {
            ...b,
            cards: b.cards.map((c) => ({ ...c, image: ref(c.image), audio: ref(c.audio) })),
          };
        case 'video':
          return { ...b, file: b.youtube ? null : ref(b.file) };
        case 'document':
        case 'image':
        case 'audio':
          return { ...b, file: ref(b.file) };
        default:
          return b;
      }
    };
    return { ...content, blocks: content.blocks.map(block) };
  }

  /** AC-3.3, AC-17.5: marks of cards no longer in the step go; files no longer used are released (AC-5.5). */
  async saved(workspaceId: string, before: ItemDoc, after: ItemDoc): Promise<void> {
    if (after.section !== 'lesson') return;
    const [was, now] = [contentOf(before), contentOf(after)];
    const kept = cardIds(now);
    const gone = [...cardIds(was)].filter((id) => !kept.has(id));
    if (gone.length) {
      await scoped(this.marks, workspaceId).deleteMany({
        stepId: after._id,
        cardId: { $in: gone },
      });
    }
    const still = new Set(stepFileIds(now));
    await this.files.release(
      workspaceId,
      stepFileIds(was).filter((id) => !still.has(id)),
    );
  }

  /** AC-8.1, AC-9.5: marks of the steps' decks, their files and their practice links. */
  async removed(workspaceId: string, items: readonly ItemDoc[]): Promise<void> {
    const steps = items.filter((i) => i.section === 'lesson');
    if (!steps.length) return;
    await scoped(this.marks, workspaceId).deleteMany({
      stepId: { $in: steps.map((s) => new Types.ObjectId(String(s._id))) },
    });
    await this.practice.unlink(
      workspaceId,
      steps.map((s) => String(s._id)),
    );
    await this.files.release(
      workspaceId,
      steps.flatMap((s) => stepFileIds(contentOf(s))),
    );
  }

  audience(workspaceId: string, curriculumId: string, lessonId: string): Promise<number> {
    return this.access.stepsAudience(workspaceId, curriculumId, lessonId);
  }

  async linkedSets(workspaceId: string, stepIds: readonly string[]): Promise<number> {
    const links = await this.practice.setsOf(workspaceId, stepIds);
    return new Set([...links.values()].flat()).size;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type StepContent, stepContentSchema, stepFileIds } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { scoped } from '../../common/tenancy/scoped.js';
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

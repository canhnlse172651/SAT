import { Inject, Injectable } from '@nestjs/common';
import { CURRICULUM_MESSAGES as M, type AiLabel, type UsingClass } from '@sat/shared';
import { AppError } from '../../errors.js';
import type { LessonDoc } from './curriculum.model.js';
import {
  AI_DRAFTS,
  type AiDrafts,
  CURRICULUM_CLASSES,
  type CurriculumClasses,
  LEARNING_DATA,
  type LearningData,
} from './curriculum.ports.js';

/** AC-17.4: the client acted on data changed in another tab or device. */
export const changedElsewhere = (details?: unknown): AppError =>
  new AppError(409, 'CONFLICT', M.changedElsewhere, details);

export const isDuplicateKey = (err: unknown): boolean =>
  (err as { code?: number } | null)?.code === 11000;

/** Facts other modules own (003 classes, 005 learning data, 010 AI labels), looked up through the ports. */
@Injectable()
export class CurriculumContext {
  constructor(
    @Inject(CURRICULUM_CLASSES) readonly classes: CurriculumClasses,
    @Inject(LEARNING_DATA) private readonly learning: LearningData,
    @Inject(AI_DRAFTS) readonly ai: AiDrafts,
  ) {}

  async usingClasses(workspaceId: string, curriculumId: string): Promise<UsingClass[]> {
    return (await this.classes.usage(workspaceId, [curriculumId])).get(curriculumId) ?? [];
  }

  async usedBy(
    workspaceId: string,
    curriculumIds: readonly string[],
  ): Promise<Map<string, number>> {
    const usage = await this.classes.usage(workspaceId, curriculumIds);
    return new Map(curriculumIds.map((id) => [id, usage.get(id)?.length ?? 0]));
  }

  /** Ids of the exercise sets of `lessons` that have learning data (steps never do — M-2). */
  async learningData(workspaceId: string, lessons: readonly LessonDoc[]): Promise<Set<string>> {
    const setIds = lessons.flatMap((l) =>
      l.items.filter((i) => i.section === 'exercise').map((i) => String(i._id)),
    );
    return this.learning.setsWithData(workspaceId, setIds);
  }

  labels(workspaceId: string, lessonIds: readonly string[]): Promise<Map<string, AiLabel>> {
    return lessonIds.length ? this.ai.labels(workspaceId, lessonIds) : Promise.resolve(new Map());
  }
}

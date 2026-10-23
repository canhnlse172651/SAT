import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HskLevel } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { scoped } from '../../common/tenancy/scoped.js';
import {
  CURRICULUM_MODEL,
  type CurriculumDoc,
  LESSON_MODEL,
  type LessonDoc,
} from './curriculum.model.js';
import { CurriculumService } from './curriculum.service.js';

export interface CurriculumSummary {
  id: string;
  name: string;
  hsk: HskLevel;
  archived: boolean;
  publishedLessonCount: number;
}

/**
 * Read-only access to curricula and their Bài for other modules (003 Lớp học: pickers, the class content, the HV
 * view). Copies being written (`copyState`) never show.
 */
@Injectable()
export class CurriculumReader {
  constructor(
    @InjectModel(CURRICULUM_MODEL) private readonly curricula: Model<CurriculumDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessonModel: Model<LessonDoc>,
    private readonly service: CurriculumService,
  ) {}

  /** Curricula by id (archived ones included, missing ones absent). */
  async summaries(
    workspaceId: string,
    ids: readonly (string | Types.ObjectId)[],
  ): Promise<Map<string, CurriculumSummary>> {
    const valid = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!valid.length) return new Map();
    const docs = await scoped(this.curricula, workspaceId)
      .find({ _id: { $in: valid }, copyState: null })
      .lean<CurriculumDoc[]>();
    return this.summarize(workspaceId, docs);
  }

  /** Every non-archived curriculum of the workspace (003 AC-4.1). */
  async selectable(workspaceId: string): Promise<CurriculumSummary[]> {
    const docs = await scoped(this.curricula, workspaceId)
      .find({ copyState: null, archivedAt: null })
      .lean<CurriculumDoc[]>();
    return [...(await this.summarize(workspaceId, docs)).values()];
  }

  /** Every Bài of the curriculum in its order, with all items (any status). */
  async lessons(workspaceId: string, curriculumId: string | Types.ObjectId): Promise<LessonDoc[]> {
    const c = await scoped(this.curricula, workspaceId)
      .findOne({ _id: new Types.ObjectId(String(curriculumId)), copyState: null })
      .select({ lessonIds: 1 })
      .lean<Pick<CurriculumDoc, 'lessonIds'>>();
    return c ? this.service.orderedLessons(workspaceId, c) : [];
  }

  /** Whether the curriculum belongs to another workspace (003 AC-14.6) — existence only. */
  async isElsewhere(workspaceId: string, id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    return !!(await this.curricula.exists({
      _id: new Types.ObjectId(id),
      workspaceId: { $ne: new Types.ObjectId(workspaceId) },
    }));
  }

  private async summarize(
    workspaceId: string,
    docs: CurriculumDoc[],
  ): Promise<Map<string, CurriculumSummary>> {
    const published = new Map<string, number>();
    if (docs.length) {
      const rows = (await scoped(this.lessonModel, workspaceId).aggregate([
        { $match: { _id: { $in: docs.flatMap((d) => d.lessonIds) }, status: 'published' } },
        { $group: { _id: '$curriculumId', n: { $sum: 1 } } },
      ])) as { _id: Types.ObjectId; n: number }[];
      for (const r of rows) published.set(String(r._id), r.n);
    }
    return new Map(
      docs.map((d) => [
        String(d._id),
        {
          id: String(d._id),
          name: d.name,
          hsk: d.hsk,
          archived: !!d.archivedAt,
          publishedLessonCount: published.get(String(d._id)) ?? 0,
        },
      ]),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { LearnCurriculum, LearnItem, LearnLesson } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { CurriculumContext } from './curriculum.context.js';
import { coverUrl, learnItemDto } from './curriculum.mappers.js';
import {
  CURRICULUM_MODEL,
  type CurriculumDoc,
  LESSON_MODEL,
  type LessonDoc,
} from './curriculum.model.js';
import { CurriculumService } from './curriculum.service.js';

/**
 * REQ-10: what an HV may see of a curriculum used by one of their classes — published Bài, published items, Bài học
 * before Bài tập, empty sections and Bài left out. 003 adds class rules (start date, hidden sections) on top.
 * Anything else answers the uniform 404 (AC-10.5).
 */
export function visibleLesson(l: LessonDoc): LearnLesson | null {
  if (l.status !== 'published') return null;
  const pick = (section: 'lesson' | 'exercise') =>
    l.items.filter((i) => i.section === section && i.status === 'published').map(learnItemDto);
  const sections = { lesson: pick('lesson'), exercise: pick('exercise') };
  if (!sections.lesson.length && !sections.exercise.length) return null;
  return { id: String(l._id), name: l.name, sections };
}

@Injectable()
export class LearnService {
  constructor(
    @InjectModel(CURRICULUM_MODEL) private readonly curricula: Model<CurriculumDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
    private readonly ctx: CurriculumContext,
    private readonly curriculumService: CurriculumService,
  ) {}

  private async allowed(p: AuthPrincipal): Promise<Types.ObjectId[]> {
    const ids = await this.ctx.classes.curriculaOfStudent(p.workspaceId, p.userId);
    return ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  }

  async list(p: AuthPrincipal): Promise<{ items: Omit<LearnCurriculum, 'lessons'>[] }> {
    const docs = await scoped(this.curricula, p.workspaceId)
      .find({ _id: { $in: await this.allowed(p) }, copyState: null })
      .lean<CurriculumDoc[]>();
    return {
      items: docs.map((c) => ({
        id: String(c._id),
        name: c.name,
        hsk: c.hsk,
        description: c.description,
        coverUrl: coverUrl(c),
      })),
    };
  }

  private async curriculum(p: AuthPrincipal, id: Types.ObjectId | string): Promise<CurriculumDoc> {
    const oid = Types.ObjectId.isValid(id) ? new Types.ObjectId(String(id)) : null;
    const allowed = await this.allowed(p);
    if (!oid || !allowed.some((a) => a.equals(oid))) throw notFound();
    const c = await scoped(this.curricula, p.workspaceId)
      .findOne({ _id: oid, copyState: null })
      .lean<CurriculumDoc>();
    if (!c) throw notFound();
    return c;
  }

  async getCurriculum(p: AuthPrincipal, id: string): Promise<LearnCurriculum> {
    const c = await this.curriculum(p, id);
    const lessons = await this.curriculumService.orderedLessons(p.workspaceId, c);
    return {
      id: String(c._id),
      name: c.name,
      hsk: c.hsk,
      description: c.description,
      coverUrl: coverUrl(c),
      lessons: lessons.map(visibleLesson).filter((l): l is LearnLesson => !!l),
    };
  }

  private async lessonOf(p: AuthPrincipal, filter: Record<string, unknown>): Promise<LessonDoc> {
    const lesson = await scoped(this.lessons, p.workspaceId).findOne(filter).lean<LessonDoc>();
    if (!lesson) throw notFound();
    const c = await this.curriculum(p, lesson.curriculumId);
    if (!c.lessonIds.some((x) => x.equals(lesson._id))) throw notFound();
    return lesson;
  }

  async getLesson(p: AuthPrincipal, id: string): Promise<LearnLesson> {
    if (!Types.ObjectId.isValid(id)) throw notFound();
    const visible = visibleLesson(await this.lessonOf(p, { _id: new Types.ObjectId(id) }));
    if (!visible) throw notFound();
    return visible;
  }

  async getItem(p: AuthPrincipal, id: string): Promise<LearnItem> {
    if (!Types.ObjectId.isValid(id)) throw notFound();
    const visible = visibleLesson(await this.lessonOf(p, { 'items._id': new Types.ObjectId(id) }));
    const item =
      visible &&
      [...visible.sections.lesson, ...visible.sections.exercise].find((i) => i.id === id);
    if (!item) throw notFound();
    return item;
  }
}

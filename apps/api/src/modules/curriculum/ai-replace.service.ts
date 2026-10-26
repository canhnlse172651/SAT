import { createHash } from 'node:crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CURRICULUM_ERROR_CODES as E,
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  type Lesson,
  type Section,
  approveLimitMessage,
  approveWarning,
  contentSchemaFor,
  issueLine,
  itemNotReadyReason,
  replaceConfirmation,
  stepContentSchema,
  stepIssues,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { CurriculumContext } from './curriculum.context.js';
import { logAction, sectionItems } from './curriculum.mappers.js';
import { type ItemDoc, LESSON_MODEL, type LessonDoc } from './curriculum.model.js';
import { STEP_HOOKS, type StepHooks } from './curriculum.ports.js';
import { CurriculumService } from './curriculum.service.js';
import { LessonsService } from './lessons.service.js';

export interface ApprovedItem {
  title: string;
  content: unknown;
}

/** What the approval confirmation of T20 (010) shows (AC-19.1). */
export interface ReplacementPreview {
  newCount: number;
  /** Titles of the old items that will be deleted for good. */
  deleted: string[];
  /** Titles of the old sets that will be archived because they have learning data. */
  archived: string[];
  note: string | null;
  warning: string | null;
  /** Fingerprint of the section as previewed; a different one at confirmation means it changed (AC-19.5). */
  token: string;
  /** Bài học section: the confirmation 004 prescribes (004 AC-19.1 – AC-19.3). */
  confirm: { title: string; lines: string[] } | null;
}

/**
 * REQ-19 / AC-11.5: approving an AI section publishes the approved items and replaces the section's content. 010 calls
 * `preview` for its confirmation and `replace` when the GV confirms; until 010 exists the dev endpoints call them.
 */
@Injectable()
export class AiReplaceService {
  constructor(
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly ctx: CurriculumContext,
    private readonly lessonsService: LessonsService,
    private readonly curriculumService: CurriculumService,
    @Optional() @Inject(STEP_HOOKS) private readonly hooks?: StepHooks,
  ) {}

  /** AC-11.6, AC-19.4: limit and readiness of the approved items, before anything is shown or stored. */
  private check(section: Section, items: readonly ApprovedItem[]): unknown[] {
    if (items.length > CURRICULUM_LIMITS.itemsPerSection) {
      throw new AppError(422, E.TOO_MANY_ITEMS, approveLimitMessage(section));
    }
    if (section === 'lesson') {
      // 004 AC-9.3: every issue of every step and block, nothing stored when there is one.
      const lines: string[] = [];
      const contents = items.map((it, i) => {
        const parsed = stepContentSchema.safeParse(it.content);
        if (!parsed.success) {
          lines.push(`Bước ${i + 1} · nội dung không hợp lệ`);
          return null;
        }
        for (const issue of stepIssues(it.title, parsed.data)) lines.push(issueLine(i + 1, issue));
        return parsed.data;
      });
      if (lines.length) {
        throw new AppError(422, E.NOT_READY, `Không thể duyệt: ${lines[0]}`, { issues: lines });
      }
      return contents;
    }
    return items.map((it) => {
      const parsed = contentSchemaFor(section).safeParse(it.content);
      const reason = parsed.success
        ? itemNotReadyReason(section, it.title, parsed.data)
        : 'nội dung không hợp lệ';
      if (reason) {
        throw new AppError(
          422,
          E.NOT_READY,
          `Không thể duyệt: ${it.title || '(chưa có tên)'} — ${reason}`,
          {
            title: it.title,
            reason,
          },
        );
      }
      return parsed.data;
    });
  }

  private async plan(p: AuthPrincipal, lesson: LessonDoc, section: Section, newCount: number) {
    const old = sectionItems(lesson, section);
    const withData =
      section === 'exercise'
        ? await this.ctx.learningData(p.workspaceId, [{ ...lesson, items: old }])
        : new Set<string>();
    const kept = old.filter((i) => withData.has(String(i._id)));
    const dropped = old.filter((i) => !withData.has(String(i._id)));
    const usedBy =
      lesson.status === 'published'
        ? ((await this.ctx.usedBy(p.workspaceId, [String(lesson.curriculumId)])).get(
            String(lesson.curriculumId),
          ) ?? 0)
        : 0;
    const token = createHash('sha256')
      .update(
        JSON.stringify(old.map((i) => [String(i._id), i.status, withData.has(String(i._id))])),
      )
      .digest('base64url')
      .slice(0, 22);
    let confirm: ReplacementPreview['confirm'] = null;
    if (section === 'lesson') {
      const count = (status: ItemDoc['status']) => old.filter((i) => i.status === status).length;
      const decks = old.reduce((n, i) => {
        const parsed = stepContentSchema.safeParse(i.content);
        return (
          n + (parsed.success ? parsed.data.blocks.filter((b) => b.type === 'deck').length : 0)
        );
      }, 0);
      const [audience, linkedSets] = await Promise.all([
        this.hooks?.audience(p.workspaceId, String(lesson.curriculumId), String(lesson._id)) ?? 0,
        this.hooks?.linkedSets(
          p.workspaceId,
          old.map((i) => String(i._id)),
        ) ?? 0,
      ]);
      confirm = replaceConfirmation({
        lessonName: lesson.name,
        lessonPublished: lesson.status === 'published',
        newCount,
        old: {
          published: count('published'),
          draft: count('draft'),
          archived: count('archived'),
          titles: old.map((i) => i.title.trim() || '(chưa có tên)'),
        },
        audience,
        decks,
        linkedSets,
      });
    }
    const preview: ReplacementPreview = {
      newCount,
      deleted: dropped.map((i) => i.title),
      archived: kept.map((i) => i.title),
      note: kept.length ? M.keptScores : null,
      warning: usedBy ? approveWarning(usedBy) : null,
      token,
      confirm,
    };
    return { preview, kept, dropped };
  }

  async preview(
    p: AuthPrincipal,
    lessonId: string,
    section: Section,
    items: ApprovedItem[],
  ): Promise<ReplacementPreview> {
    this.check(section, items);
    const { lesson } = await this.lessonsService.load(p, lessonId);
    return (await this.plan(p, lesson, section, items.length)).preview;
  }

  /** AC-11.5, AC-19.2, AC-19.3, AC-19.5, AC-19.6: one write; the Bài status and per-class settings are untouched. */
  async replace(
    p: AuthPrincipal,
    lessonId: string,
    section: Section,
    items: ApprovedItem[],
    token: string,
  ): Promise<Lesson> {
    const checked = this.check(section, items);
    // 004: AI text is sanitised like any step content (NFR-6).
    const contents =
      section === 'lesson' && this.hooks
        ? await Promise.all(checked.map((c) => this.hooks?.prepare(p.workspaceId, c)))
        : checked;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { lesson } = await this.lessonsService.load(p, lessonId);
      const { preview, kept, dropped } = await this.plan(p, lesson, section, items.length);
      if (preview.token !== token) {
        throw new AppError(409, E.SECTION_CHANGED, M.sectionChanged, preview);
      }
      const now = this.clock.now();
      const fresh: ItemDoc[] = items.map((it, i) => ({
        _id: new Types.ObjectId(),
        section,
        title: it.title,
        status: 'published',
        ai: true,
        content: contents[i],
        version: 1,
        updatedAt: now,
      }));
      const archived = kept.map((i) =>
        i.status === 'archived'
          ? i
          : { ...i, status: 'archived' as const, version: i.version + 1, updatedAt: now },
      );
      const next = [...lesson.items.filter((i) => i.section !== section), ...fresh, ...archived];
      const updated = await scoped(this.lessons, p.workspaceId)
        .findOneAndUpdate(
          { _id: lesson._id, rev: lesson.rev },
          {
            $set: {
              items: next,
              [`sectionUpdatedAt.${section}`]: now,
              ...(section === 'lesson' ? { 'sectionReplacedAt.lesson': now } : {}),
            },
            $inc: { rev: 1 },
          },
          { returnDocument: 'after' },
        )
        .lean<LessonDoc>();
      if (!updated) continue;
      await this.hooks?.removed(p.workspaceId, dropped);
      await this.curriculumService.touch(p.workspaceId, lesson.curriculumId);
      logAction({
        action: 'section.replace',
        actorId: p.userId,
        lessonId,
        section,
        newCount: fresh.length,
        deletedCount: dropped.length,
        deletedByStatus: {
          published: dropped.filter((i) => i.status === 'published').length,
          draft: dropped.filter((i) => i.status === 'draft').length,
          archived: dropped.filter((i) => i.status === 'archived').length,
        },
        archivedCount: kept.filter((i) => i.status !== 'archived').length,
      });
      return this.lessonsService.dto(p, updated);
    }
    throw new AppError(409, E.SECTION_CHANGED, M.sectionChanged);
  }
}

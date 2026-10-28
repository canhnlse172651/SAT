import { createHash } from 'node:crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CURRICULUM_ERROR_CODES as E,
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  AI_SET_MESSAGES,
  type ExerciseSetContent,
  type Lesson,
  type Section,
  approveLimitMessage,
  approveWarning,
  contentSchemaFor,
  issueLine,
  itemNotReadyReason,
  markAi,
  replaceConfirmation,
  screenGeneratedQuestions,
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
import { SET_HOOKS, STEP_HOOKS, type SetHooks, type StepHooks } from './curriculum.ports.js';
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
  /** Bài tập section: what 005 AC-13.11 lists in "Duyệt và thay thế". */
  sets: SetsConfirmation | null;
}

export interface SetsConfirmation {
  newSets: number;
  newQuestions: number;
  published: string;
  /** Old sets without learning data ("Sẽ bị xóa"). */
  deleted: string[];
  /** Old sets with learning data that get archived ("Sẽ được lưu trữ — giữ bài nộp và điểm"), with their submissions. */
  archived: { title: string; submissions: number }[];
  /** Old archived sets with learning data ("Giữ nguyên ở Lưu trữ"). */
  keptArchived: string[];
  /** "Phần Bài tập của Bài đang trống — …" when the section has no set. */
  empty: string | null;
  kept: string | null;
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
    @Optional() @Inject(SET_HOOKS) private readonly setHooks?: SetHooks,
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
    if (section === 'exercise') {
      // 005 AC-13.4: generated questions of an unknown kind or over a limit are content errors, reported per question.
      const rejected = items.flatMap((it, set) => {
        const qs = (it.content as { questions?: unknown } | null)?.questions;
        return Array.isArray(qs)
          ? screenGeneratedQuestions(qs).rejected.map((r) => ({
              set: set + 1,
              question: r.index + 1,
              reason: r.reason,
            }))
          : [];
      });
      const first = rejected[0];
      if (first) {
        throw new AppError(
          422,
          E.NOT_READY,
          `Không thể duyệt: Bộ ${first.set} · Câu ${first.question} — ${first.reason}`,
          { rejected },
        );
      }
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

  private async plan(
    p: AuthPrincipal,
    lesson: LessonDoc,
    section: Section,
    newCount: number,
    newQuestions = 0,
  ) {
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
    let sets: SetsConfirmation | null = null;
    if (section === 'exercise') {
      const counts =
        (await this.setHooks?.submissionCounts(
          p.workspaceId,
          kept.map((i) => String(i._id)),
        )) ?? new Map<string, number>();
      const archiving = kept.filter((i) => i.status !== 'archived');
      const staying = kept.filter((i) => i.status === 'archived');
      sets = {
        newSets: newCount,
        newQuestions,
        published: AI_SET_MESSAGES.published,
        deleted: dropped.map((i) => i.title),
        archived: archiving.map((i) => ({
          title: i.title,
          submissions: counts.get(String(i._id)) ?? 0,
        })),
        keptArchived: staying.map((i) => i.title),
        empty: old.length ? null : AI_SET_MESSAGES.empty,
        kept: kept.length ? AI_SET_MESSAGES.kept : null,
      };
    }
    const preview: ReplacementPreview = {
      newCount,
      deleted: dropped.map((i) => i.title),
      archived: kept.map((i) => i.title),
      note: kept.length ? M.keptScores : null,
      warning: usedBy ? approveWarning(usedBy) : null,
      token,
      confirm,
      sets,
    };
    return { preview, kept, dropped };
  }

  async preview(
    p: AuthPrincipal,
    lessonId: string,
    section: Section,
    items: ApprovedItem[],
  ): Promise<ReplacementPreview> {
    const checked = this.check(section, items);
    const { lesson } = await this.lessonsService.load(p, lessonId);
    return (await this.plan(p, lesson, section, items.length, questionCount(section, checked)))
      .preview;
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
    // 004: AI text is sanitised like any step content (NFR-6); 005: field rules and images checked like a saved set.
    const contents =
      section === 'lesson'
        ? this.hooks
          ? await Promise.all(checked.map((c) => this.hooks?.prepare(p.workspaceId, c)))
          : checked
        : await Promise.all(
            checked.map(async (c, i) => {
              const set = markAi(c as ExerciseSetContent);
              const title = items[i]?.title ?? '';
              return this.setHooks ? this.setHooks.prepare(p.workspaceId, title, set) : set;
            }),
          );
    const questions = questionCount(section, checked);
    for (let attempt = 0; attempt < 5; attempt++) {
      const { lesson } = await this.lessonsService.load(p, lessonId);
      const { preview, kept, dropped } = await this.plan(
        p,
        lesson,
        section,
        items.length,
        questions,
      );
      if (preview.token !== token) {
        // 005 AC-13.12 words the Bài tập refusal its own way.
        const message = section === 'exercise' ? AI_SET_MESSAGES.changed : M.sectionChanged;
        throw new AppError(409, E.SECTION_CHANGED, message, preview);
      }
      // 005 AC-13.1: the step link 010 set is kept only while that step is in the Bài học section.
      const steps = new Set(sectionItems(lesson, 'lesson').map((i) => String(i._id)));
      const linked = (c: unknown) => {
        if (section !== 'exercise') return c;
        const set = c as ExerciseSetContent;
        return set.stepId && !steps.has(set.stepId) ? { ...set, stepId: null } : set;
      };
      const now = this.clock.now();
      const fresh: ItemDoc[] = items.map((it, i) => ({
        _id: new Types.ObjectId(),
        section,
        title: it.title,
        status: 'published',
        ai: true,
        content: linked(contents[i]),
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
      if (section === 'lesson') await this.hooks?.removed(p.workspaceId, dropped);
      else await this.setHooks?.removed(p.workspaceId, dropped);
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
    throw new AppError(
      409,
      E.SECTION_CHANGED,
      section === 'exercise' ? AI_SET_MESSAGES.changed : M.sectionChanged,
    );
  }
}

/** Questions of the approved sets (005 AC-13.11); 0 for steps. */
const questionCount = (section: Section, contents: readonly unknown[]): number =>
  section === 'exercise'
    ? contents.reduce<number>((n, c) => n + (c as ExerciseSetContent).questions.length, 0)
    : 0;

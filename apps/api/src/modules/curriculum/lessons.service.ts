import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CURRICULUM_ERROR_CODES as E,
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  type Lesson,
  type Section,
  contentSchemaFor,
  copyName,
  itemLimitMessage,
  itemNotReadyReason,
  newItemContent,
  notReadyMessage,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { CurriculumContext, changedElsewhere } from './curriculum.context.js';
import { lessonDto, logAction, sectionItems } from './curriculum.mappers.js';
import {
  CURRICULUM_MODEL,
  type CurriculumDoc,
  type ItemDoc,
  LESSON_MODEL,
  type LessonDoc,
} from './curriculum.model.js';
import { CurriculumFaults } from './curriculum.ports.js';
import { CurriculumService, copyInProgress, copyItems } from './curriculum.service.js';

const STALE_MS = 10 * 60_000;
const lessonLimit = () => new AppError(409, E.LESSON_LIMIT, M.lessonLimit);
const lessonHasData = () => new AppError(409, E.HAS_LEARNING_DATA, M.lessonHasData);
const setHasData = () => new AppError(409, E.HAS_LEARNING_DATA, M.setHasData);
const wrongSection = () => new AppError(409, E.WRONG_SECTION, M.wrongSection);
const notReady = (reason: string) =>
  new AppError(422, E.NOT_READY, notReadyMessage(reason), { reason });

/** What a `mutate` step returns: the new items (and optionally other fields) to store. */
interface Change {
  items: ItemDoc[];
  set?: Record<string, unknown>;
  sections: Section[];
}

/** T18 / T07: Bài and their items (REQ-5 … REQ-9, REQ-12, REQ-14, REQ-18). */
@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(CURRICULUM_MODEL) private readonly curricula: Model<CurriculumDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly ctx: CurriculumContext,
    private readonly curriculumService: CurriculumService,
    private readonly faults: CurriculumFaults,
  ) {}

  /* ---------- loading ---------- */

  /** A Bài of the caller's workspace that belongs to a visible curriculum's order, with that curriculum. */
  async load(
    p: AuthPrincipal,
    id: string,
  ): Promise<{ lesson: LessonDoc; curriculum: CurriculumDoc }> {
    const lesson = await scoped(this.lessons, p.workspaceId).findById(id).lean<LessonDoc>();
    if (!lesson) throw notFound();
    const curriculum = await scoped(this.curricula, p.workspaceId)
      .findOne({ _id: lesson.curriculumId, copyState: null, lessonIds: lesson._id })
      .lean<CurriculumDoc>();
    if (!curriculum) throw notFound();
    return { lesson, curriculum };
  }

  async dto(p: AuthPrincipal, lesson: LessonDoc, curriculum?: CurriculumDoc): Promise<Lesson> {
    const c =
      curriculum ??
      (await scoped(this.curricula, p.workspaceId)
        .findById(lesson.curriculumId)
        .lean<CurriculumDoc>());
    if (!c) throw notFound();
    const id = String(lesson._id);
    const [usedBy, labels, withData] = await Promise.all([
      this.ctx.usedBy(p.workspaceId, [String(c._id)]),
      this.ctx.labels(p.workspaceId, [id]),
      this.ctx.learningData(p.workspaceId, [lesson]),
    ]);
    return lessonDto(lesson, {
      curriculum: c,
      usedBy: usedBy.get(String(c._id)) ?? 0,
      ai: labels.get(id) ?? null,
      withData,
    });
  }

  async get(p: AuthPrincipal, id: string): Promise<Lesson> {
    const { lesson, curriculum } = await this.load(p, id);
    return this.dto(p, lesson, curriculum);
  }

  /**
   * Read-modify-write of one Bài guarded by `rev` (single-document = atomic, AC-9.4, AC-11.5); retried when another
   * write slipped in between, so `step` always decides on the latest state.
   */
  private async mutate(
    p: AuthPrincipal,
    id: string,
    step: (lesson: LessonDoc) => Change | Promise<Change>,
  ): Promise<LessonDoc> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { lesson } = await this.load(p, id);
      const change = await step(lesson);
      const now = this.clock.now();
      const sectionStamps = Object.fromEntries(
        change.sections.map((s) => [`sectionUpdatedAt.${s}`, now]),
      );
      const updated = await scoped(this.lessons, p.workspaceId)
        .findOneAndUpdate(
          { _id: lesson._id, rev: lesson.rev },
          { $set: { items: change.items, ...sectionStamps, ...change.set }, $inc: { rev: 1 } },
          { returnDocument: 'after' },
        )
        .lean<LessonDoc>();
      if (updated) {
        await this.curriculumService.touch(p.workspaceId, lesson.curriculumId);
        return updated;
      }
    }
    throw changedElsewhere();
  }

  private findItem(lesson: LessonDoc, itemId: string): ItemDoc {
    const item = lesson.items.find((i) => String(i._id) === itemId);
    if (!item) throw notFound();
    return item;
  }

  /* ---------- Bài (REQ-5, REQ-9, REQ-12, REQ-14) ---------- */

  /** AC-5.2, AC-5.5: a draft Bài with two empty sections at the end of the list (max 100). */
  async add(p: AuthPrincipal, curriculumId: string, name: string): Promise<Lesson> {
    const c = await this.curriculumService.find(p, curriculumId);
    if (c.lessonIds.length >= CURRICULUM_LIMITS.lessonsPerCurriculum) throw lessonLimit();
    const created = await scoped(this.lessons, p.workspaceId).create({
      curriculumId: c._id,
      name,
      status: 'draft',
      items: [],
      sectionUpdatedAt: { lesson: null, exercise: null },
    });
    const pushed = await scoped(this.curricula, p.workspaceId).updateOne(
      {
        _id: c._id,
        $expr: { $lt: [{ $size: '$lessonIds' }, CURRICULUM_LIMITS.lessonsPerCurriculum] },
      },
      { $push: { lessonIds: created._id } },
    );
    if (!pushed.modifiedCount) {
      await scoped(this.lessons, p.workspaceId).deleteOne({ _id: created._id });
      throw lessonLimit();
    }
    logAction({
      action: 'lesson.create',
      actorId: p.userId,
      curriculumId,
      lessonId: String(created._id),
    });
    return this.get(p, String(created._id));
  }

  /** AC-5.4 */
  async rename(
    p: AuthPrincipal,
    id: string,
    body: { expectedVersion: number; name: string },
  ): Promise<Lesson> {
    const { lesson } = await this.load(p, id);
    const updated = await scoped(this.lessons, p.workspaceId)
      .findOneAndUpdate(
        { _id: lesson._id, version: body.expectedVersion },
        { $set: { name: body.name }, $inc: { version: 1 } },
        { returnDocument: 'after' },
      )
      .lean<LessonDoc>();
    if (!updated) throw changedElsewhere();
    await this.curriculumService.touch(p.workspaceId, lesson.curriculumId);
    logAction({ action: 'lesson.rename', actorId: p.userId, lessonId: id });
    return this.dto(p, updated);
  }

  /** AC-9.3 … AC-9.5: the Bài and the chosen ready draft items, in one write. */
  async publish(
    p: AuthPrincipal,
    id: string,
    body: { expectedVersion: number; itemIds: string[] },
  ): Promise<Lesson> {
    const chosen = new Set(body.itemIds);
    const updated = await this.mutate(p, id, (lesson) => {
      if (lesson.version !== body.expectedVersion) throw changedElsewhere();
      for (const itemId of chosen) {
        const item = lesson.items.find((i) => String(i._id) === itemId);
        if (!item || item.status !== 'draft') throw changedElsewhere();
        const reason = itemNotReadyReason(item.section, item.title, item.content);
        if (reason) throw notReady(reason);
      }
      if (!chosen.size && !lesson.items.some((i) => i.status === 'published')) {
        throw new AppError(422, E.NOT_READY, M.needOneReady);
      }
      const now = this.clock.now();
      const items = lesson.items.map((i) =>
        chosen.has(String(i._id))
          ? { ...i, status: 'published' as const, version: i.version + 1, updatedAt: now }
          : i,
      );
      return {
        items,
        sections: [
          ...new Set(items.filter((i) => chosen.has(String(i._id))).map((i) => i.section)),
        ],
        set: { status: 'published', version: lesson.version + 1 },
      };
    });
    logAction({ action: 'lesson.publish', actorId: p.userId, lessonId: id, items: chosen.size });
    return this.dto(p, updated);
  }

  /** AC-12.4 … AC-12.7: refused when any set has learning data (checked at confirmation); pending AI content is discarded. */
  async remove(p: AuthPrincipal, id: string): Promise<void> {
    const { lesson, curriculum } = await this.load(p, id);
    if ((await this.ctx.learningData(p.workspaceId, [lesson])).size) {
      logAction({ action: 'lesson.delete', result: 'denied', actorId: p.userId, lessonId: id });
      throw lessonHasData();
    }
    await scoped(this.curricula, p.workspaceId).updateOne(
      { _id: curriculum._id },
      { $pull: { lessonIds: lesson._id } },
    );
    await this.ctx.ai.discard(p.workspaceId, [id]);
    await scoped(this.lessons, p.workspaceId).deleteOne({ _id: lesson._id });
    logAction({
      action: 'lesson.delete',
      actorId: p.userId,
      lessonId: id,
      items: lesson.items.length,
    });
  }

  /** AC-14.1 … AC-14.5, AC-15.6: one insert right after the original; drafts only; nothing learner- or AI-pending. */
  async duplicate(p: AuthPrincipal, id: string): Promise<Lesson> {
    const { lesson, curriculum } = await this.load(p, id);
    if (curriculum.lessonIds.length >= CURRICULUM_LIMITS.lessonsPerCurriculum) throw lessonLimit();
    const scope = scoped(this.lessons, p.workspaceId);
    const now = this.clock.now();
    const locked = await scope.updateOne(
      {
        _id: lesson._id,
        $or: [{ copyLockAt: null }, { copyLockAt: { $lt: new Date(now.getTime() - STALE_MS) } }],
      },
      { $set: { copyLockAt: now } },
    );
    if (!locked.modifiedCount) throw copyInProgress();
    let copyId: Types.ObjectId | null = null;
    try {
      const copy = await scope.create({
        curriculumId: curriculum._id,
        name: copyName(lesson.name),
        status: 'draft',
        items: copyItems(lesson.items, now, true),
        sectionUpdatedAt: { lesson: now, exercise: now },
      });
      copyId = copy._id as Types.ObjectId;
      await this.faults.apply('duplicate-lesson');
      const fresh = await scoped(this.curricula, p.workspaceId)
        .findById(curriculum._id)
        .lean<CurriculumDoc>();
      const at = fresh?.lessonIds.findIndex((x) => x.equals(lesson._id)) ?? -1;
      if (!fresh || at < 0) throw notFound();
      const pushed = await scoped(this.curricula, p.workspaceId).updateOne(
        {
          _id: curriculum._id,
          lessonIds: fresh.lessonIds,
          $expr: { $lt: [{ $size: '$lessonIds' }, CURRICULUM_LIMITS.lessonsPerCurriculum] },
        },
        { $push: { lessonIds: { $each: [copyId], $position: at + 1 } } },
      );
      if (!pushed.modifiedCount) {
        throw fresh.lessonIds.length >= CURRICULUM_LIMITS.lessonsPerCurriculum
          ? lessonLimit()
          : changedElsewhere();
      }
      logAction({
        action: 'lesson.duplicate',
        actorId: p.userId,
        lessonId: id,
        copyId: String(copyId),
      });
      return this.get(p, String(copyId));
    } catch (err) {
      if (copyId) await scope.deleteOne({ _id: copyId });
      logAction({ action: 'lesson.duplicate', result: 'failed', actorId: p.userId, lessonId: id });
      if (err instanceof AppError) throw err;
      throw new AppError(503, E.COPY_FAILED, M.duplicateFailed);
    } finally {
      await scope.updateOne({ _id: lesson._id }, { $set: { copyLockAt: null } });
    }
  }

  /* ---------- items (REQ-6 … REQ-9, REQ-12, REQ-18) ---------- */

  /** AC-7.6, AC-7.9, AC-8.2: saved at once as a draft, at the end of its section or right after `afterItemId`. */
  async addItem(
    p: AuthPrincipal,
    id: string,
    body: { section: Section; afterItemId?: string | undefined },
  ) {
    let newId = '';
    const updated = await this.mutate(p, id, (lesson) => {
      const counted = sectionItems(lesson, body.section).filter((i) => i.status !== 'archived');
      if (counted.length >= CURRICULUM_LIMITS.itemsPerSection) {
        throw new AppError(409, E.ITEM_LIMIT, itemLimitMessage(body.section));
      }
      let at: number;
      if (body.afterItemId) {
        const after = this.findItem(lesson, body.afterItemId);
        if (after.section !== body.section) throw wrongSection();
        at = lesson.items.indexOf(after) + 1;
      } else {
        const last = sectionItems(lesson, body.section).at(-1);
        at = last ? lesson.items.indexOf(last) + 1 : lesson.items.length;
      }
      const item: ItemDoc = {
        _id: new Types.ObjectId(),
        section: body.section,
        title: '',
        status: 'draft',
        ai: false,
        content: newItemContent(body.section),
        version: 1,
        updatedAt: this.clock.now(),
      };
      newId = String(item._id);
      const items = [...lesson.items];
      items.splice(at, 0, item);
      return { items, sections: [body.section] };
    });
    logAction({
      action: 'item.create',
      actorId: p.userId,
      lessonId: id,
      itemId: newId,
      section: body.section,
    });
    return { lesson: await this.dto(p, updated), itemId: newId };
  }

  /** AC-6.5, AC-6.6, AC-8.1, AC-8.2: swaps with the neighbour of the same section (hidden archived ones included). */
  async moveItem(
    p: AuthPrincipal,
    id: string,
    itemId: string,
    body: { direction: 'up' | 'down'; expectedOrder: string[] },
  ) {
    let position = 0;
    let total = 0;
    const updated = await this.mutate(p, id, (lesson) => {
      const item = this.findItem(lesson, itemId);
      const order = sectionItems(lesson, item.section);
      const ids = order.map((i) => String(i._id));
      if (
        body.expectedOrder.some(
          (x) => !ids.includes(x) && lesson.items.some((i) => String(i._id) === x),
        )
      ) {
        throw wrongSection();
      }
      if (body.expectedOrder.join() !== ids.join()) throw changedElsewhere();
      const k = ids.indexOf(itemId);
      const to = body.direction === 'up' ? k - 1 : k + 1;
      const other = order[to];
      if (!other) throw changedElsewhere();
      const items = [...lesson.items];
      const a = items.indexOf(item);
      const b = items.indexOf(other);
      items[a] = other;
      items[b] = item;
      position = to + 1;
      total = order.length;
      return { items, sections: [item.section] };
    });
    logAction({ action: 'item.reorder', actorId: p.userId, lessonId: id, itemId });
    return { lesson: await this.dto(p, updated), position, total };
  }

  /** Validates content against the section's shape (004 / 005 interim). */
  private content(section: Section, raw: unknown): unknown {
    return contentSchemaFor(section).parse(raw);
  }

  private edit(
    p: AuthPrincipal,
    id: string,
    itemId: string,
    expectedVersion: number,
    apply: (item: ItemDoc) => Partial<ItemDoc>,
  ): Promise<LessonDoc> {
    return this.mutate(p, id, (lesson) => {
      const item = this.findItem(lesson, itemId);
      if (item.version !== expectedVersion) throw changedElsewhere();
      const next = {
        ...item,
        ...apply(item),
        version: item.version + 1,
        updatedAt: this.clock.now(),
      };
      return { items: lesson.items.map((i) => (i === item ? next : i)), sections: [item.section] };
    });
  }

  /** Saves title + content without changing the status (archived stays archived — AC-18.3). */
  async saveItem(
    p: AuthPrincipal,
    id: string,
    itemId: string,
    body: { expectedVersion: number; title: string; content: unknown },
  ): Promise<Lesson> {
    const updated = await this.edit(p, id, itemId, body.expectedVersion, (item) => ({
      title: body.title,
      content: this.content(item.section, body.content),
    }));
    logAction({ action: 'item.update', actorId: p.userId, lessonId: id, itemId });
    return this.dto(p, updated);
  }

  /** AC-9.1, AC-9.2: saves the pending edits and publishes in one step, or saves nothing when not ready. */
  async publishItem(
    p: AuthPrincipal,
    id: string,
    itemId: string,
    body: { expectedVersion: number; title: string; content: unknown },
  ): Promise<Lesson> {
    const updated = await this.edit(p, id, itemId, body.expectedVersion, (item) => {
      if (item.status !== 'draft') throw changedElsewhere();
      const content = this.content(item.section, body.content);
      const reason = itemNotReadyReason(item.section, body.title, content);
      if (reason) throw notReady(reason);
      return { title: body.title, content, status: 'published' };
    });
    logAction({ action: 'item.publish', actorId: p.userId, lessonId: id, itemId });
    return this.dto(p, updated);
  }

  /** AC-18.1 (published → archived) and AC-18.4 (archived → published), immediately, position kept. */
  async setArchived(
    p: AuthPrincipal,
    id: string,
    itemId: string,
    expectedVersion: number,
    archived: boolean,
  ): Promise<Lesson> {
    const updated = await this.edit(p, id, itemId, expectedVersion, (item) => {
      if (item.status !== (archived ? 'published' : 'archived')) throw changedElsewhere();
      return { status: archived ? 'archived' : 'published' };
    });
    logAction({
      action: archived ? 'item.archive' : 'item.restore',
      actorId: p.userId,
      lessonId: id,
      itemId,
    });
    return this.dto(p, updated);
  }

  /** AC-12.2, AC-12.3, AC-12.6: a set with learning data is never deleted (checked at confirmation). */
  async deleteItem(p: AuthPrincipal, id: string, itemId: string): Promise<Lesson> {
    const updated = await this.mutate(p, id, async (lesson) => {
      const item = this.findItem(lesson, itemId);
      if (
        item.section === 'exercise' &&
        (await this.ctx.learningData(p.workspaceId, [{ ...lesson, items: [item] }])).size
      ) {
        logAction({
          action: 'item.delete',
          result: 'denied',
          actorId: p.userId,
          lessonId: id,
          itemId,
        });
        throw setHasData();
      }
      return { items: lesson.items.filter((i) => i !== item), sections: [item.section] };
    });
    logAction({ action: 'item.delete', actorId: p.userId, lessonId: id, itemId });
    return this.dto(p, updated);
  }
}

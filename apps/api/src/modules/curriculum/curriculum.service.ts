import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CURRICULUM_ERROR_CODES as E,
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  type CurriculumDetail,
  type CurriculumListResponse,
  type HskLevel,
  type LessonRow,
  type UsingClass,
  copyName,
  foldSearch,
  inUseMessage,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { FILE_STORAGE, type FileStorage } from '../../common/ports/storage.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { CurriculumContext, changedElsewhere, isDuplicateKey } from './curriculum.context.js';
import { cardDto, detailDto, lessonRowDto, logAction } from './curriculum.mappers.js';
import {
  CURRICULUM_MODEL,
  type CurriculumDoc,
  type ItemDoc,
  LESSON_MODEL,
  type LessonDoc,
} from './curriculum.model.js';
import { CurriculumFaults } from './curriculum.ports.js';

export interface CurriculumInput {
  name: string;
  hsk: HskLevel;
  description: string;
  coverFileId?: string | null | undefined;
}

export interface CurriculumChanges {
  expectedVersion: number;
  name?: string | undefined;
  hsk?: HskLevel | undefined;
  description?: string | undefined;
  coverFileId?: string | null | undefined;
}

/** A copy, lock or lesson write older than this is considered abandoned (process crash). */
const STALE_MS = 10 * 60_000;
const COPY_BATCH = 20;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameTaken = () => new AppError(409, E.NAME_TAKEN, M.nameTaken, { field: 'name' });
export const invalidCover = () =>
  new AppError(400, E.INVALID_COVER, M.invalidCover, { field: 'coverFileId' });
const copyFailed = () => new AppError(503, E.COPY_FAILED, M.duplicateFailed);
export const copyInProgress = () => new AppError(409, E.COPY_IN_PROGRESS, M.duplicating);

/** JPG, PNG or WebP by signature — the declared type is not trusted (AC-1.6). */
export function sniffImage(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const at = (i: number) => bytes[i];
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'image/jpeg';
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Copies of items for a duplicate: archived items are left out (AC-14.1, AC-15.2). */
export function copyItems(items: readonly ItemDoc[], now: Date, asDraft: boolean): ItemDoc[] {
  return items
    .filter((i) => i.status !== 'archived')
    .map((i) => ({
      _id: new Types.ObjectId(),
      section: i.section,
      title: i.title,
      status: asDraft ? 'draft' : i.status,
      ai: i.ai,
      content: structuredClone(i.content),
      version: 1,
      updatedAt: now,
    }));
}

/** T05 / T06: curricula, their Bài order, archive and duplicates (REQ-1 … REQ-4, REQ-6, REQ-13, REQ-15). */
@Injectable()
export class CurriculumService {
  constructor(
    @InjectModel(CURRICULUM_MODEL) private readonly curricula: Model<CurriculumDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
    @Inject(FILE_STORAGE) private readonly files: FileStorage,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly ctx: CurriculumContext,
    private readonly faults: CurriculumFaults,
  ) {}

  /* ---------- reading ---------- */

  /** A curriculum of the caller's workspace (not a half-written copy) or the uniform 404. */
  async find(p: AuthPrincipal, id: string): Promise<CurriculumDoc> {
    const doc = await scoped(this.curricula, p.workspaceId)
      .findOne({ _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null, copyState: null })
      .lean<CurriculumDoc>();
    if (!doc) throw notFound();
    return doc;
  }

  /** AC-3.1 … AC-3.6, AC-13.5, AC-13.6 */
  async list(
    p: AuthPrincipal,
    query: {
      hsk?: HskLevel | undefined;
      q?: string | undefined;
      archived: boolean;
      selectable: boolean;
      page: number;
    },
  ): Promise<CurriculumListResponse> {
    await this.sweepStaleCopies(p.workspaceId);
    const scope = scoped(this.curricula, p.workspaceId);
    const archived = query.archived && !query.selectable;
    const base = { copyState: null, archivedAt: archived ? { $ne: null } : null };
    const q = foldSearch(query.q ?? '');
    const filter = {
      ...base,
      ...(query.hsk ? { hsk: query.hsk } : {}),
      ...(q ? { nameKey: { $regex: escapeRegex(q) } } : {}),
    };
    const limit = CURRICULUM_LIMITS.pageSize;
    const [total, docs, groups] = await Promise.all([
      scope.count(filter),
      scope
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip((query.page - 1) * limit)
        .limit(limit)
        .lean<CurriculumDoc[]>(),
      scope.aggregate([{ $match: base }, { $group: { _id: '$hsk', n: { $sum: 1 } } }]),
    ]);
    const levelCounts: Record<string, number> = { all: 0 };
    for (const g of groups as { _id: number; n: number }[]) {
      levelCounts[String(g._id)] = g.n;
      levelCounts['all'] = (levelCounts['all'] ?? 0) + g.n;
    }
    const ids = docs.map((d) => String(d._id));
    const [usedBy, published] = await Promise.all([
      this.ctx.usedBy(p.workspaceId, ids),
      this.publishedCounts(p.workspaceId, docs),
    ]);
    return {
      items: docs.map((d) =>
        cardDto(
          d,
          { lessons: d.lessonIds.length, published: published.get(String(d._id)) ?? 0 },
          usedBy.get(String(d._id)) ?? 0,
        ),
      ),
      page: query.page,
      limit,
      total,
      levelCounts,
    };
  }

  /** AC-4.1 */
  async detail(p: AuthPrincipal, id: string): Promise<CurriculumDetail> {
    const c = await this.find(p, id);
    const lessons = await this.orderedLessons(p.workspaceId, c);
    const lessonIds = lessons.map((l) => String(l._id));
    const [labels, data, usedBy] = await Promise.all([
      this.ctx.labels(p.workspaceId, lessonIds),
      this.ctx.learningData(p.workspaceId, lessons),
      this.ctx.usedBy(p.workspaceId, [id]),
    ]);
    const rows: LessonRow[] = lessons.map((l) =>
      lessonRowDto(l, labels.get(String(l._id)) ?? null, data),
    );
    return detailDto(c, rows, usedBy.get(id) ?? 0);
  }

  /** AC-4.4 */
  async classes(p: AuthPrincipal, id: string): Promise<{ items: UsingClass[] }> {
    await this.find(p, id);
    return { items: await this.ctx.usingClasses(p.workspaceId, id) };
  }

  /** Lessons in the curriculum's order; ids missing from `lessonIds` (unfinished writes) are not part of it. */
  async orderedLessons(
    workspaceId: string,
    c: Pick<CurriculumDoc, 'lessonIds'>,
  ): Promise<LessonDoc[]> {
    if (!c.lessonIds.length) return [];
    const docs = await scoped(this.lessons, workspaceId)
      .find({ _id: { $in: c.lessonIds } })
      .lean<LessonDoc[]>();
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    return c.lessonIds.map((id) => byId.get(String(id))).filter((d): d is LessonDoc => !!d);
  }

  private async publishedCounts(
    workspaceId: string,
    docs: CurriculumDoc[],
  ): Promise<Map<string, number>> {
    if (!docs.length) return new Map();
    const rows = (await scoped(this.lessons, workspaceId).aggregate([
      {
        $match: {
          _id: { $in: docs.flatMap((d) => d.lessonIds) },
          status: 'published',
        },
      },
      { $group: { _id: '$curriculumId', n: { $sum: 1 } } },
    ])) as { _id: Types.ObjectId; n: number }[];
    return new Map(rows.map((r) => [String(r._id), r.n]));
  }

  /* ---------- create and edit (REQ-1, REQ-2) ---------- */

  /** AC-1.6: stores a cover image and returns its file id. */
  async uploadCover(p: AuthPrincipal, bytes: Uint8Array): Promise<{ fileId: string; url: string }> {
    const type = sniffImage(bytes);
    if (!type || bytes.byteLength > CURRICULUM_LIMITS.coverMaxBytes || bytes.byteLength === 0) {
      throw invalidCover();
    }
    const ext = type === 'image/jpeg' ? 'jpg' : type.slice(6);
    const meta = await this.files.put({
      workspaceId: p.workspaceId,
      ownerId: p.userId,
      filename: `anh-bia.${ext}`,
      contentType: type,
      bytes,
    });
    return { fileId: meta.id, url: `/api/files/${meta.id}` };
  }

  /** A cover must be an image of this workspace. */
  private async checkCover(p: AuthPrincipal, fileId: string | null | undefined): Promise<void> {
    if (!fileId) return;
    const file = await this.files.get(fileId).catch(() => null);
    if (file) file.stream.destroy();
    if (
      !file ||
      file.metadata.workspaceId !== p.workspaceId ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.metadata.contentType)
    ) {
      throw invalidCover();
    }
  }

  /** AC-1.2, AC-1.4 */
  async create(p: AuthPrincipal, input: CurriculumInput): Promise<CurriculumDetail> {
    await this.checkCover(p, input.coverFileId);
    let doc: CurriculumDoc;
    try {
      doc = (
        await scoped(this.curricula, p.workspaceId).create({
          name: input.name,
          nameKey: foldSearch(input.name),
          hsk: input.hsk,
          description: input.description,
          coverFileId: input.coverFileId ? new Types.ObjectId(input.coverFileId) : null,
          lessonIds: [],
        })
      ).toObject({ transform: false }) as CurriculumDoc;
    } catch (err) {
      if (isDuplicateKey(err)) throw nameTaken();
      throw err;
    }
    logAction({ action: 'curriculum.create', actorId: p.userId, curriculumId: String(doc._id) });
    return detailDto(doc, [], 0);
  }

  /** AC-2.1 … AC-2.4: saved at once; the HSK confirmation is the client's (no other restriction). */
  async update(
    p: AuthPrincipal,
    id: string,
    changes: CurriculumChanges,
  ): Promise<CurriculumDetail> {
    await this.find(p, id);
    if (changes.coverFileId !== undefined) await this.checkCover(p, changes.coverFileId);
    const set: Record<string, unknown> = {};
    if (changes.name !== undefined)
      Object.assign(set, { name: changes.name, nameKey: foldSearch(changes.name) });
    if (changes.hsk !== undefined) set['hsk'] = changes.hsk;
    if (changes.description !== undefined) set['description'] = changes.description;
    if (changes.coverFileId !== undefined) {
      set['coverFileId'] = changes.coverFileId ? new Types.ObjectId(changes.coverFileId) : null;
    }
    let updated: CurriculumDoc | null;
    try {
      updated = await scoped(this.curricula, p.workspaceId)
        .findOneAndUpdate(
          { _id: new Types.ObjectId(id), version: changes.expectedVersion },
          { $set: set, $inc: { version: 1 } },
          { returnDocument: 'after' },
        )
        .lean<CurriculumDoc>();
    } catch (err) {
      if (isDuplicateKey(err)) throw nameTaken();
      throw err;
    }
    if (!updated) throw changedElsewhere();
    logAction({
      action: 'curriculum.update',
      actorId: p.userId,
      curriculumId: id,
      fields: Object.keys(set).filter((k) => k !== 'nameKey'),
    });
    return this.detail(p, id);
  }

  /* ---------- Bài order (REQ-6) ---------- */

  /** AC-6.1 … AC-6.4, AC-17.4: `expectedOrder` must still be the stored order. */
  async reorderLessons(
    p: AuthPrincipal,
    id: string,
    body: { expectedOrder: string[]; order: string[] },
  ): Promise<CurriculumDetail> {
    const c = await this.find(p, id);
    const current = c.lessonIds.map(String);
    const sameSet =
      body.order.length === current.length &&
      new Set(body.order).size === current.length &&
      body.order.every((x) => current.includes(x));
    if (body.expectedOrder.join() !== current.join() || !sameSet) throw changedElsewhere();
    const res = await scoped(this.curricula, p.workspaceId).updateOne(
      { _id: c._id, lessonIds: c.lessonIds },
      { $set: { lessonIds: body.order.map((x) => new Types.ObjectId(x)) } },
    );
    if (!res.modifiedCount && body.order.join() !== current.join()) throw changedElsewhere();
    logAction({ action: 'lesson.reorder', actorId: p.userId, curriculumId: id });
    return this.detail(p, id);
  }

  /** Marks the curriculum as changed (T05 order, "Cập nhật …") after a change of one of its Bài. */
  async touch(workspaceId: string, curriculumId: Types.ObjectId | string): Promise<void> {
    await scoped(this.curricula, workspaceId).updateOne(
      { _id: new Types.ObjectId(String(curriculumId)) },
      { $set: { updatedAt: this.clock.now() } },
    );
  }

  /* ---------- archive and delete (REQ-13) ---------- */

  /** AC-13.5 */
  async archive(p: AuthPrincipal, id: string): Promise<CurriculumDetail> {
    await this.find(p, id);
    await scoped(this.curricula, p.workspaceId).updateOne(
      { _id: new Types.ObjectId(id), archivedAt: null },
      { $set: { archivedAt: this.clock.now() }, $inc: { version: 1 } },
    );
    logAction({ action: 'curriculum.archive', actorId: p.userId, curriculumId: id });
    return this.detail(p, id);
  }

  /** AC-13.6 */
  async restore(p: AuthPrincipal, id: string): Promise<CurriculumDetail> {
    await this.find(p, id);
    await scoped(this.curricula, p.workspaceId).updateOne(
      { _id: new Types.ObjectId(id), archivedAt: { $ne: null } },
      { $set: { archivedAt: null }, $inc: { version: 1 } },
    );
    logAction({ action: 'curriculum.restore', actorId: p.userId, curriculumId: id });
    return this.detail(p, id);
  }

  /** AC-13.1 … AC-13.4: checked when the GV confirms, so a class or data that appeared meanwhile still blocks. */
  async remove(p: AuthPrincipal, id: string): Promise<void> {
    const c = await this.find(p, id);
    const classes = await this.ctx.usingClasses(p.workspaceId, id);
    if (classes.length) {
      logAction({
        action: 'curriculum.delete',
        result: 'denied',
        actorId: p.userId,
        curriculumId: id,
        reason: 'in_use',
      });
      throw new AppError(409, E.IN_USE, inUseMessage(classes.length), {
        classes: classes.map((x) => x.name),
      });
    }
    const lessons = await scoped(this.lessons, p.workspaceId)
      .find({ curriculumId: c._id })
      .lean<LessonDoc[]>();
    if ((await this.ctx.learningData(p.workspaceId, lessons)).size) {
      logAction({
        action: 'curriculum.delete',
        result: 'denied',
        actorId: p.userId,
        curriculumId: id,
        reason: 'learning_data',
      });
      throw new AppError(409, E.HAS_LEARNING_DATA, M.curriculumHasData);
    }
    await this.ctx.ai.discard(
      p.workspaceId,
      lessons.map((l) => String(l._id)),
    );
    await scoped(this.lessons, p.workspaceId).deleteMany({ curriculumId: c._id });
    await scoped(this.curricula, p.workspaceId).deleteOne({ _id: c._id });
    await this.dropCoverIfUnused(p.workspaceId, c.coverFileId);
    logAction({
      action: 'curriculum.delete',
      actorId: p.userId,
      curriculumId: id,
      lessons: lessons.length,
    });
  }

  private async dropCoverIfUnused(workspaceId: string, fileId: Types.ObjectId | null | undefined) {
    if (!fileId) return;
    if (await scoped(this.curricula, workspaceId).exists({ coverFileId: fileId })) return;
    await this.files.delete(String(fileId)).catch(() => undefined);
  }

  /* ---------- duplicate (REQ-15) ---------- */

  /** AC-15.1: "<name> (bản sao)", or " (bản sao 2)", " (bản sao 3)"… when taken (archived curricula included). */
  async copyNameFor(p: AuthPrincipal, id: string): Promise<{ name: string; hsk: HskLevel }> {
    const c = await this.find(p, id);
    const scope = scoped(this.curricula, p.workspaceId);
    for (let n = 1; ; n++) {
      const name = copyName(c.name, n);
      if (!(await scope.exists({ nameKey: foldSearch(name) }))) return { name, hsk: c.hsk };
    }
  }

  /**
   * AC-15.2 … AC-15.6: the copy is written hidden (`copyState: copying`) and only becomes visible once every Bài is in;
   * any failure removes it. One duplicate per source at a time.
   */
  async duplicate(
    p: AuthPrincipal,
    id: string,
    input: { name: string; hsk: HskLevel },
  ): Promise<CurriculumDetail> {
    const source = await this.find(p, id);
    const scope = scoped(this.curricula, p.workspaceId);
    const now = this.clock.now();
    const locked = await scope.updateOne(
      {
        _id: source._id,
        $or: [{ copyLockAt: null }, { copyLockAt: { $lt: new Date(now.getTime() - STALE_MS) } }],
      },
      { $set: { copyLockAt: now } },
    );
    if (!locked.modifiedCount) throw copyInProgress();

    let copyId: Types.ObjectId | null = null;
    try {
      try {
        const copy = await scope.create({
          name: input.name,
          nameKey: foldSearch(input.name),
          hsk: input.hsk,
          description: source.description,
          coverFileId: source.coverFileId ?? null,
          lessonIds: [],
          copyState: 'copying',
        });
        copyId = copy._id as Types.ObjectId;
      } catch (err) {
        if (isDuplicateKey(err)) throw nameTaken();
        throw err;
      }
      const lessons = await this.orderedLessons(p.workspaceId, source);
      const ids: Types.ObjectId[] = [];
      for (let i = 0; i < lessons.length; i += COPY_BATCH) {
        const batch = lessons.slice(i, i + COPY_BATCH).map((l) => ({
          _id: new Types.ObjectId(),
          workspaceId: new Types.ObjectId(p.workspaceId),
          curriculumId: copyId,
          name: l.name,
          status: l.status,
          items: copyItems(l.items, now, false),
          sectionUpdatedAt: { lesson: now, exercise: now },
          version: 1,
          rev: 1,
        }));
        await this.lessons.insertMany(batch);
        ids.push(...batch.map((b) => b._id));
        if (i === 0) await this.faults.apply('duplicate-curriculum');
      }
      if (!lessons.length) await this.faults.apply('duplicate-curriculum');
      await scope.updateOne({ _id: copyId }, { $set: { lessonIds: ids, copyState: null } });
      logAction({
        action: 'curriculum.duplicate',
        actorId: p.userId,
        curriculumId: id,
        copyId: String(copyId),
        lessons: ids.length,
      });
      return this.detail(p, String(copyId));
    } catch (err) {
      if (copyId) await this.dropCopy(p.workspaceId, copyId);
      logAction({
        action: 'curriculum.duplicate',
        result: 'failed',
        actorId: p.userId,
        curriculumId: id,
      });
      if (err instanceof AppError) throw err;
      throw copyFailed();
    } finally {
      await scope.updateOne({ _id: source._id }, { $set: { copyLockAt: null } });
    }
  }

  private async dropCopy(workspaceId: string, copyId: Types.ObjectId): Promise<void> {
    await scoped(this.lessons, workspaceId).deleteMany({ curriculumId: copyId });
    await scoped(this.curricula, workspaceId).deleteOne({ _id: copyId, copyState: 'copying' });
  }

  /** Copies left behind by a crash are removed before listing (AC-15.5). */
  private async sweepStaleCopies(workspaceId: string): Promise<void> {
    const stale = await scoped(this.curricula, workspaceId)
      .find({
        copyState: 'copying',
        createdAt: { $lt: new Date(this.clock.now().getTime() - STALE_MS) },
      })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId }[]>();
    for (const s of stale) await this.dropCopy(workspaceId, s._id);
  }
}

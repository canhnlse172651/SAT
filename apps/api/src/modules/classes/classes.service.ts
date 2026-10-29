import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CLASS_ERROR_CODES as E,
  CLASS_FILTERS,
  CLASS_LIMITS,
  CLASS_MESSAGES as M,
  type ClassDetail,
  type ClassFilter,
  type ClassListResponse,
  type CurriculumOption,
  type PatchClassBody,
  type StudentOptionsResponse,
  createClassBodySchema,
  dayRange,
  foldSearch,
  startDateRangeMessage,
  studentsRemovedMessage,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { StudentDirectory } from '../accounts/student-directory.js';
import { CurriculumReader, type CurriculumSummary } from '../curriculum/curriculum-reader.js';
import {
  assertNotEnded,
  isDuplicateKey,
  loadClass,
  nameKeyOf,
  nameTaken,
  searchKeyOf,
} from './class-common.js';
import { statusFilter, statusOf, todayOf } from './class-status.js';
import { CLASS_MODEL, type ClassDoc, MEMBER_MODEL, type MemberDoc } from './classes.model.js';
import { logClass } from './classes.log.js';
import {
  CLASS_EXAMS,
  CLASS_LEARNING,
  ClassFaults,
  type ClassExams,
  type ClassLearning,
} from './classes.ports.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));

/** REQ-1 … REQ-11 for the teacher: the class list, the wizard's data, the class itself. */
@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(MEMBER_MODEL) private readonly members: Model<MemberDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    @Inject(CLASS_EXAMS) private readonly exams: ClassExams,
    private readonly students: StudentDirectory,
    private readonly curricula: CurriculumReader,
    private readonly faults: ClassFaults,
  ) {}

  /* ---------- T02 (REQ-6) ---------- */

  async list(
    p: AuthPrincipal,
    query: { status: ClassFilter; q?: string | undefined; page: number },
  ): Promise<ClassListResponse> {
    const today = todayOf(this.clock);
    const scope = scoped(this.classes, p.workspaceId);
    const q = foldSearch(query.q ?? '');
    const filter = {
      ...statusFilter(query.status, today),
      ...(q ? { searchKey: { $regex: escapeRegex(q) } } : {}),
    };
    const limit = CLASS_LIMITS.pageSize;
    const [total, docs, ...counts] = await Promise.all([
      scope.count(filter),
      scope
        .find(filter)
        .sort({ startDate: -1, _id: -1 })
        .skip((query.page - 1) * limit)
        .limit(limit)
        .lean<ClassDoc[]>(),
      ...CLASS_FILTERS.map((f) => scope.count(statusFilter(f, today))),
    ]);
    const curricula = await this.curricula.summaries(
      p.workspaceId,
      docs.map((d) => d.curriculumId),
    );
    return {
      items: docs.map((d) => {
        const c = curricula.get(String(d.curriculumId));
        return {
          id: String(d._id),
          name: d.name,
          status: statusOf(d, today),
          startDate: d.startDate,
          curriculum: c ? { id: c.id, name: c.name, hsk: c.hsk } : null,
          memberCount: d.memberCount,
          createdAt: d.createdAt.toISOString(),
        };
      }),
      page: query.page,
      limit,
      total,
      counts: Object.fromEntries(CLASS_FILTERS.map((f, i) => [f, counts[i] ?? 0])) as Record<
        ClassFilter,
        number
      >,
    };
  }

  /* ---------- wizard data (REQ-2, REQ-3, REQ-4) ---------- */

  /** AC-2.4, AC-7.3: unique per workspace, ended classes included, the edited class excluded. */
  async nameAvailable(p: AuthPrincipal, name: string, excludeId?: string): Promise<boolean> {
    const taken = await scoped(this.classes, p.workspaceId).exists({
      nameKey: nameKeyOf(name),
      ...(excludeId ? { _id: { $ne: oid(excludeId) } } : {}),
    });
    return !taken;
  }

  /** AC-3.1, AC-3.2, AC-8.2: every HV of the workspace, A→Z, 20 per page; `inClass` for the T04 dialog. */
  async studentOptions(
    p: AuthPrincipal,
    query: { q?: string | undefined; page: number; classId?: string | undefined },
  ): Promise<StudentOptionsResponse> {
    if (query.classId) await loadClass(this.classes, p.workspaceId, query.classId);
    const limit = CLASS_LIMITS.pageSize;
    const found = await this.students.search(p.workspaceId, {
      q: query.q,
      page: query.page,
      limit,
    });
    const inClass = query.classId
      ? new Set(
          (
            await scoped(this.members, p.workspaceId)
              .find({
                classId: oid(query.classId),
                removedAt: null,
                studentId: { $in: found.items.map((s) => oid(s.id)) },
              })
              .select({ studentId: 1 })
              .lean<MemberDoc[]>()
          ).map((m) => String(m.studentId)),
        )
      : new Set<string>();
    return {
      items: found.items.map((s) => ({ ...s, inClass: inClass.has(s.id) })),
      page: query.page,
      limit,
      total: found.total,
      workspaceTotal: found.workspaceTotal,
    };
  }

  /** AC-4.1, AC-9.1: non-archived curricula, HSK ascending then name, with published Bài and using classes. */
  async curriculumOptions(p: AuthPrincipal): Promise<{ items: CurriculumOption[] }> {
    const list = await this.curricula.selectable(p.workspaceId);
    const usage = await this.usage(p.workspaceId);
    return {
      items: list
        .map((c) => ({
          id: c.id,
          name: c.name,
          hsk: c.hsk,
          publishedLessonCount: c.publishedLessonCount,
          usedBy: usage.get(c.id) ?? 0,
        }))
        .sort((a, b) => a.hsk - b.hsk || a.name.localeCompare(b.name, 'vi')),
    };
  }

  private async usage(workspaceId: string): Promise<Map<string, number>> {
    const rows = (await scoped(this.classes, workspaceId).aggregate([
      { $group: { _id: '$curriculumId', n: { $sum: 1 } } },
    ])) as { _id: Types.ObjectId; n: number }[];
    return new Map(rows.map((r) => [String(r._id), r.n]));
  }

  /* ---------- create (REQ-5) ---------- */

  private assertStartInRange(day: string): void {
    const today = todayOf(this.clock);
    const [from, to] = dayRange(today);
    if (day < from || day > to)
      throw new AppError(400, 'VALIDATION_ERROR', startDateRangeMessage(today), {
        step: 1,
        field: 'startDate',
      });
  }

  /** AC-14.6: a curriculum of another workspace is the uniform 404; a missing or archived one is AC-5.4. */
  private async usableCurriculum(p: AuthPrincipal, id: string): Promise<CurriculumSummary> {
    const c = (await this.curricula.summaries(p.workspaceId, [id])).get(id);
    if (c && !c.archived) return c;
    if (await this.curricula.isElsewhere(p.workspaceId, id)) throw notFound();
    throw new AppError(409, E.CURRICULUM_UNAVAILABLE, M.curriculumUnavailable, { step: 3 });
  }

  /** AC-5.3 … AC-5.6: one class per wizard run, re-checked at the moment of "Tạo lớp". */
  async create(
    p: AuthPrincipal,
    input: z.output<typeof createClassBodySchema>,
  ): Promise<ClassDetail> {
    const scope = scoped(this.classes, p.workspaceId);
    const existing = await scope.findOne({ createKey: input.createKey }).lean<ClassDoc>();
    if (existing) return this.detailOf(p, existing);
    await this.faults.apply('create');
    this.assertStartInRange(input.startDate);

    if (!(await this.nameAvailable(p, input.name))) throw nameTaken();
    const ids = [...new Set(input.studentIds)];
    const found = await this.students.byIds(p.workspaceId, ids);
    if (found.length < ids.length) {
      const have = new Set(found.map((s) => s.id));
      const missing = ids.filter((id) => !have.has(id));
      if (await this.students.anyElsewhere(p.workspaceId, missing)) throw notFound();
      throw new AppError(409, E.STUDENTS_MISSING, studentsRemovedMessage(missing.length), {
        step: 2,
        missingIds: missing,
      });
    }
    const curriculum = await this.usableCurriculum(p, input.curriculumId);

    // Memberships first, under a pre-generated id: the class becomes visible only once its members exist.
    const today = todayOf(this.clock);
    const addedAt = this.clock.now();
    const classId = new Types.ObjectId();
    const memberScope = scoped(this.members, p.workspaceId);
    await Promise.all(
      ids.map((studentId) =>
        memberScope.create({
          classId,
          studentId: oid(studentId),
          joinedAt: today,
          addedAt,
          removedAt: null,
        }),
      ),
    );
    try {
      await scope.create({
        _id: classId,
        name: input.name,
        nameKey: nameKeyOf(input.name),
        searchKey: searchKeyOf(input.name),
        description: input.description,
        schedule: input.schedule,
        startDate: input.startDate,
        endDate: null,
        curriculumId: oid(curriculum.id),
        memberCount: ids.length,
        hidden: [],
        deadlines: [],
        createKey: input.createKey,
      });
    } catch (err) {
      await memberScope.deleteMany({ classId });
      if (isDuplicateKey(err, 'createKey')) {
        const again = await scope.findOne({ createKey: input.createKey }).lean<ClassDoc>();
        if (again) return this.detailOf(p, again);
      }
      if (isDuplicateKey(err)) throw nameTaken();
      throw err;
    }
    const doc = await scope.findById(classId).lean<ClassDoc>();
    if (!doc) throw notFound();
    logClass({
      action: 'class.create',
      actorId: p.userId,
      classId: String(classId),
      students: ids.length,
    });
    return this.detailOf(p, doc);
  }

  /* ---------- T04 (REQ-7) ---------- */

  async detail(p: AuthPrincipal, id: string): Promise<ClassDetail> {
    return this.detailOf(p, await loadClass(this.classes, p.workspaceId, id));
  }

  /** Exercise submissions (AC-9.3) and any submission incl. exams (AC-11.3), removed students included. */
  async submissions(
    workspaceId: string,
    classId: string,
  ): Promise<{ exercise: boolean; any: boolean }> {
    const [ex, exam] = await Promise.all([
      this.learning.classesWithSubmissions(workspaceId, [classId]),
      this.exams.classesWithSubmissions(workspaceId, [classId]),
    ]);
    return { exercise: ex.has(classId), any: ex.has(classId) || exam.has(classId) };
  }

  private async detailOf(p: AuthPrincipal, c: ClassDoc): Promise<ClassDetail> {
    const id = String(c._id);
    const today = todayOf(this.clock);
    const [curricula, lessons, subs] = await Promise.all([
      this.curricula.summaries(p.workspaceId, [c.curriculumId]),
      this.curricula.lessons(p.workspaceId, c.curriculumId),
      this.submissions(p.workspaceId, id),
    ]);
    const cur = curricula.get(String(c.curriculumId));
    const lessonIds = new Set(lessons.map((l) => String(l._id)));
    return {
      id,
      name: c.name,
      status: statusOf(c, today),
      startDate: c.startDate,
      endDate: c.endDate ?? null,
      description: c.description,
      schedule: c.schedule,
      createdAt: c.createdAt.toISOString(),
      version: c.version,
      memberCount: c.memberCount,
      today,
      curriculum: {
        id: String(c.curriculumId),
        name: cur?.name ?? '',
        hsk: cur?.hsk ?? 1,
        publishedLessonCount: cur?.publishedLessonCount ?? 0,
        archived: cur?.archived ?? true,
      },
      hiddenCount: c.hidden.filter((h) => lessonIds.has(String(h.lessonId))).length,
      hasExerciseSubmissions: subs.exercise,
      hasSubmissions: subs.any,
    };
  }

  /** AC-7.3, AC-7.4, AC-7.5, AC-10.3 */
  async update(p: AuthPrincipal, id: string, input: PatchClassBody): Promise<ClassDetail> {
    const c = await loadClass(this.classes, p.workspaceId, id);
    const today = todayOf(this.clock);
    const changes: Record<string, unknown> = {};
    if (input.name !== undefined && input.name !== c.name) {
      if (!(await this.nameAvailable(p, input.name, id))) throw nameTaken();
      Object.assign(changes, {
        name: input.name,
        nameKey: nameKeyOf(input.name),
        searchKey: searchKeyOf(input.name),
      });
    }
    if (input.startDate !== undefined && input.startDate !== c.startDate) {
      assertNotEnded(c, today);
      this.assertStartInRange(input.startDate);
      if (statusOf(c, today) === 'active' && input.startDate > today)
        throw new AppError(409, E.ACTIVE_START_FUTURE, M.activeStartFuture, {
          field: 'startDate',
        });
      changes['startDate'] = input.startDate;
    }
    if (input.description !== undefined) changes['description'] = input.description;
    if (input.schedule !== undefined) changes['schedule'] = input.schedule;

    let updated: ClassDoc | null;
    try {
      updated = await scoped(this.classes, p.workspaceId)
        .findOneAndUpdate(
          { _id: c._id, version: input.expectedVersion },
          { $set: changes, $inc: { version: 1 } },
          { returnDocument: 'after' },
        )
        .lean<ClassDoc>();
    } catch (err) {
      if (isDuplicateKey(err)) throw nameTaken();
      throw err;
    }
    if (!updated) throw new AppError(409, 'CONFLICT', M.changedElsewhere);
    logClass({
      action: 'class.update',
      actorId: p.userId,
      classId: id,
      fields: Object.keys(changes).length,
    });
    return this.detailOf(p, updated);
  }

  /* ---------- curriculum, lifecycle (REQ-9, REQ-10, REQ-11) ---------- */

  /** AC-9.2 … AC-9.4: no exercise submission at the moment of confirming; hidden sections and deadlines reset. */
  async changeCurriculum(p: AuthPrincipal, id: string, curriculumId: string): Promise<ClassDetail> {
    const c = await loadClass(this.classes, p.workspaceId, id);
    assertNotEnded(c, todayOf(this.clock));
    const target = await this.usableCurriculum(p, curriculumId);
    if ((await this.submissions(p.workspaceId, id)).exercise)
      throw new AppError(409, E.HAS_SUBMISSIONS, M.curriculumLocked);
    const updated = await scoped(this.classes, p.workspaceId)
      .findOneAndUpdate(
        { _id: c._id },
        {
          $set: { curriculumId: oid(target.id), hidden: [], deadlines: [] },
          $inc: { version: 1, rev: 1 },
        },
        { returnDocument: 'after' },
      )
      .lean<ClassDoc>();
    if (!updated) throw notFound();
    logClass({ action: 'class.curriculum', actorId: p.userId, classId: id });
    return this.detailOf(p, updated);
  }

  /** AC-10.1, AC-10.2, AC-10.6: only an active class ends, only by hand. */
  async end(p: AuthPrincipal, id: string): Promise<ClassDetail> {
    const today = todayOf(this.clock);
    const c = await loadClass(this.classes, p.workspaceId, id);
    if (statusOf(c, today) !== 'active')
      throw new AppError(409, E.CLASS_NOT_ACTIVE, M.upcomingHint);
    const updated = await scoped(this.classes, p.workspaceId)
      .findOneAndUpdate(
        { _id: c._id, endDate: null },
        { $set: { endDate: today }, $inc: { version: 1 } },
        { returnDocument: 'after' },
      )
      .lean<ClassDoc>();
    logClass({ action: 'class.end', actorId: p.userId, classId: id });
    return this.detailOf(p, updated ?? c);
  }

  /** AC-10.4 */
  async reopen(p: AuthPrincipal, id: string): Promise<ClassDetail> {
    const c = await loadClass(this.classes, p.workspaceId, id);
    const updated = await scoped(this.classes, p.workspaceId)
      .findOneAndUpdate(
        { _id: c._id },
        { $set: { endDate: null }, $inc: { version: 1 } },
        { returnDocument: 'after' },
      )
      .lean<ClassDoc>();
    logClass({ action: 'class.reopen', actorId: p.userId, classId: id });
    return this.detailOf(p, updated ?? c);
  }

  /** AC-11.1 … AC-11.5: only without any submission (005 or 006) at the moment of confirming. */
  async remove(p: AuthPrincipal, id: string): Promise<{ name: string }> {
    const c = await loadClass(this.classes, p.workspaceId, id);
    if ((await this.submissions(p.workspaceId, id)).any) {
      logClass({ action: 'class.delete', result: 'denied', actorId: p.userId, classId: id });
      throw new AppError(409, E.HAS_SUBMISSIONS, M.deleteLocked);
    }
    await scoped(this.classes, p.workspaceId).deleteOne({ _id: c._id });
    await scoped(this.members, p.workspaceId).deleteMany({ classId: c._id });
    await this.exams.removeClass(p.workspaceId, id);
    logClass({ action: 'class.delete', actorId: p.userId, classId: id, students: c.memberCount });
    return { name: c.name };
  }
}

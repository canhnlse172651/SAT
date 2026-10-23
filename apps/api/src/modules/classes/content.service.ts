import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CLASS_ERROR_CODES as E,
  type ClassContent,
  type DeadlineBody,
  type Section,
  type VisibilityBody,
  type VisibilityScope,
  alreadyInStateMessage,
  dayRange,
  toVnParts,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { CurriculumReader } from '../curriculum/curriculum-reader.js';
import type { LessonDoc } from '../curriculum/curriculum.model.js';
import { assertNotEnded, loadClass } from './class-common.js';
import { statusOf, todayOf } from './class-status.js';
import { deadlineOf, isHidden } from './class-visibility.js';
import { CLASS_MODEL, type ClassDoc, type Deadline, type HiddenSection } from './classes.model.js';
import { logClass } from './classes.log.js';
import { CLASS_LEARNING, ClassFaults, type ClassLearning } from './classes.ports.js';
import { MembersService } from './members.service.js';

const oid = (id: string | Types.ObjectId) => new Types.ObjectId(String(id));
const SECTIONS: Section[] = ['lesson', 'exercise'];
const published = (l: LessonDoc, section: Section) =>
  l.items.filter((i) => i.section === section && i.status === 'published');

interface Target {
  lesson: LessonDoc;
  section: Section;
}

/** REQ-15, REQ-16, REQ-21, REQ-22: what a class shows of its curriculum, and its deadlines. */
@Injectable()
export class ContentService {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    private readonly curricula: CurriculumReader,
    private readonly members: MembersService,
    private readonly faults: ClassFaults,
  ) {}

  /** AC-15.1, AC-15.2, AC-15.3, AC-21.1 */
  async content(p: AuthPrincipal, classId: string): Promise<ClassContent> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    return this.contentOf(p, c);
  }

  private async contentOf(
    p: AuthPrincipal,
    c: ClassDoc,
    lessons?: LessonDoc[],
  ): Promise<ClassContent> {
    const all = lessons ?? (await this.curricula.lessons(p.workspaceId, c.curriculumId));
    const cur = (await this.curricula.summaries(p.workspaceId, [c.curriculumId])).get(
      String(c.curriculumId),
    );
    const today = todayOf(this.clock);
    const now = toVnParts(this.clock.now());
    const ids = new Set(all.map((l) => String(l._id)));
    return {
      curriculum: { id: String(c.curriculumId), name: cur?.name ?? '' },
      status: statusOf(c, today),
      startDate: c.startDate,
      today,
      nowMinutes: now.hour * 60 + now.minute,
      hiddenCount: c.hidden.filter((h) => ids.has(String(h.lessonId))).length,
      lessons: all.map((l) => ({
        id: String(l._id),
        name: l.name,
        status: l.status,
        sections: {
          lesson: {
            publishedCount: published(l, 'lesson').length,
            hidden: isHidden(c, l._id, 'lesson'),
          },
          exercise: {
            publishedCount: published(l, 'exercise').length,
            hidden: isHidden(c, l._id, 'exercise'),
          },
        },
        sets: published(l, 'exercise').map((s) => ({
          id: String(s._id),
          title: s.title,
          deadline: deadlineOf(c, s._id),
        })),
      })),
    };
  }

  /* ---------- hide / show (REQ-16) ---------- */

  private targets(lessons: LessonDoc[], scope: VisibilityScope): Target[] {
    if (scope.kind === 'column')
      return lessons.map((lesson) => ({ lesson, section: scope.section }));
    const lesson = lessons.find((l) => String(l._id) === scope.lessonId);
    if (!lesson) throw notFound();
    return scope.kind === 'lesson'
      ? SECTIONS.map((section) => ({ lesson, section }))
      : [{ lesson, section: scope.section }];
  }

  /** AC-16.3, AC-16.4: how many sections change, and how many HV have an attempt in progress in hidden sets. */
  async visibilityPreview(
    p: AuthPrincipal,
    classId: string,
    body: VisibilityBody,
  ): Promise<{ changes: number; inProgress: number }> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    const lessons = await this.curricula.lessons(p.workspaceId, c.curriculumId);
    const changing = this.targets(lessons, body.scope).filter(
      (t) => isHidden(c, t.lesson._id, t.section) !== body.hidden,
    );
    let inProgress = 0;
    const setIds = body.hidden
      ? changing
          .filter((t) => t.section === 'exercise')
          .flatMap((t) => t.lesson.items.filter((i) => i.section === 'exercise'))
          .map((i) => String(i._id))
      : [];
    if (setIds.length) {
      const active = new Set(
        (await this.members.roster(p.workspaceId, c._id)).map((r) => r.student.id),
      );
      const records = await this.learning.records(p.workspaceId, String(c._id), { setIds });
      inProgress = new Set(
        records.filter((r) => r.inProgress && active.has(r.studentId)).map((r) => r.studentId),
      ).size;
    }
    return { changes: changing.length, inProgress };
  }

  /** AC-16.1, AC-16.2, AC-16.4 … AC-16.6: one compare-and-swap update of the class — all or nothing. */
  async setVisibility(
    p: AuthPrincipal,
    classId: string,
    body: VisibilityBody,
  ): Promise<{ changed: number; content: ClassContent }> {
    let c = await loadClass(this.classes, p.workspaceId, classId);
    assertNotEnded(c, todayOf(this.clock));
    const lessons = await this.curricula.lessons(p.workspaceId, c.curriculumId);
    for (let attempt = 0; attempt < 5; attempt++) {
      const targets = this.targets(lessons, body.scope);
      const changing = targets.filter((t) => isHidden(c, t.lesson._id, t.section) !== body.hidden);
      if (!changing.length) {
        if (body.scope.kind === 'section')
          throw new AppError(409, E.ALREADY_IN_STATE, alreadyInStateMessage(body.hidden), {
            content: await this.contentOf(p, c, lessons),
          });
        return { changed: 0, content: await this.contentOf(p, c, lessons) };
      }
      const key = (lessonId: Types.ObjectId, section: Section) => `${String(lessonId)}:${section}`;
      const off = new Set(changing.map((t) => key(t.lesson._id, t.section)));
      const now = this.clock.now();
      const hidden: HiddenSection[] = body.hidden
        ? [
            ...c.hidden,
            ...changing.map((t) => ({
              lessonId: t.lesson._id,
              section: t.section,
              by: oid(p.userId),
              at: now,
            })),
          ]
        : c.hidden.filter((h) => !off.has(key(h.lessonId, h.section)));
      try {
        await this.faults.apply('visibility');
      } catch (err) {
        logClass({ action: 'class.visibility', result: 'failed', actorId: p.userId, classId });
        throw err;
      }
      const updated = await scoped(this.classes, p.workspaceId)
        .findOneAndUpdate(
          { _id: c._id, rev: c.rev },
          { $set: { hidden }, $inc: { rev: 1 } },
          { returnDocument: 'after' },
        )
        .lean<ClassDoc>();
      if (updated) {
        logClass({
          action: body.hidden ? 'class.hide' : 'class.show',
          actorId: p.userId,
          classId,
          scope: body.scope.kind,
          sections: changing.length,
        });
        return { changed: changing.length, content: await this.contentOf(p, updated, lessons) };
      }
      c = await loadClass(this.classes, p.workspaceId, classId);
    }
    throw new AppError(409, 'CONFLICT', alreadyInStateMessage(body.hidden));
  }

  /* ---------- deadlines (REQ-21, REQ-22) ---------- */

  /** AC-21.3, AC-21.6, AC-22.1 … AC-22.3: set / clear one set or every published set of a Bài, all or nothing. */
  async setDeadlines(
    p: AuthPrincipal,
    classId: string,
    body: DeadlineBody,
  ): Promise<{ changed: number; content: ClassContent }> {
    let c = await loadClass(this.classes, p.workspaceId, classId);
    const today = todayOf(this.clock);
    assertNotEnded(c, today);
    if (body.date) {
      const [from, to] = dayRange(today);
      if (body.date < from || body.date > to)
        throw new AppError(400, 'VALIDATION_ERROR', 'Ngày nằm ngoài khoảng cho phép');
    }
    const lessons = await this.curricula.lessons(p.workspaceId, c.curriculumId);
    let setIds: string[];
    if ('setId' in body.target) {
      const setId = body.target.setId;
      const owner = lessons.find((l) =>
        published(l, 'exercise').some((i) => String(i._id) === setId),
      );
      if (!owner) throw notFound();
      setIds = [setId];
    } else {
      const lessonId = body.target.lessonId;
      const lesson = lessons.find((l) => String(l._id) === lessonId);
      if (!lesson) throw notFound();
      setIds = published(lesson, 'exercise').map((i) => String(i._id));
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const targets = new Set(setIds);
      const now = this.clock.now();
      const kept = c.deadlines.filter((d) => !targets.has(String(d.setId)));
      const next: Deadline[] = body.date
        ? [
            ...kept,
            ...setIds.map((setId) => {
              const old = c.deadlines.find((d) => String(d.setId) === setId);
              return {
                setId: oid(setId),
                date: body.date as string,
                by: oid(p.userId),
                at: now,
                // AC-26.3: the "sent" information lasts until the deadline changes.
                reminded: old?.date === body.date ? (old.reminded ?? null) : null,
              };
            }),
          ]
        : kept;
      try {
        await this.faults.apply('deadlines');
      } catch (err) {
        logClass({ action: 'class.deadline', result: 'failed', actorId: p.userId, classId });
        throw err;
      }
      const updated = await scoped(this.classes, p.workspaceId)
        .findOneAndUpdate(
          { _id: c._id, rev: c.rev },
          { $set: { deadlines: next }, $inc: { rev: 1 } },
          { returnDocument: 'after' },
        )
        .lean<ClassDoc>();
      if (updated) {
        logClass({
          action: body.date ? 'class.deadline.set' : 'class.deadline.clear',
          actorId: p.userId,
          classId,
          sets: setIds.length,
        });
        return { changed: setIds.length, content: await this.contentOf(p, updated, lessons) };
      }
      c = await loadClass(this.classes, p.workspaceId, classId);
    }
    throw new AppError(409, 'CONFLICT', 'Không thể cập nhật hạn nộp. Vui lòng thử lại.');
  }

  /** AC-26.3: when the last sweep reminded each set and how many HV — read by 009, not shown on the tab. */
  async reminders(
    p: AuthPrincipal,
    classId: string,
  ): Promise<{ items: { setId: string; date: string; remindedAt: string; count: number }[] }> {
    const c = await loadClass(this.classes, p.workspaceId, classId);
    return {
      items: c.deadlines
        .filter((d) => d.reminded && d.reminded.date === d.date)
        .map((d) => ({
          setId: String(d.setId),
          date: d.date,
          remindedAt: (d.reminded as { at: Date }).at.toISOString(),
          count: d.reminded?.count ?? 0,
        })),
    };
  }
}

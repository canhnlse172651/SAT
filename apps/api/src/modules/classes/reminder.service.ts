import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MAIL_TAGS, toVnParts } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import {
  CLOCK,
  type Clock,
  EMAIL_SENDER,
  EmailRejectedError,
  type EmailSender,
  JOB_SCHEDULER,
  type JobScheduler,
} from '../../common/ports/index.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { MAIL_FROM_NAME, renderMail } from '../accounts/account-mail.templates.js';
import { CurriculumReader } from '../curriculum/curriculum-reader.js';
import type { ItemDoc, LessonDoc } from '../curriculum/curriculum.model.js';
import { HV_PATHS } from './class-common.js';
import { todayOf } from './class-status.js';
import { deadlineOf, visibleUnit } from './class-visibility.js';
import {
  CLASS_MODEL,
  type ClassDoc,
  REMINDER_MODEL,
  REMINDER_RUN_MODEL,
  type ReminderDoc,
  type ReminderRunDoc,
} from './classes.model.js';
import { logClass } from './classes.log.js';
import { CLASS_LEARNING, type ClassLearning } from './classes.ports.js';
import { MembersService } from './members.service.js';
import { reminderMail } from './reminder-mail.js';

export const REMINDER_JOB = 'class-deadline-reminders';
/** The sweep runs at 08:00 VN; a missed one is caught up once before 20:00 the same day (AC-24.6). */
const SWEEP_HOUR = 8;
const CATCH_UP_UNTIL_HOUR = 20;

export const REMINDER_OPTIONS = Symbol('REMINDER_OPTIONS');
export interface ReminderOptions {
  appOrigin: string;
}

interface DueSet {
  set: ItemDoc;
  lesson: LessonDoc;
}

export interface SweepResult {
  date: string;
  skipped: boolean;
  sent: number;
  failed: number;
}

/**
 * REQ-24 … REQ-26: at 08:00 VN, one e-mail per HV per class listing the class's visible sets due today that the HV has
 * not submitted. Eligibility is read at sweep time; a day is swept once, and one e-mail per (HV, class, day) is
 * guaranteed by a unique reminder row, so a re-run never sends twice (AC-24.5).
 *
 * The sweep reads classes of every workspace (a system job, no request workspace): `classes` is queried by
 * `deadlines.date` without a workspace filter, then everything per class goes through `scoped()` with its workspace.
 */
@Injectable()
export class ReminderService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @InjectModel(REMINDER_MODEL) private readonly reminders: Model<ReminderDoc>,
    @InjectModel(REMINDER_RUN_MODEL) private readonly runs: Model<ReminderRunDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(JOB_SCHEDULER) private readonly jobs: JobScheduler,
    @Inject(EMAIL_SENDER) private readonly mail: EmailSender,
    @Inject(CLASS_LEARNING) private readonly learning: ClassLearning,
    @Inject(REMINDER_OPTIONS) private readonly options: ReminderOptions,
    private readonly members: MembersService,
    private readonly curricula: CurriculumReader,
  ) {}

  onApplicationBootstrap(): void {
    this.jobs.every(REMINDER_JOB, '08:00', () => this.sweep().then(() => undefined));
    void this.catchUp().catch((err: unknown) =>
      logClass({ action: 'reminder.catch-up', result: 'failed', reason: String(err) }),
    );
  }

  /** AC-24.6: after an outage, sweep once if today's sweep has not finished and it is still before 20:00 VN. */
  async catchUp(): Promise<SweepResult | null> {
    const hour = toVnParts(this.clock.now()).hour;
    if (hour < SWEEP_HOUR) return null;
    const date = todayOf(this.clock);
    const run = await this.runs.findById(date).lean<ReminderRunDoc>();
    if (run?.status === 'finished') return null;
    if (hour >= CATCH_UP_UNTIL_HOUR) {
      logClass({ action: 'reminder.sweep', result: 'denied', date, reason: 'after 20:00' });
      return null;
    }
    return this.sweep();
  }

  /** Dev/test only (`/api/dev/classes/reminders/run`): today counts as not swept yet. */
  async forgetToday(): Promise<void> {
    await this.runs.deleteOne({ _id: todayOf(this.clock) });
  }

  /** The 08:00 sweep of today (AC-24.1 … AC-24.5). */
  async sweep(): Promise<SweepResult> {
    const date = todayOf(this.clock);
    const startedAt = this.clock.now();
    const before = await this.runs
      .findOneAndUpdate(
        { _id: date },
        { $setOnInsert: { status: 'running', startedAt, finishedAt: null, sent: 0, failed: 0 } },
        { upsert: true, returnDocument: 'before' },
      )
      .lean<ReminderRunDoc>();
    if (before?.status === 'finished') return { date, skipped: true, sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;
    const due = await this.classes
      .find({ 'deadlines.date': date, endDate: null, startDate: { $lte: date } })
      .lean<ClassDoc[]>();
    for (const c of due) {
      const r = await this.sweepClass(c, date);
      sent += r.sent;
      failed += r.failed;
    }
    await this.runs.updateOne(
      { _id: date },
      { $set: { status: 'finished', finishedAt: this.clock.now(), sent, failed } },
    );
    logClass({
      action: 'reminder.sweep',
      date,
      startedAt: startedAt.toISOString(),
      finishedAt: this.clock.now().toISOString(),
      classes: due.length,
      sent,
      failed,
    });
    return { date, skipped: false, sent, failed };
  }

  /** Sets of the class due `date` that its HV can see (AC-24.2), in curriculum order (AC-25.2). */
  private dueSets(c: ClassDoc, lessons: LessonDoc[], date: string): DueSet[] {
    return lessons.flatMap((lesson) => {
      const unit = visibleUnit(c, lesson);
      return (unit?.sets ?? [])
        .filter((set) => deadlineOf(c, set._id) === date)
        .map((set) => ({ set, lesson }));
    });
  }

  private async sweepClass(c: ClassDoc, date: string): Promise<{ sent: number; failed: number }> {
    const workspaceId = String(c.workspaceId);
    const classId = String(c._id);
    const due = this.dueSets(c, await this.curricula.lessons(workspaceId, c.curriculumId), date);
    if (!due.length) return { sent: 0, failed: 0 };
    const roster = (await this.members.roster(workspaceId, c._id)).filter(
      (r) => r.student.status === 'active',
    );
    const records = await this.learning.records(workspaceId, classId, {
      setIds: due.map((d) => String(d.set._id)),
    });
    const submitted = new Set(
      records.filter((r) => r.submission).map((r) => `${r.studentId}:${r.setId}`),
    );
    const perSet = new Map(due.map((d) => [String(d.set._id), 0]));
    let sent = 0;
    let failed = 0;
    for (const { student } of roster) {
      const pending = due.filter((d) => !submitted.has(`${student.id}:${String(d.set._id)}`));
      if (!pending.length) continue;
      try {
        await scoped(this.reminders, workspaceId).create({
          classId: c._id,
          studentId: new Types.ObjectId(student.id),
          date,
          setIds: pending.map((d) => d.set._id),
          result: 'pending',
        });
      } catch (err) {
        if ((err as { code?: number }).code === 11000) continue; // already reminded today (AC-24.5)
        throw err;
      }
      const only = pending.length === 1 ? pending[0] : undefined;
      const path = only
        ? `/hv/lop/${classId}/bai-tap/${String(only.set._id)}`
        : HV_PATHS.s02(classId);
      const content = reminderMail({
        studentName: student.displayName,
        className: c.name,
        date,
        sets: pending.map((d) => ({ title: d.set.title, lesson: d.lesson.name })),
        url: `${this.options.appOrigin}${path}`,
      });
      const key = { classId: c._id, studentId: new Types.ObjectId(student.id), date };
      try {
        await this.mail.send({
          to: student.email,
          ...renderMail(content),
          tag: MAIL_TAGS.deadlineReminder,
          workspaceId,
          fromName: MAIL_FROM_NAME,
        });
        await scoped(this.reminders, workspaceId).updateOne(key, { $set: { result: 'sent' } });
        for (const d of pending)
          perSet.set(String(d.set._id), (perSet.get(String(d.set._id)) ?? 0) + 1);
        sent++;
      } catch (err) {
        // AC-26.1: no retry, the account status is untouched; the failure and its reason are logged.
        const reason = err instanceof EmailRejectedError ? 'rejected' : 'send_error';
        await scoped(this.reminders, workspaceId).updateOne(key, {
          $set: { result: 'failed', reason },
        });
        logClass({ action: 'reminder.send', result: 'failed', classId, reason });
        failed++;
      }
    }
    // AC-26.3: per set, when the sweep ran and how many HV it reached (for 009).
    const at = this.clock.now();
    for (const [setId, count] of perSet)
      await this.classes.updateOne(
        { _id: c._id, workspaceId: c.workspaceId },
        { $set: { 'deadlines.$[d].reminded': { date, at, count } } },
        { arrayFilters: [{ 'd.setId': new Types.ObjectId(setId), 'd.date': date }] },
      );
    return { sent, failed };
  }
}

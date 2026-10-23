import { Body, Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { objectId } from '@sat/shared';
import { type Connection, type Model, Types } from 'mongoose';
import { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { CLOCK, type Clock } from '../../common/ports/index.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { parse } from '../../common/validation/parse.js';
import { ClassAccess } from './class-access.js';
import { CLASS_MODEL, type ClassDoc } from './classes.model.js';
import { ClassFaults, DEV_CLASS_LINKS_COLLECTION, type DevClassLinkDoc } from './classes.ports.js';
import { questionCount } from './class-visibility.js';
import { ReminderService } from './reminder.service.js';

const submitBody = z.object({
  score: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
});
const examBody = z.object({
  classIds: z.array(objectId).min(1).max(50),
  name: z.string().max(200).default('Bài thi'),
  visible: z.boolean().default(true),
});
const examSubmissionBody = z.object({ classId: objectId, studentId: objectId.optional() });
const faultBody = z.object({
  op: z.enum(['create', 'visibility', 'deadlines']),
  fail: z.boolean().default(true),
  delayMs: z.number().int().min(0).max(30_000).default(0),
});

/**
 * QA stand-ins for modules that do not exist yet (dev/test only — registered by `ClassesModule.forRoot`):
 * 005 saves / submits through 003's gate (`ClassAccess.assertCanWork`, the call 005 will make), 006 exams assigned to
 * classes and their submissions, the 08:00 reminder sweep and its catch-up, fault injection. Everything stays in the
 * signed-in user's workspace.
 */
@Controller('dev/classes')
export class ClassesDevController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(CLASS_MODEL) private readonly classes: Model<ClassDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: ClassAccess,
    private readonly reminders: ReminderService,
    private readonly faults: ClassFaults,
  ) {}

  private get links() {
    return this.connection.collection<DevClassLinkDoc>(DEV_CLASS_LINKS_COLLECTION);
  }

  private attemptKey(p: AuthPrincipal, classId: string, setId: string) {
    return {
      workspaceId: new Types.ObjectId(p.workspaceId),
      kind: 'attempt' as const,
      classId: new Types.ObjectId(classId),
      studentId: new Types.ObjectId(p.userId),
      setId: new Types.ObjectId(setId),
    };
  }

  /** 005 stand-in: save answers of an attempt (S05). */
  @Roles('HV')
  @Post(':classId/sets/:setId/save')
  @HttpCode(200)
  async save(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
  ) {
    await this.access.assertCanWork(p, classId, setId);
    await this.links.updateOne(
      this.attemptKey(p, classId, setId),
      { $setOnInsert: { _id: new Types.ObjectId(), submittedAt: null } },
      { upsert: true },
    );
    return { saved: true };
  }

  /** 005 stand-in: submit the one attempt of a set (score defaults to all questions right). */
  @Roles('HV')
  @Post(':classId/sets/:setId/submit')
  @HttpCode(200)
  async submit(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
    @Body() body: unknown,
  ) {
    const input = parse(submitBody, body ?? {});
    await this.access.assertCanWork(p, classId, setId);
    const found = await this.access.item(p, classId, setId);
    const max = input.maxScore ?? (found ? questionCount(found.item) : 0);
    const submittedAt = this.clock.now();
    await this.links.updateOne(
      this.attemptKey(p, classId, setId),
      {
        $set: { submittedAt, score: input.score ?? max, maxScore: max },
        $setOnInsert: { _id: new Types.ObjectId() },
      },
      { upsert: true },
    );
    return { submittedAt: submittedAt.toISOString(), score: input.score ?? max, maxScore: max };
  }

  private async ownClasses(p: AuthPrincipal, ids: readonly string[]): Promise<void> {
    const n = await scoped(this.classes, p.workspaceId).count({
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
    });
    if (n !== new Set(ids).size) throw notFound();
  }

  /** 006 stand-in: an exam assigned to classes (`visible: false` = a draft the HV cannot see). */
  @Roles('GV')
  @Post('exams')
  @HttpCode(201)
  async addExam(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const input = parse(examBody, body);
    await this.ownClasses(p, input.classIds);
    const _id = new Types.ObjectId();
    await this.links.insertOne({
      _id,
      workspaceId: new Types.ObjectId(p.workspaceId),
      kind: 'exam',
      name: input.name,
      visible: input.visible,
      classIds: input.classIds.map((id) => new Types.ObjectId(id)),
      submissions: [],
    });
    return { id: String(_id) };
  }

  @Roles('GV')
  @Get('exams/:id')
  async exam(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    const row = Types.ObjectId.isValid(id)
      ? await this.links.findOne({
          _id: new Types.ObjectId(id),
          workspaceId: new Types.ObjectId(p.workspaceId),
          kind: 'exam',
        })
      : null;
    if (!row) throw notFound();
    return { id, classIds: (row.classIds ?? []).map(String), visible: !!row.visible };
  }

  /** 006 stand-in: a submission (or an automatic one) of the exam in a class. */
  @Roles('GV')
  @Post('exams/:id/submissions')
  @HttpCode(201)
  async examSubmission(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = parse(examSubmissionBody, body);
    await this.ownClasses(p, [input.classId]);
    const res = Types.ObjectId.isValid(id)
      ? await this.links.updateOne(
          {
            _id: new Types.ObjectId(id),
            workspaceId: new Types.ObjectId(p.workspaceId),
            kind: 'exam',
          },
          {
            $push: {
              submissions: {
                classId: new Types.ObjectId(input.classId),
                studentId: new Types.ObjectId(input.studentId ?? p.userId),
              },
            },
          },
        )
      : { matchedCount: 0 };
    if (!res.matchedCount) throw notFound();
    return { ok: true };
  }

  /**
   * The 08:00 sweep of today (by the server clock — move it with `/api/dev/clock`). `reset: true` first forgets that
   * today was swept (as if 08:00 had not come yet — e.g. the server started after 08:00 and caught up); e-mails
   * already sent today stay sent (one per HV per class per day).
   */
  @Roles('GV')
  @Post('reminders/run')
  @HttpCode(200)
  async run(@Body() body: unknown) {
    const { reset } = parse(z.object({ reset: z.boolean().default(false) }), body ?? {});
    if (reset) await this.reminders.forgetToday();
    return this.reminders.sweep();
  }

  /** The catch-up after an outage (AC-24.6): sweeps once if today's has not finished and it is before 20:00. */
  @Roles('GV')
  @Post('reminders/recover')
  @HttpCode(200)
  async recover() {
    return (await this.reminders.catchUp()) ?? { skipped: true };
  }

  /** Makes the next create / hide-show / deadline write fail or wait (AC-5.5, AC-16.5, AC-22.3). */
  @Roles('GV')
  @Post('faults')
  @HttpCode(200)
  fault(@Body() body: unknown) {
    const input = parse(faultBody, body);
    this.faults.set(input.op, { fail: input.fail, delayMs: input.delayMs });
    return { ok: true };
  }
}

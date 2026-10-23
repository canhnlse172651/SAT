import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { classStatusSchema, objectId, sectionSchema } from '@sat/shared';
import { type Connection, type Model, Types } from 'mongoose';
import { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { parse } from '../../common/validation/parse.js';
import { AiReplaceService } from './ai-replace.service.js';
import {
  CURRICULUM_MODEL,
  type CurriculumDoc,
  LESSON_MODEL,
  type LessonDoc,
} from './curriculum.model.js';
import { CurriculumFaults, DEV_LINKS_COLLECTION, type DevLinkDoc } from './curriculum.ports.js';
import { pathId } from './path-id.js';

const classBody = z.object({
  curriculumId: objectId,
  name: z.string().trim().min(1).max(100),
  status: classStatusSchema.default('active'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  studentEmails: z.array(z.string().trim().toLowerCase()).max(100).default([]),
});
const approvedItems = z
  .array(z.object({ title: z.string().max(200), content: z.unknown() }))
  .max(100);
const approveBody = z.object({ lessonId: objectId, section: sectionSchema, items: approvedItems });

/**
 * QA stand-ins for modules that do not exist yet (dev/test only — registered by `CurriculumModule.forRoot`):
 * 003 using classes, 005 learning data, 010 AI label and approval (REQ-19), plus fault injection for duplicates.
 * Everything stays inside the signed-in GV's workspace.
 */
@Roles('GV')
@Controller('dev/curriculum')
export class CurriculumDevController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(CURRICULUM_MODEL) private readonly curricula: Model<CurriculumDoc>,
    @InjectModel(LESSON_MODEL) private readonly lessons: Model<LessonDoc>,
    private readonly ai: AiReplaceService,
    private readonly faults: CurriculumFaults,
  ) {}

  private get links() {
    return this.connection.collection<DevLinkDoc>(DEV_LINKS_COLLECTION);
  }

  @Post('classes')
  @HttpCode(201)
  async addClass(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const input = parse(classBody, body);
    if (
      !(await scoped(this.curricula, p.workspaceId).exists({
        _id: new Types.ObjectId(input.curriculumId),
      }))
    ) {
      throw notFound();
    }
    const students = input.studentEmails.length
      ? await this.connection
          .collection<{ _id: Types.ObjectId }>('users')
          .find({
            workspaceId: new Types.ObjectId(p.workspaceId),
            role: 'HV',
            email: { $in: input.studentEmails },
          })
          .project<{ _id: Types.ObjectId }>({ _id: 1 })
          .toArray()
      : [];
    const _id = new Types.ObjectId();
    await this.links.insertOne({
      _id,
      workspaceId: new Types.ObjectId(p.workspaceId),
      kind: 'class',
      curriculumId: new Types.ObjectId(input.curriculumId),
      name: input.name,
      status: input.status,
      startDate: input.startDate,
      studentIds: students.map((s) => s._id),
    });
    return { id: String(_id), students: students.length };
  }

  @Delete('classes/:id')
  @HttpCode(204)
  async removeClass(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<void> {
    await this.links.deleteOne({
      _id: new Types.ObjectId(pathId(id)),
      workspaceId: new Types.ObjectId(p.workspaceId),
      kind: 'class',
    });
  }

  @Post('learning-data')
  @HttpCode(201)
  async learningData(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const { itemId } = parse(z.object({ itemId: objectId }), body);
    const itemOid = new Types.ObjectId(itemId);
    const lesson = await scoped(this.lessons, p.workspaceId)
      .findOne({ 'items._id': itemOid })
      .lean<LessonDoc>();
    if (!lesson?.items.some((i) => i._id.equals(itemOid) && i.section === 'exercise'))
      throw notFound();
    await this.links.updateOne(
      { workspaceId: new Types.ObjectId(p.workspaceId), kind: 'learning', itemId: itemOid },
      { $setOnInsert: { _id: new Types.ObjectId() } },
      { upsert: true },
    );
    return { itemId };
  }

  @Post('ai-label')
  @HttpCode(200)
  async aiLabel(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const input = parse(
      z.object({
        lessonId: objectId,
        state: z.enum(['generating', 'review']).nullable(),
        percent: z.number().int().min(0).max(100).optional(),
      }),
      body,
    );
    const lessonId = new Types.ObjectId(input.lessonId);
    if (!(await scoped(this.lessons, p.workspaceId).exists({ _id: lessonId }))) throw notFound();
    const key = { workspaceId: new Types.ObjectId(p.workspaceId), kind: 'ai' as const, lessonId };
    if (!input.state) {
      await this.links.deleteMany(key);
    } else {
      await this.links.updateOne(
        key,
        {
          $set: { state: input.state, percent: input.percent },
          $setOnInsert: { _id: new Types.ObjectId() },
        },
        { upsert: true },
      );
    }
    return { lessonId: input.lessonId, state: input.state };
  }

  @Post('ai-approve/preview')
  @HttpCode(200)
  preview(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const input = parse(approveBody, body);
    return this.ai.preview(p, input.lessonId, input.section, input.items);
  }

  @Post('ai-approve')
  @HttpCode(200)
  approve(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const input = parse(approveBody.extend({ token: z.string().max(100) }), body);
    return this.ai.replace(p, input.lessonId, input.section, input.items, input.token);
  }

  @Post('faults')
  @HttpCode(204)
  fault(@Body() body: unknown): void {
    const input = parse(
      z.object({
        op: z.enum(['duplicate-lesson', 'duplicate-curriculum']),
        fail: z.boolean().default(false),
        delayMs: z.number().int().min(0).max(30_000).default(0),
      }),
      body,
    );
    this.faults.set(input.op, { fail: input.fail, delayMs: input.delayMs });
  }
}

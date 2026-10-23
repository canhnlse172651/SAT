import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  type EmailBatch,
  type ImportReport,
  type ImportResult,
  type MailActionResponse,
  type MailPreview,
  type Student,
  type StudentListResponse,
  XLSX_CONTENT_TYPE,
  bulkActionSchema,
  bulkPreviewBodySchema,
  bulkSelectionSchema,
  objectId,
  studentBodySchema,
  studentListQuerySchema,
} from '@sat/shared';
import type { Request, Response } from 'express';
import type { Model } from 'mongoose';
import { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { parse } from '../../common/validation/parse.js';
import { USER_MODEL, type UserDoc } from './accounts.model.js';
import { ACCOUNTS_OPTIONS, type AccountsOptions } from './accounts.options.js';
import { mailPreviews } from './mail-previews.js';
import { StudentImportService } from './student-import.service.js';
import { StudentMailService } from './student-mail.service.js';
import { StudentsService } from './students.service.js';
import { importTemplate } from './xlsx.js';

/** A malformed path id is answered like a missing one (ADR-0006, AC-16.2). */
const pathId = (raw: string): string => {
  const parsed = objectId.safeParse(raw);
  if (!parsed.success) throw notFound();
  return parsed.data;
};

/** T11 / T12 — GV only; an HV gets the uniform 404 (AC-16.3, AC-16.5). */
@Roles('GV')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly students: StudentsService,
    private readonly imports: StudentImportService,
    private readonly mail: StudentMailService,
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @Inject(ACCOUNTS_OPTIONS) private readonly options: AccountsOptions,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get()
  list(@CurrentUser() p: AuthPrincipal, @Query() query: unknown): Promise<StudentListResponse> {
    return this.students.list(p, parse(studentListQuerySchema, query));
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<Student> {
    return this.students.create(p, parse(studentBodySchema, body));
  }

  /** AC-9.1 */
  @Get('import-template')
  template(@Res() res: Response): void {
    res
      .status(200)
      .setHeader('Content-Type', XLSX_CONTENT_TYPE)
      .setHeader('Content-Disposition', 'attachment; filename="mau-hoc-vien.xlsx"')
      .setHeader('Cache-Control', 'no-store')
      .end(Buffer.from(importTemplate()));
  }

  /** AC-9.2 … AC-9.5: the raw .xlsx is the body (parsed by the module's raw-body middleware). */
  @Post('imports')
  @HttpCode(201)
  check(@CurrentUser() p: AuthPrincipal, @Req() req: Request): Promise<ImportReport> {
    const body: unknown = req.body;
    return this.imports.check(p, Buffer.isBuffer(body) ? new Uint8Array(body) : new Uint8Array());
  }

  /** AC-10.1, AC-10.5 */
  @Post('imports/:id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<ImportResult> {
    return this.imports.confirm(p, pathId(id));
  }

  /** AC-17.6 */
  @Get('email-templates')
  async templates(@CurrentUser() p: AuthPrincipal): Promise<{ templates: MailPreview[] }> {
    const scope = scoped(this.users, p.workspaceId);
    const [teacher, sample] = await Promise.all([
      scope.findById(p.userId).select({ displayName: 1 }).lean(),
      scope
        .findOne({ role: 'HV' })
        .sort({ status: 1, createdAt: -1 })
        .select({ displayName: 1, email: 1 })
        .lean(),
    ]);
    return {
      templates: mailPreviews({
        teacherName: teacher?.displayName ?? '',
        sample: sample ?? { displayName: 'Nguyễn Văn An', email: 'hocvien@email.com' },
        appOrigin: this.options.appOrigin,
        today: this.clock.now(),
      }),
    };
  }

  @Get('email-batches/:id')
  batch(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<EmailBatch> {
    return this.mail.batch(p.workspaceId, pathId(id));
  }

  @Post('bulk/preview')
  @HttpCode(200)
  preview(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    const { action, selection } = parse(bulkPreviewBodySchema, body);
    return this.students.preview(p, action, selection);
  }

  @Post('bulk/:action')
  @HttpCode(200)
  bulk(
    @CurrentUser() p: AuthPrincipal,
    @Param('action') action: string,
    @Body() body: unknown,
  ): Promise<MailActionResponse> {
    const parsed = bulkActionSchema.safeParse(action);
    if (!parsed.success) throw notFound();
    const { selection } = parse(z.object({ selection: bulkSelectionSchema }), body);
    return this.students.bulk(p, parsed.data, selection);
  }

  @Get(':id')
  get(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<Student> {
    return this.students.get(p, pathId(id));
  }

  @Patch(':id')
  update(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Student> {
    const studentId = pathId(id);
    return this.students.update(p, studentId, parse(studentBodySchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<void> {
    return this.students.remove(p, pathId(id));
  }

  @Post(':id/activate')
  @HttpCode(200)
  activate(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.students.activate(p, pathId(id));
  }

  @Post(':id/resend')
  @HttpCode(200)
  resend(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.students.resend(p, pathId(id));
  }

  @Post(':id/reset-password')
  @HttpCode(200)
  resetPassword(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.students.resetPassword(p, pathId(id));
  }

  @Post(':id/lock')
  @HttpCode(200)
  lock(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<Student> {
    return this.students.lock(p, pathId(id));
  }

  @Post(':id/unlock')
  @HttpCode(200)
  unlock(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<Student> {
    return this.students.unlock(p, pathId(id));
  }
}

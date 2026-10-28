import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { examInputSchema, examSaveSchema, expectedVersionSchema } from '@sat/shared';
import { z } from 'zod';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { ExamResultsService } from './exam-results.service.js';
import { ExamsService } from './exams.service.js';

const classQuerySchema = z.object({ classId: z.string().max(40).optional() });

/** GV side of 006: T10, T22, T16, T14 and the results provided to 008 / 009 (REQ-1 … REQ-6, REQ-13, REQ-15). */
@Roles('GV')
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly exams: ExamsService,
    private readonly results: ExamResultsService,
  ) {}

  @Get()
  list(@CurrentUser() p: AuthPrincipal) {
    return this.exams.list(p);
  }

  @Get('classes')
  classOptions(@CurrentUser() p: AuthPrincipal) {
    return this.exams.classOptions(p);
  }

  /** AC-13.5: results per HV × assigned class (what 008 / 009 read). */
  @Get('results')
  async resultRows(@CurrentUser() p: AuthPrincipal, @Query() query: unknown) {
    const { classId } = parse(classQuerySchema, query);
    return {
      items: await this.results.rows(p.workspaceId, classId ? { classIds: [classId] } : {}),
    };
  }

  @Post()
  create(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    return this.exams.create(p, parse(examInputSchema, body));
  }

  @Get(':id')
  get(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.exams.get(p, id);
  }

  @Put(':id')
  save(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.exams.save(p, id, parse(examSaveSchema, body));
  }

  @Post(':id/schedule')
  @HttpCode(200)
  schedule(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.exams.schedule(p, id, parse(examSaveSchema, body));
  }

  @Post(':id/unschedule')
  @HttpCode(200)
  unschedule(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.exams.unschedule(p, id, parse(expectedVersionSchema, body).expectedVersion);
  }

  @Post(':id/archive')
  @HttpCode(200)
  archive(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.exams.archive(p, id);
  }

  @Post(':id/restore')
  @HttpCode(200)
  restore(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.exams.restore(p, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.exams.duplicate(p, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    await this.exams.remove(p, id);
  }

  @Get(':id/results')
  classResults(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Query() query: unknown) {
    return this.results.classResults(p, id, parse(classQuerySchema, query).classId);
  }

  @Get(':id/submissions/:studentId')
  submission(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Query() query: unknown,
  ) {
    const { classId } = parse(classQuerySchema, query);
    return this.results.submission(p, id, studentId, classId ?? '');
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  type CurriculumDetail,
  type CurriculumListResponse,
  type Lesson,
  curriculumBodySchema,
  curriculumListQuerySchema,
  curriculumPatchSchema,
  duplicateCurriculumBodySchema,
  lessonNameBodySchema,
  lessonOrderBodySchema,
} from '@sat/shared';
import type { Request } from 'express';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { CurriculumService } from './curriculum.service.js';
import { LessonsService } from './lessons.service.js';
import { pathId } from './path-id.js';

/** T05 / T06 — GV only; an HV or another workspace gets the uniform 404 (AC-17.1, AC-17.2). */
@Roles('GV')
@Controller('curricula')
export class CurriculumController {
  constructor(
    private readonly curricula: CurriculumService,
    private readonly lessons: LessonsService,
  ) {}

  @Get()
  list(@CurrentUser() p: AuthPrincipal, @Query() query: unknown): Promise<CurriculumListResponse> {
    return this.curricula.list(p, parse(curriculumListQuerySchema, query));
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() p: AuthPrincipal, @Body() body: unknown): Promise<CurriculumDetail> {
    return this.curricula.create(p, parse(curriculumBodySchema, body));
  }

  /** AC-1.6: the raw image is the body (parsed by the module's raw-body middleware). */
  @Post('covers')
  @HttpCode(201)
  cover(@CurrentUser() p: AuthPrincipal, @Req() req: Request) {
    const body: unknown = req.body;
    return this.curricula.uploadCover(
      p,
      Buffer.isBuffer(body) ? new Uint8Array(body) : new Uint8Array(),
    );
  }

  @Get(':id')
  detail(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<CurriculumDetail> {
    return this.curricula.detail(p, pathId(id));
  }

  @Patch(':id')
  update(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CurriculumDetail> {
    const curriculumId = pathId(id);
    return this.curricula.update(p, curriculumId, parse(curriculumPatchSchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<void> {
    return this.curricula.remove(p, pathId(id));
  }

  @Get(':id/classes')
  classes(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.curricula.classes(p, pathId(id));
  }

  @Post(':id/archive')
  @HttpCode(200)
  archive(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<CurriculumDetail> {
    return this.curricula.archive(p, pathId(id));
  }

  @Post(':id/restore')
  @HttpCode(200)
  restore(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<CurriculumDetail> {
    return this.curricula.restore(p, pathId(id));
  }

  @Get(':id/copy-name')
  copyName(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.curricula.copyNameFor(p, pathId(id));
  }

  @Post(':id/duplicate')
  @HttpCode(201)
  duplicate(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CurriculumDetail> {
    const curriculumId = pathId(id);
    return this.curricula.duplicate(p, curriculumId, parse(duplicateCurriculumBodySchema, body));
  }

  @Put(':id/lesson-order')
  reorder(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CurriculumDetail> {
    const curriculumId = pathId(id);
    return this.curricula.reorderLessons(p, curriculumId, parse(lessonOrderBodySchema, body));
  }

  @Post(':id/lessons')
  @HttpCode(201)
  addLesson(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Lesson> {
    const curriculumId = pathId(id);
    return this.lessons.add(p, curriculumId, parse(lessonNameBodySchema, body).name);
  }
}

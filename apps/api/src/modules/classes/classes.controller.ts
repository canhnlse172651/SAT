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
} from '@nestjs/common';
import {
  changeCurriculumBodySchema,
  classListQuerySchema,
  createClassBodySchema,
  deadlineBodySchema,
  nameAvailableQuerySchema,
  patchClassBodySchema,
  studentIdsBodySchema,
  studentOptionsQuerySchema,
  visibilityBodySchema,
} from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { pathId } from '../curriculum/path-id.js';
import { ClassesService } from './classes.service.js';
import { ContentService } from './content.service.js';
import { MembersService } from './members.service.js';

/** The teacher's classes (T02, T03, T04 — REQ-1 … REQ-11, REQ-15, REQ-16, REQ-21, REQ-22). */
@Roles('GV')
@Controller('classes')
export class ClassesController {
  constructor(
    private readonly classes: ClassesService,
    private readonly members: MembersService,
    private readonly content: ContentService,
  ) {}

  @Get()
  list(@CurrentUser() p: AuthPrincipal, @Query() query: unknown) {
    return this.classes.list(p, parse(classListQuerySchema, query));
  }

  @Get('name-available')
  async nameAvailable(@CurrentUser() p: AuthPrincipal, @Query() query: unknown) {
    const q = parse(nameAvailableQuerySchema, query);
    return { available: await this.classes.nameAvailable(p, q.name, q.excludeId) };
  }

  @Get('student-options')
  studentOptions(@CurrentUser() p: AuthPrincipal, @Query() query: unknown) {
    return this.classes.studentOptions(p, parse(studentOptionsQuerySchema, query));
  }

  @Get('curriculum-options')
  curriculumOptions(@CurrentUser() p: AuthPrincipal) {
    return this.classes.curriculumOptions(p);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() p: AuthPrincipal, @Body() body: unknown) {
    return this.classes.create(p, parse(createClassBodySchema, body));
  }

  @Get(':id')
  detail(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.classes.detail(p, pathId(id));
  }

  @Patch(':id')
  update(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.classes.update(p, pathId(id), parse(patchClassBodySchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    await this.classes.remove(p, pathId(id));
  }

  @Put(':id/curriculum')
  changeCurriculum(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.classes.changeCurriculum(
      p,
      pathId(id),
      parse(changeCurriculumBodySchema, body).curriculumId,
    );
  }

  @Post(':id/end')
  @HttpCode(200)
  end(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.classes.end(p, pathId(id));
  }

  @Post(':id/reopen')
  @HttpCode(200)
  reopen(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.classes.reopen(p, pathId(id));
  }

  @Get(':id/students')
  students(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.members.list(p, pathId(id));
  }

  @Post(':id/students')
  @HttpCode(200)
  addStudents(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.members.add(p, pathId(id), parse(studentIdsBodySchema, body).studentIds);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(204)
  async removeStudent(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    await this.members.remove(p, pathId(id), pathId(studentId));
  }

  @Get(':id/tracked-students')
  tracked(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.members.tracked(p, pathId(id));
  }

  @Get(':id/content')
  classContent(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.content.content(p, pathId(id));
  }

  @Post(':id/visibility/preview')
  @HttpCode(200)
  visibilityPreview(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.content.visibilityPreview(p, pathId(id), parse(visibilityBodySchema, body));
  }

  @Put(':id/visibility')
  setVisibility(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.content.setVisibility(p, pathId(id), parse(visibilityBodySchema, body));
  }

  @Put(':id/deadlines')
  setDeadlines(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.content.setDeadlines(p, pathId(id), parse(deadlineBodySchema, body));
  }

  @Get(':id/reminders')
  reminders(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.content.reminders(p, pathId(id));
  }
}

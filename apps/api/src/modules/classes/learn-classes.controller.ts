import { Controller, Get, Param, Query } from '@nestjs/common';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { LearnClassesService } from './learn-classes.service.js';

/** The student's classes (S01, S02, S11 and item access for S03–S06 — REQ-12 … REQ-14, REQ-17 … REQ-20, REQ-23). */
@Roles('HV')
@Controller('my-classes')
export class LearnClassesController {
  constructor(private readonly learn: LearnClassesService) {}

  @Get()
  list(@CurrentUser() p: AuthPrincipal) {
    return this.learn.myClasses(p);
  }

  @Get(':id')
  page(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.learn.myClass(p, id);
  }

  @Get(':id/members')
  members(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.learn.members(p, id);
  }

  @Get(':id/lessons/:lessonId')
  lesson(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.learn.lesson(p, id, lessonId);
  }

  /** `?continue=1`: the next step / save of an open screen (AC-18.1), not a direct link (AC-17.5). */
  @Get(':id/items/:itemId')
  item(
    @CurrentUser() p: AuthPrincipal,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Query('continue') continuing?: string,
  ) {
    return this.learn.item(p, id, itemId, continuing === '1');
  }
}

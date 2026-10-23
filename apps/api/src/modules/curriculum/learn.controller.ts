import { Controller, Get, Param } from '@nestjs/common';
import type { LearnCurriculum, LearnItem, LearnLesson } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { LearnService } from './learn.service.js';
import { pathId } from './path-id.js';

/** REQ-10: the HV view of curricula used by their classes (S02 / S11 of 003 build on it). */
@Roles('HV')
@Controller('learn')
export class LearnController {
  constructor(private readonly learn: LearnService) {}

  @Get('curricula')
  list(@CurrentUser() p: AuthPrincipal) {
    return this.learn.list(p);
  }

  @Get('curricula/:id')
  curriculum(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<LearnCurriculum> {
    return this.learn.getCurriculum(p, pathId(id));
  }

  @Get('lessons/:id')
  lesson(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<LearnLesson> {
    return this.learn.getLesson(p, pathId(id));
  }

  @Get('items/:id')
  item(@CurrentUser() p: AuthPrincipal, @Param('id') id: string): Promise<LearnItem> {
    return this.learn.getItem(p, pathId(id));
  }
}

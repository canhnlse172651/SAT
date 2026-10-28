import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { saveAttemptBodySchema, submitBodySchema } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { LearnExercisesService } from './learn-exercises.service.js';

/** S05 / S06 of the HV (REQ-14 … REQ-17): the start screen, the one attempt, autosave, submission, review. */
@Roles('HV')
@Controller('learn/classes/:classId/sets/:setId')
export class LearnExercisesController {
  constructor(private readonly learn: LearnExercisesService) {}

  @Get()
  view(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
  ) {
    return this.learn.view(p, classId, setId);
  }

  @Post('start')
  @HttpCode(200)
  start(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
  ) {
    return this.learn.start(p, classId, setId);
  }

  @Put('attempt')
  save(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
    @Body() body: unknown,
  ) {
    return this.learn.save(p, classId, setId, parse(saveAttemptBodySchema, body));
  }

  @Post('submit')
  @HttpCode(200)
  submit(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
    @Body() body: unknown,
  ) {
    return this.learn.submit(p, classId, setId, parse(submitBodySchema, body));
  }

  @Get('review')
  review(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('setId') setId: string,
  ) {
    return this.learn.review(p, classId, setId);
  }
}

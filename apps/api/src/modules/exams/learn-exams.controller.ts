import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { examHolderBodySchema, examSaveAnswersSchema, examSubmitSchema } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { LearnExamsService } from './learn-exams.service.js';

/** S07 / S08 of the HV (REQ-7 … REQ-12, REQ-14): list, lobby / result, the one attempt, autosave, submit, clock. */
@Roles('HV')
@Controller('learn/exams')
export class LearnExamsController {
  constructor(private readonly learn: LearnExamsService) {}

  @Get()
  list(@CurrentUser() p: AuthPrincipal) {
    return this.learn.list(p);
  }

  @Get(':id')
  view(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.learn.view(p, id);
  }

  @Post(':id/start')
  @HttpCode(200)
  start(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.learn.start(p, id, parse(examHolderBodySchema, body).holder);
  }

  @Post(':id/open')
  @HttpCode(200)
  open(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.learn.open(p, id, parse(examHolderBodySchema, body).holder);
  }

  @Put(':id/attempt')
  save(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.learn.save(p, id, parse(examSaveAnswersSchema, body));
  }

  @Post(':id/submit')
  @HttpCode(200)
  submit(@CurrentUser() p: AuthPrincipal, @Param('id') id: string, @Body() body: unknown) {
    return this.learn.submit(p, id, parse(examSubmitSchema, body));
  }

  @Get(':id/clock')
  clock(@CurrentUser() p: AuthPrincipal, @Param('id') id: string) {
    return this.learn.clockOf(p, id);
  }
}

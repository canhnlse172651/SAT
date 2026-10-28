import { Controller, Get, Query } from '@nestjs/common';
import { submissionQuerySchema } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { SubmissionsService } from './submissions.service.js';

/** GV side of 005 (REQ-20): T14 "Xem bài nộp". */
@Roles('GV')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get('submissions')
  submission(@CurrentUser() p: AuthPrincipal, @Query() query: unknown) {
    return this.submissions.submission(p, parse(submissionQuerySchema, query));
  }
}

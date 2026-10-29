import { Controller, Get, Param } from '@nestjs/common';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { ScoringService } from './scoring.service.js';

/** T04 tab "Xếp hạng" of the GV (REQ-10): the whole class and one student's breakdown. */
@Roles('GV')
@Controller('classes/:classId/ranking')
export class ScoringController {
  constructor(private readonly scoring: ScoringService) {}

  @Get()
  ranking(@CurrentUser() p: AuthPrincipal, @Param('classId') classId: string) {
    return this.scoring.classRanking(p, classId);
  }

  @Get(':studentId')
  breakdown(
    @CurrentUser() p: AuthPrincipal,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.scoring.studentBreakdown(p, classId, studentId);
  }
}

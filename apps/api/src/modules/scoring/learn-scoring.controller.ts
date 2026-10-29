import { Controller, Get, Param } from '@nestjs/common';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser, Roles } from '../../common/auth/decorators.js';
import { ScoringService } from './scoring.service.js';

/** S09 of the HV (REQ-7, REQ-8, REQ-9, REQ-11, REQ-13): the class picker and one class's board with "Điểm của tôi". */
@Roles('HV')
@Controller('learn/ranking')
export class LearnScoringController {
  constructor(private readonly scoring: ScoringService) {}

  @Get('classes')
  classes(@CurrentUser() p: AuthPrincipal) {
    return this.scoring.learnClasses(p);
  }

  @Get(':classId')
  ranking(@CurrentUser() p: AuthPrincipal, @Param('classId') classId: string) {
    return this.scoring.learnRanking(p, classId);
  }
}

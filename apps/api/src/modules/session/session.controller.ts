import { Controller, Get } from '@nestjs/common';
import { type SessionResponse, sessionResponseSchema } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CurrentUser } from '../../common/auth/decorators.js';
import { SessionInfoService } from './session-info.service.js';

/** Infrastructure endpoint (not a module-001 flow): who is signed in, for the SPA shell. */
@Controller('session')
export class SessionController {
  constructor(private readonly info: SessionInfoService) {}

  @Get()
  async current(@CurrentUser() principal: AuthPrincipal): Promise<SessionResponse> {
    return sessionResponseSchema.parse(await this.info.describe(principal));
  }
}

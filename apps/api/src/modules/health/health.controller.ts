import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/auth/decorators.js';
import { DB_READY, type DbReady } from '../../database.module.js';

/** Liveness (`/health`: the process is up) and readiness (`/ready`: dependencies are reachable). */
// Probes must work without a session (platform health checks, smoke test).
@Public()
@Controller()
export class HealthController {
  constructor(@Inject(DB_READY) private readonly isDbReady: DbReady) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('ready')
  ready(@Res({ passthrough: true }) res: Response) {
    const mongo = this.isDbReady();
    res.status(mongo ? 200 : 503);
    return { status: mongo ? 'ready' : 'not_ready', checks: { mongo: mongo ? 'up' : 'down' } };
  }
}

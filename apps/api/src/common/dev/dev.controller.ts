import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AUTH_OPTIONS, type AuthOptions } from '../auth/auth.types.js';
import { sessionCookie } from '../auth/cookie.js';
import { Public } from '../auth/decorators.js';
import { CLOCK, type Clock } from '../ports/clock.js';
import { DevOutboxReader } from '../ports/email.js';
import { parse } from '../validation/parse.js';
import { devClockBodySchema, devOutboxQuerySchema, devSessionBodySchema } from './dev.schemas.js';
import { DevService } from './dev.service.js';

interface AdjustableClock {
  advance(ms: number): void;
  reset?(): void;
}

/** Dev/test only (registered by `devModules`): never present in production (ADR-0008). */
@Public()
@Controller('dev')
export class DevController {
  constructor(
    private readonly dev: DevService,
    private readonly outbox: DevOutboxReader,
    @Inject(AUTH_OPTIONS) private readonly auth: AuthOptions,
    @Inject(CLOCK) private readonly clock: Clock & AdjustableClock,
  ) {}

  @Post('session')
  @HttpCode(201)
  async createSession(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parse(devSessionBodySchema, body);
    const session = await this.dev.createSession({
      ...input,
      userAgent: req.headers['user-agent'],
    });
    res.setHeader(
      'Set-Cookie',
      sessionCookie(session.token, session.maxAgeSeconds, this.auth.cookieSecure),
    );
    return session.body;
  }

  /** QA time travel: moves the server clock (OffsetClock in dev, FixedClock in API tests). */
  @Post('clock')
  @HttpCode(200)
  advanceClock(@Body() body: unknown) {
    const { advanceMs } = parse(devClockBodySchema, body);
    this.clock.advance(advanceMs);
    return { now: this.clock.now().toISOString() };
  }

  @Delete('clock')
  @HttpCode(204)
  resetClock(): void {
    this.clock.reset?.();
  }

  @Get('outbox')
  async emails(@Query() query: unknown) {
    const { to, tag } = parse(devOutboxQuerySchema, query);
    return { emails: to ? await this.outbox.findByRecipient(to, tag) : await this.outbox.latest() };
  }
}

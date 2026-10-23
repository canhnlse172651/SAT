import { Body, Controller, Get, HttpCode, Inject, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AUTH_OPTIONS, type AuthOptions } from '../auth/auth.types.js';
import { sessionCookie } from '../auth/cookie.js';
import { Public } from '../auth/decorators.js';
import { DevOutboxReader } from '../ports/email.js';
import { parse } from '../validation/parse.js';
import { devOutboxQuerySchema, devSessionBodySchema } from './dev.schemas.js';
import { DevService } from './dev.service.js';

/** Dev/test only (registered by `devModules`): never present in production (ADR-0008). */
@Public()
@Controller('dev')
export class DevController {
  constructor(
    private readonly dev: DevService,
    private readonly outbox: DevOutboxReader,
    @Inject(AUTH_OPTIONS) private readonly auth: AuthOptions,
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

  @Get('outbox')
  async emails(@Query() query: unknown) {
    const { to, tag } = parse(devOutboxQuerySchema, query);
    return { emails: to ? await this.outbox.findByRecipient(to, tag) : await this.outbox.latest() };
  }
}

import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import {
  ACCOUNT_ERROR_CODES as E,
  ACCOUNT_MESSAGES as M,
  loginBodySchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  registerBodySchema,
  resetTokenSchema,
  type SessionResponse,
} from '@sat/shared';
import type { Request, Response } from 'express';
import {
  AUTH_OPTIONS,
  type AuthOptions,
  type AuthPrincipal,
} from '../../common/auth/auth.types.js';
import { clearedSessionCookie, sessionCookie } from '../../common/auth/cookie.js';
import { CurrentUser, Public } from '../../common/auth/decorators.js';
import { parse } from '../../common/validation/parse.js';
import { AppError } from '../../errors.js';
import { AuthService, type ClientInfo, type SignedIn } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';

const client = (req: Request): ClientInfo => ({
  ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
  userAgent: req.headers['user-agent'],
});

/** A01, A02, A03 and sign-out (REQ-1, REQ-3 … REQ-6). */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly resets: PasswordResetService,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  async register(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const input = parse(registerBodySchema, body);
    return this.signIn(res, await this.auth.register(input, client(req)));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    const input = parse(loginBodySchema, body);
    return this.signIn(res, await this.auth.login(input, client(req)));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() principal: AuthPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(principal);
    res.setHeader('Set-Cookie', clearedSessionCookie(this.options.cookieSecure));
  }

  /** AC-6.1: always the same answer. */
  @Public()
  @Post('password-reset')
  @HttpCode(202)
  async requestReset(@Body() body: unknown): Promise<{ message: string }> {
    const { email } = parse(passwordResetRequestSchema, body);
    await this.resets.request(email);
    return { message: M.resetRequested };
  }

  @Public()
  @Get('password-reset/:token')
  async inspectReset(@Param('token') token: string): Promise<{ email: string }> {
    return this.resets.inspect(this.token(token));
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(204)
  async confirmReset(@Body() body: unknown): Promise<void> {
    const { token, password } = parse(passwordResetConfirmSchema, body);
    await this.resets.confirm(token, password);
  }

  private token(raw: string): string {
    const parsed = resetTokenSchema.safeParse(raw);
    if (!parsed.success) throw new AppError(400, E.INVALID_RESET_LINK, M.resetLinkInvalid);
    return parsed.data;
  }

  private signIn(res: Response, signedIn: SignedIn): SessionResponse {
    res.setHeader(
      'Set-Cookie',
      sessionCookie(signedIn.token, signedIn.maxAgeSeconds, this.options.cookieSecure),
    );
    return signedIn.body;
  }
}

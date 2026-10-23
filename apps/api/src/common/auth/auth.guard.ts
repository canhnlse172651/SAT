import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NOT_FOUND, type Role, UNAUTHENTICATED } from '@sat/shared';
import type { Response } from 'express';
import { AppError } from '../../errors.js';
import { getContext } from '../context/request-context.js';
import { AUTH_OPTIONS, type AuthedRequest, type AuthOptions } from './auth.types.js';
import { clearedSessionCookie, readSessionToken, sessionCookie } from './cookie.js';
import { IS_PUBLIC, ROLES_KEY } from './decorators.js';
import { SessionService } from './session.service.js';

/** Global guard: a valid session is required unless the route is `@Public()`. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, targets)) return true;

    const http = ctx.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    const res = http.getResponse<Response>();
    const token = readSessionToken(req.headers.cookie);

    try {
      if (!token)
        throw new AppError(401, UNAUTHENTICATED, 'Authentication required', {
          reason: 'missing',
        });
      const session = await this.sessions.validate(token);
      req.auth = {
        sessionId: session.sessionId,
        userId: session.userId,
        role: session.role,
        workspaceId: session.workspaceId,
      };
      if (session.refreshed) {
        res.setHeader(
          'Set-Cookie',
          sessionCookie(token, session.maxAgeSeconds, this.options.cookieSecure),
        );
      }
    } catch (err) {
      if (err instanceof AppError && err.status === 401) {
        res.setHeader('Set-Cookie', clearedSessionCookie(this.options.cookieSecure));
      }
      throw err;
    }

    const context = getContext();
    if (context) {
      context.userId = req.auth.userId;
      context.role = req.auth.role;
      context.workspaceId = req.auth.workspaceId;
    }

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (roles && !roles.includes(req.auth.role)) {
      throw new AppError(404, NOT_FOUND, 'Resource not found');
    }
    return true;
  }
}

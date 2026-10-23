import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Role } from '@sat/shared';
import type { AuthedRequest } from './auth.types.js';

export const IS_PUBLIC = 'sat:isPublic';
export const ROLES_KEY = 'sat:roles';

/** Opts a route (or controller) out of the global `AuthGuard`. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

/** Restricts a route to roles; any other role gets 404 NOT_FOUND (never confirms a resource exists). */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

/** The authenticated principal `{ sessionId, userId, role, workspaceId }` (set by `AuthGuard`). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const principal = ctx.switchToHttp().getRequest<AuthedRequest>().auth;
  if (!principal) throw new Error('@CurrentUser() used on a route without authentication');
  return principal;
}) as () => ParameterDecorator;

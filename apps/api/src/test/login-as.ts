import type { INestApplicationContext } from '@nestjs/common';
import type { Role } from '@sat/shared';
import { SESSION_COOKIE } from '../common/auth/cookie.js';
import { SessionService } from '../common/auth/session.service.js';
import { makeGv, makeHv } from './factories.js';

export interface LoggedIn {
  /** Value for a `Cookie` request header. */
  cookie: string;
  token: string;
  userId: string;
  workspaceId: string;
}

/**
 * Creates a session directly through `SessionService` (no login flow). Without `userId` a fresh active
 * user of `role` is created (in `workspaceId` when given), because every request re-checks that the
 * account still exists and is not locked (module 001's session principal resolver).
 */
export async function loginAs(
  app: INestApplicationContext,
  role: Role,
  options: { workspaceId?: string; userId?: string } = {},
): Promise<LoggedIn> {
  let { userId, workspaceId } = options;
  if (!userId) {
    const make = role === 'GV' ? makeGv : makeHv;
    const user = await make(app, workspaceId ? { workspaceId } : {});
    userId = user.id;
    workspaceId = user.workspaceId;
  }
  if (!workspaceId) throw new Error('loginAs: pass workspaceId together with userId');
  const { token } = await app.get(SessionService).create({ userId, workspaceId, role });
  return { cookie: `${SESSION_COOKIE}=${token}`, token, userId, workspaceId };
}

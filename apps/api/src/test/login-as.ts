import type { INestApplicationContext } from '@nestjs/common';
import type { Role } from '@sat/shared';
import { Types } from 'mongoose';
import { SESSION_COOKIE } from '../common/auth/cookie.js';
import { SessionService } from '../common/auth/session.service.js';

export interface LoggedIn {
  /** Value for a `Cookie` request header. */
  cookie: string;
  token: string;
  userId: string;
  workspaceId: string;
}

/**
 * Creates a session directly through `SessionService` (no login flow). Pass `userId`/`workspaceId`
 * from the factories when the endpoint reads the user; otherwise random ids are used.
 */
export async function loginAs(
  app: INestApplicationContext,
  role: Role,
  options: { workspaceId?: string; userId?: string } = {},
): Promise<LoggedIn> {
  const userId = options.userId ?? new Types.ObjectId().toString();
  const workspaceId = options.workspaceId ?? new Types.ObjectId().toString();
  const { token } = await app.get(SessionService).create({ userId, workspaceId, role });
  return { cookie: `${SESSION_COOKIE}=${token}`, token, userId, workspaceId };
}

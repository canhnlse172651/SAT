import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ACCOUNT_ERROR_CODES as E,
  ACCOUNT_MESSAGES as M,
  type AccountResponse,
  UNAUTHENTICATED,
} from '@sat/shared';
import type { Model } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { hashPassword, verifyPassword } from '../../common/auth/password.js';
import { SessionService } from '../../common/auth/session.service.js';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import {
  USER_MODEL,
  type UserDoc,
  WORKSPACE_MODEL,
  type WorkspaceDoc,
  searchKeyFor,
  workspaceNameFor,
} from './accounts.model.js';
import { AuditService } from './audit.service.js';
import { emailTakenError, loginEmailKey } from './auth.service.js';
import { THROTTLES, ThrottleService } from './throttle.service.js';

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;
const currentPasswordKey = (sessionId: string) => `current-password:${sessionId}`;

/** T17 (REQ-14) and the password change of T17 / S10 (REQ-15). Only the caller's own account. */
@Injectable()
export class AccountService {
  constructor(
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @InjectModel(WORKSPACE_MODEL) private readonly workspaces: Model<WorkspaceDoc>,
    private readonly sessions: SessionService,
    private readonly throttle: ThrottleService,
    private readonly audit: AuditService,
  ) {}

  async get(p: AuthPrincipal): Promise<AccountResponse> {
    const user = await this.me(p);
    return {
      id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      passwordSource: user.role === 'HV' ? (user.passwordSource ?? 'system') : null,
    };
  }

  /** AC-14.1 (the workspace keeps the teacher's name). */
  async updateProfile(p: AuthPrincipal, displayName: string): Promise<AccountResponse> {
    const user = await this.me(p);
    await this.users.updateOne(
      { _id: user._id },
      { displayName, searchKey: searchKeyFor(displayName, user.email), $inc: { version: 1 } },
    );
    await this.workspaces.updateOne(
      { _id: user.workspaceId, ownerId: user._id },
      { name: workspaceNameFor(displayName) },
    );
    await this.audit.record({
      action: 'gv.profile.update',
      actorId: p.userId,
      workspaceId: p.workspaceId,
    });
    return this.get(p);
  }

  /** AC-14.2, AC-14.3 */
  async changeEmail(
    p: AuthPrincipal,
    email: string,
    currentPassword: string,
  ): Promise<AccountResponse> {
    const user = await this.me(p);
    await this.checkCurrentPassword(p, user, currentPassword);
    if (email !== user.emailKey) {
      if (await this.users.exists({ emailKey: email, _id: { $ne: user._id } }))
        throw emailTakenError();
      try {
        await this.users.updateOne(
          { _id: user._id },
          {
            email,
            emailKey: email,
            searchKey: searchKeyFor(user.displayName, email),
            $inc: { version: 1 },
          },
        );
      } catch (err) {
        if (isDuplicateKey(err)) throw emailTakenError();
        throw err;
      }
    }
    await this.audit.record({
      action: 'gv.email.change',
      actorId: p.userId,
      workspaceId: p.workspaceId,
    });
    return this.get(p);
  }

  /** AC-15.1, AC-15.2, AC-15.4, AC-15.5: keeps this session, ends the others. */
  async changePassword(
    p: AuthPrincipal,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.me(p);
    await this.checkCurrentPassword(p, user, currentPassword);
    if (newPassword === currentPassword) {
      throw new AppError(400, E.SAME_PASSWORD, M.samePassword, { field: 'newPassword' });
    }
    await this.users.updateOne(
      { _id: user._id },
      {
        passwordHash: await hashPassword(newPassword),
        ...(user.role === 'HV' ? { passwordSource: 'user' } : {}),
        $inc: { version: 1 },
      },
    );
    await this.sessions.revokeAllExcept(p.userId, p.sessionId, 'password_changed');
    await this.throttle.reset(loginEmailKey(user.emailKey));
    await this.audit.record({
      action: 'account.password.change',
      actorId: p.userId,
      workspaceId: p.workspaceId,
    });
  }

  /** AC-15.2, AC-15.3: five wrong current passwords in a row in one session end that session. */
  private async checkCurrentPassword(
    p: AuthPrincipal,
    user: UserDoc,
    password: string,
  ): Promise<void> {
    const key = currentPasswordKey(p.sessionId);
    if (user.passwordHash && (await verifyPassword(password, user.passwordHash))) {
      await this.throttle.reset(key);
      return;
    }
    const { count } = await this.throttle.hit(key, THROTTLES.currentPassword);
    if (count >= THROTTLES.currentPassword.limit) {
      await this.throttle.reset(key);
      await this.sessions.revoke(p.sessionId, 'too_many_attempts');
      await this.audit.record({
        action: 'account.current_password',
        result: 'denied',
        actorId: p.userId,
        workspaceId: p.workspaceId,
        details: { reason: 'too_many_attempts' },
      });
      throw new AppError(401, UNAUTHENTICATED, M.tooManyPasswordAttempts, {
        reason: 'too_many_attempts',
      });
    }
    throw new AppError(400, E.WRONG_PASSWORD, M.wrongCurrentPassword, { field: 'currentPassword' });
  }

  private async me(p: AuthPrincipal): Promise<UserDoc> {
    const user = await scoped(this.users, p.workspaceId).findById(p.userId).lean();
    if (!user) throw notFound();
    return user;
  }
}

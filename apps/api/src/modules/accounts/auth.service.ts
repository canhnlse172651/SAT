import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ACCOUNT_ERROR_CODES as E,
  ACCOUNT_MESSAGES as M,
  RATE_LIMITED,
  type SessionResponse,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { hashPassword, needsRehash, verifyPassword } from '../../common/auth/password.js';
import { SessionService } from '../../common/auth/session.service.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { AppError } from '../../errors.js';
import {
  USER_MODEL,
  type UserDoc,
  WORKSPACE_MODEL,
  type WorkspaceDoc,
  searchKeyFor,
  workspaceNameFor,
} from './accounts.model.js';
import { AuditService, emailTag } from './audit.service.js';
import { THROTTLES, ThrottleService } from './throttle.service.js';

export interface SignedIn {
  token: string;
  maxAgeSeconds: number;
  body: SessionResponse;
}

export interface ClientInfo {
  ip: string;
  userAgent?: string | undefined;
}

/** Throttle keys; e-mails only as a one-way tag. */
export const loginEmailKey = (emailKey: string) => `login:${emailTag(emailKey)}`;
const loginIpKey = (ip: string) => `login-ip:${ip}`;
const registerIpKey = (ip: string) => `register-ip:${ip}`;

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

export const emailTakenError = () =>
  new AppError(409, E.EMAIL_TAKEN, M.emailTaken, { field: 'email' });

/** REQ-1, REQ-3, REQ-4, REQ-5 (sign-up, sign-in, temporary lock, sign-out) and NFR-5 address limits. */
@Injectable()
export class AuthService {
  private dummyHash: Promise<string> | undefined;

  constructor(
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @InjectModel(WORKSPACE_MODEL) private readonly workspaces: Model<WorkspaceDoc>,
    private readonly sessions: SessionService,
    private readonly throttle: ThrottleService,
    private readonly audit: AuditService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** AC-1.1, AC-1.2, AC-1.4: a GV and a workspace only they own; never an HV. */
  async register(
    input: { displayName: string; email: string; password: string },
    client: ClientInfo,
  ): Promise<SignedIn> {
    await this.rejectIfBlocked(registerIpKey(client.ip));
    const ipHit = await this.throttle.hit(registerIpKey(client.ip), THROTTLES.registerIp);
    if (ipHit.count > THROTTLES.registerIp.limit) throw this.tooMany();

    if (await this.users.exists({ emailKey: input.email })) throw emailTakenError();

    const userId = new Types.ObjectId();
    const workspace = await this.workspaces.create({
      name: workspaceNameFor(input.displayName),
      ownerId: userId,
    });
    try {
      await this.users.create({
        _id: userId,
        workspaceId: workspace._id,
        role: 'GV',
        displayName: input.displayName,
        email: input.email,
        emailKey: input.email,
        searchKey: searchKeyFor(input.displayName, input.email),
        status: 'active',
        passwordHash: await hashPassword(input.password),
        lastLoginAt: this.clock.now(),
      });
    } catch (err) {
      await this.workspaces.deleteOne({ _id: workspace._id });
      if (isDuplicateKey(err)) throw emailTakenError();
      throw err;
    }
    await this.audit.record({
      action: 'gv.register',
      actorId: userId.toString(),
      workspaceId: workspace._id.toString(),
    });
    return this.openSession(
      {
        _id: userId,
        workspaceId: workspace._id,
        role: 'GV',
        displayName: input.displayName,
        email: input.email,
      },
      workspace.name,
      client,
    );
  }

  /** AC-3.1 … AC-3.4, REQ-4, NFR-5. */
  async login(input: { email: string; password: string }, client: ClientInfo): Promise<SignedIn> {
    await this.rejectIfBlocked(loginIpKey(client.ip));
    const emailKey = loginEmailKey(input.email);
    if (await this.throttle.blockedUntil(emailKey)) {
      await this.audit.record({
        action: 'auth.login',
        result: 'denied',
        details: { reason: 'locked_out', email: emailTag(input.email) },
      });
      throw new AppError(429, E.LOGIN_LOCKED, M.loginLocked);
    }

    const user = await this.users.findOne({ emailKey: input.email }).lean();
    // Same cost whether or not the account exists (no timing oracle).
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const passwordOk = await verifyPassword(input.password, hash);
    const canSignIn = !!user?.passwordHash && user.status !== 'pending';

    if (!passwordOk || !canSignIn || !user) {
      const [byEmail] = await Promise.all([
        this.throttle.hit(emailKey, THROTTLES.loginEmail),
        this.throttle.hit(loginIpKey(client.ip), THROTTLES.loginIp),
      ]);
      await this.audit.record({
        action: 'auth.login',
        result: 'denied',
        actorId: user?._id.toString(),
        workspaceId: user?.workspaceId.toString(),
        details: {
          reason: 'invalid_credentials',
          lockedOut: byEmail.blocked,
          email: emailTag(input.email),
        },
      });
      if (byEmail.blocked) throw new AppError(429, E.LOGIN_LOCKED, M.loginLocked);
      throw new AppError(401, E.INVALID_CREDENTIALS, M.invalidCredentials);
    }
    if (user.status === 'locked') {
      await this.audit.record({
        action: 'auth.login',
        result: 'denied',
        actorId: user._id.toString(),
        workspaceId: user.workspaceId.toString(),
        details: { reason: 'account_locked' },
      });
      throw new AppError(403, E.ACCOUNT_LOCKED, M.accountLocked);
    }

    await this.throttle.reset(emailKey);
    await this.users.updateOne(
      { _id: user._id },
      {
        lastLoginAt: this.clock.now(),
        ...(needsRehash(hash) ? { passwordHash: await hashPassword(input.password) } : {}),
      },
    );
    const workspace = await this.workspaces.findById(user.workspaceId).select({ name: 1 }).lean();
    await this.audit.record({
      action: 'auth.login',
      actorId: user._id.toString(),
      workspaceId: user.workspaceId.toString(),
    });
    return this.openSession(user, workspace?.name ?? '', client);
  }

  /** AC-5.1: ends this device's session only (AC-5.6). */
  async logout(principal: {
    sessionId: string;
    userId: string;
    workspaceId: string;
  }): Promise<void> {
    await this.sessions.revoke(principal.sessionId, 'logout');
    await this.audit.record({
      action: 'auth.logout',
      actorId: principal.userId,
      workspaceId: principal.workspaceId,
    });
  }

  private async openSession(
    user: Pick<UserDoc, '_id' | 'workspaceId' | 'role' | 'displayName' | 'email'>,
    workspaceName: string,
    client: ClientInfo,
  ): Promise<SignedIn> {
    const { token, session } = await this.sessions.create({
      userId: user._id.toString(),
      workspaceId: user.workspaceId.toString(),
      role: user.role,
      userAgent: client.userAgent,
    });
    return {
      token,
      maxAgeSeconds: session.maxAgeSeconds,
      body: {
        user: {
          id: session.userId,
          role: user.role,
          displayName: user.displayName,
          email: user.email,
        },
        workspace: { id: session.workspaceId, name: workspaceName },
      },
    };
  }

  private async rejectIfBlocked(key: string): Promise<void> {
    if (await this.throttle.blockedUntil(key)) throw this.tooMany();
  }

  private tooMany(): AppError {
    return new AppError(429, RATE_LIMITED, M.tooManyRequests);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword('sat-dummy-password-1');
    return this.dummyHash;
  }
}

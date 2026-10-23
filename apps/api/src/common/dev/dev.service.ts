import { Inject, Injectable } from '@nestjs/common';
import { NOT_FOUND, type Role, type SessionResponse } from '@sat/shared';
import { AppError } from '../../errors.js';
import { SessionService } from '../auth/session.service.js';
import { WORKSPACE_DIRECTORY, type WorkspaceDirectory } from '../directory/workspace-directory.js';

export interface DevSessionRequest {
  role: Role;
  userId?: string | undefined;
  workspaceId?: string | undefined;
  userAgent?: string | undefined;
}

export interface DevSession {
  token: string;
  maxAgeSeconds: number;
  body: SessionResponse;
}

@Injectable()
export class DevService {
  constructor(
    private readonly sessions: SessionService,
    @Inject(WORKSPACE_DIRECTORY) private readonly directory: WorkspaceDirectory,
  ) {}

  /** Signs in as a seeded user: the one given, else the first of `role` (in `workspaceId` when given). */
  async createSession(input: DevSessionRequest): Promise<DevSession> {
    const user = await this.directory.findSignInCandidate(input);
    if (!user) {
      throw new AppError(404, NOT_FOUND, 'No matching seeded user; run `npm run seed -w @sat/api`');
    }
    const { token, session } = await this.sessions.create({
      userId: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      userAgent: input.userAgent,
    });
    const workspace = await this.directory.findWorkspace(user.workspaceId);
    return {
      token,
      maxAgeSeconds: session.maxAgeSeconds,
      body: {
        user: {
          id: user.id,
          role: user.role,
          displayName: user.displayName,
          ...(user.email ? { email: user.email } : {}),
        },
        workspace: { id: user.workspaceId, name: workspace?.name ?? '' },
      },
    };
  }
}

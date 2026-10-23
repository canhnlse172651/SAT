import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NOT_FOUND, type Role, type SessionResponse } from '@sat/shared';
import type { Model } from 'mongoose';
import { AppError } from '../../errors.js';
import { SessionService } from '../auth/session.service.js';
import {
  DEV_USER_MODEL,
  type DevUserDoc,
  WORKSPACE_DIRECTORY,
  type WorkspaceDirectory,
} from '../directory/workspace-directory.js';

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
    @InjectModel(DEV_USER_MODEL) private readonly users: Model<DevUserDoc>,
    private readonly sessions: SessionService,
    @Inject(WORKSPACE_DIRECTORY) private readonly directory: WorkspaceDirectory,
  ) {}

  /** Signs in as a seeded user: the one given, else the first of `role` (in `workspaceId` when given). */
  async createSession(input: DevSessionRequest): Promise<DevSession> {
    const user = await this.users
      .findOne({
        role: input.role,
        ...(input.userId ? { _id: input.userId } : {}),
        ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
      })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
    if (!user) {
      throw new AppError(404, NOT_FOUND, 'No matching seeded user; run `npm run seed -w @sat/api`');
    }
    const userId = user._id.toString();
    const workspaceId = user.workspaceId.toString();
    const { token, session } = await this.sessions.create({
      userId,
      workspaceId,
      role: input.role,
      userAgent: input.userAgent,
    });
    const workspace = await this.directory.findWorkspace(workspaceId);
    return {
      token,
      maxAgeSeconds: session.maxAgeSeconds,
      body: {
        user: { id: userId, role: input.role, displayName: user.displayName },
        workspace: { id: workspaceId, name: workspace?.name ?? '' },
      },
    };
  }
}

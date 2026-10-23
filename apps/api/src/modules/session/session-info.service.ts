import { Inject, Injectable } from '@nestjs/common';
import { UNAUTHENTICATED, type SessionResponse } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import {
  WORKSPACE_DIRECTORY,
  type WorkspaceDirectory,
} from '../../common/directory/workspace-directory.js';
import { AppError } from '../../errors.js';

@Injectable()
export class SessionInfoService {
  constructor(@Inject(WORKSPACE_DIRECTORY) private readonly directory: WorkspaceDirectory) {}

  /** The signed-in user and workspace. A session whose user or workspace no longer exists is a missing session. */
  async describe(principal: AuthPrincipal): Promise<SessionResponse> {
    const [user, workspace] = await Promise.all([
      this.directory.findUser(principal.userId, principal.workspaceId),
      this.directory.findWorkspace(principal.workspaceId),
    ]);
    if (!user || !workspace) {
      throw new AppError(401, UNAUTHENTICATED, 'Authentication required', { reason: 'missing' });
    }
    return {
      user: { id: user.id, role: principal.role, displayName: user.displayName },
      workspace: { id: workspace.id, name: workspace.name },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import type {
  AuthPrincipal,
  PrincipalCheck,
  SessionPrincipalResolver,
} from '../../common/auth/auth.types.js';
import type {
  DirectoryUser,
  DirectoryWorkspace,
  SignInCandidateQuery,
  WorkspaceDirectory,
} from '../../common/directory/workspace-directory.js';
import { USER_MODEL, type UserDoc, WORKSPACE_MODEL, type WorkspaceDoc } from './accounts.model.js';

const isId = (id: string | undefined): id is string =>
  !!id && Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);

const toDirectoryUser = (
  u: Pick<UserDoc, '_id' | 'workspaceId' | 'role' | 'displayName'> & { email?: string },
): DirectoryUser => ({
  id: u._id.toString(),
  workspaceId: u.workspaceId.toString(),
  role: u.role,
  displayName: u.displayName,
  ...(u.email ? { email: u.email } : {}),
});

/**
 * Users and workspaces for infrastructure (`WORKSPACE_DIRECTORY`) and the per-request session check
 * (`SESSION_PRINCIPAL_RESOLVER`): a deleted account ends its sessions as missing, a locked HV as locked
 * (AC-12.2, AC-12.3, AC-13.2). Lookups are by id within the principal's workspace.
 */
@Injectable()
export class AccountsDirectory implements WorkspaceDirectory, SessionPrincipalResolver {
  constructor(
    @InjectModel(USER_MODEL) private readonly users: Model<UserDoc>,
    @InjectModel(WORKSPACE_MODEL) private readonly workspaces: Model<WorkspaceDoc>,
  ) {}

  async findUser(userId: string, workspaceId: string): Promise<DirectoryUser | null> {
    if (!isId(userId) || !isId(workspaceId)) return null;
    const doc = await this.users
      .findOne({ _id: userId, workspaceId })
      .select({ workspaceId: 1, role: 1, displayName: 1, email: 1 })
      .lean();
    return doc ? toDirectoryUser(doc) : null;
  }

  async findWorkspace(workspaceId: string): Promise<DirectoryWorkspace | null> {
    if (!isId(workspaceId)) return null;
    const doc = await this.workspaces.findById(workspaceId).select({ name: 1 }).lean();
    return doc ? { id: doc._id.toString(), name: doc.name } : null;
  }

  async findSignInCandidate(query: SignInCandidateQuery): Promise<DirectoryUser | null> {
    if ((query.userId && !isId(query.userId)) || (query.workspaceId && !isId(query.workspaceId)))
      return null;
    const doc = await this.users
      .findOne({
        role: query.role,
        status: { $in: ['active', 'sending', 'failed'] },
        ...(query.userId ? { _id: query.userId } : {}),
        ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
      })
      .sort({ createdAt: 1, _id: 1 })
      .select({ workspaceId: 1, role: 1, displayName: 1, email: 1 })
      .lean();
    return doc ? toDirectoryUser(doc) : null;
  }

  async check(principal: AuthPrincipal): Promise<PrincipalCheck> {
    if (!isId(principal.userId) || !isId(principal.workspaceId))
      return { active: false, reason: 'missing' };
    const doc = await this.users
      .findOne({ _id: principal.userId, workspaceId: principal.workspaceId })
      .select({ status: 1, role: 1 })
      .lean();
    if (!doc || doc.role !== principal.role || doc.status === 'pending')
      return { active: false, reason: 'missing' };
    if (doc.status === 'locked') return { active: false, reason: 'locked' };
    return { active: true };
  }
}

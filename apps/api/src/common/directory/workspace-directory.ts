import type { Role } from '@sat/shared';

/*
 * Port to the owner of users and workspaces (module 001 binds `WORKSPACE_DIRECTORY` to its accounts
 * service). Lets infrastructure such as `GET /api/session` and the dev sign-in read users without
 * importing a feature module.
 */

export interface DirectoryUser {
  id: string;
  workspaceId: string;
  role: Role;
  displayName: string;
}

export interface DirectoryWorkspace {
  id: string;
  name: string;
}

export interface SignInCandidateQuery {
  role: Role;
  userId?: string | undefined;
  workspaceId?: string | undefined;
}

export interface WorkspaceDirectory {
  findUser(userId: string, workspaceId: string): Promise<DirectoryUser | null>;
  findWorkspace(workspaceId: string): Promise<DirectoryWorkspace | null>;
  /** Dev sign-in only: the given user, else the oldest user of `role` that may sign in (in `workspaceId` when given). */
  findSignInCandidate(query: SignInCandidateQuery): Promise<DirectoryUser | null>;
}

export const WORKSPACE_DIRECTORY = Symbol('WORKSPACE_DIRECTORY');

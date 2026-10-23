/** Supplies the workspace of the current request. F06 binds this to F03's request context. */
export interface WorkspaceProvider {
  workspaceId(): string;
}

export const WORKSPACE_PROVIDER = Symbol('WORKSPACE_PROVIDER');

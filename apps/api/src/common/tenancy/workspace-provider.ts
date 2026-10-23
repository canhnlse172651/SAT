/** Supplies the workspace of the current request. `TenancyModule` binds this to the request context. */
export interface WorkspaceProvider {
  workspaceId(): string;
}

export const WORKSPACE_PROVIDER = Symbol('WORKSPACE_PROVIDER');

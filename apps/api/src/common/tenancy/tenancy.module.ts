import { Global, Module } from '@nestjs/common';
import { AppError } from '../../errors.js';
import { getContext } from '../context/request-context.js';
import { WORKSPACE_PROVIDER, type WorkspaceProvider } from './workspace-provider.js';

/** Workspace of the current request, from the context `AuthGuard` fills. 500 when a scoped call runs without one. */
export const requestWorkspaceProvider: WorkspaceProvider = {
  workspaceId() {
    const id = getContext()?.workspaceId;
    if (!id) throw new AppError(500, 'INTERNAL', 'Workspace context missing');
    return id;
  },
};

@Global()
@Module({
  providers: [{ provide: WORKSPACE_PROVIDER, useValue: requestWorkspaceProvider }],
  exports: [WORKSPACE_PROVIDER],
})
export class TenancyModule {}

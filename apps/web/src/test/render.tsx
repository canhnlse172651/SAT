import type { Role } from '@sat/shared';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { RootLayout } from '../app/RootLayout';
import { useSessionStore } from '../features/session/session-store';
import { useToastStore } from '../features/toast/toast-store';

export interface TestSession {
  role: Role;
  displayName?: string;
  workspaceName?: string;
}

export interface RenderOptions {
  /** Initial URL (path + search). */
  route?: string;
  /** Signed-in user; omit for a fresh (idle) session store. */
  session?: TestSession;
}

function resetStores(session?: TestSession) {
  useToastStore.setState({ toasts: [] });
  useSessionStore.setState(
    session
      ? {
          status: 'ok',
          user: { id: 'u1', role: session.role, displayName: session.displayName ?? 'Cô Lan' },
          workspace: { id: 'w1', name: session.workspaceName ?? 'Lớp cô Lan' },
        }
      : { status: 'idle', user: null, workspace: null },
  );
}

/** Renders a route table (e.g. createAppRoutes()) in a memory router with fresh stores. */
export function renderRoutes(routes: RouteObject[], options: RenderOptions = {}) {
  resetStores(options.session);
  const router = createMemoryRouter(routes, { initialEntries: [options.route ?? '/'] });
  const result = render(<RouterProvider router={router} />);
  return { ...result, router };
}

/** Renders one component inside the app's root layout, matching every URL. */
export function renderWithProviders(ui: ReactNode, options: RenderOptions = {}) {
  return renderRoutes(
    [{ element: <RootLayout />, children: [{ path: '*', element: ui }] }],
    options,
  );
}

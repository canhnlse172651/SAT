import type { Role } from '@sat/shared';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { loginPathWithReturn } from '../../lib/home-path';
import { type LoginNoticeState, sessionNotice } from './session-notice';
import { useSessionStore } from './session-store';

interface Props {
  /** The only role allowed in this area. */
  role: Role;
  /** Where the other role goes (001 AC-16.3/16.4/20.4/20.10). */
  otherwise: string;
}

/** Layout-route guard: not signed in -> A01 with returnTo; wrong role -> redirect per 001. */
export function RequireRole({ role, otherwise }: Props) {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  const load = useSessionStore((s) => s.load);
  const reason = useSessionStore((s) => s.reason);
  const location = useLocation();

  useEffect(() => {
    if (status === 'idle') void load();
  }, [status, load]);

  if (status === 'idle' || status === 'loading') {
    return <p role="status">Đang tải…</p>;
  }
  if (!user) {
    const state: LoginNoticeState = { notice: sessionNotice(reason) };
    return (
      <Navigate
        replace
        to={loginPathWithReturn(location.pathname + location.search)}
        state={state}
      />
    );
  }
  if (user.role !== role) {
    return <Navigate replace to={otherwise} />;
  }
  return <Outlet />;
}

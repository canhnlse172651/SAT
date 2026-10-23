import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { homePath } from '../../lib/home-path';
import { useSessionStore } from '../session/session-store';

/**
 * AC-3.5: a signed-in user opening A01, A02 or the request form of A03 goes to the role home. A reset
 * link (A03 with `?token=`) stays usable while signed in (spec §8).
 */
export function RedirectIfSignedIn() {
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.user?.role);
  const load = useSessionStore((s) => s.load);
  const location = useLocation();
  const resetLink = new URLSearchParams(location.search).has('token');

  useEffect(() => {
    if (status === 'idle' && !resetLink) void load();
  }, [status, load, resetLink]);

  if (resetLink) return <Outlet />;
  if (status === 'idle' || status === 'loading') return <p role="status">Đang tải…</p>;
  if (role) return <Navigate replace to={homePath(role)} />;
  return <Outlet />;
}

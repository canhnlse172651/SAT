import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { homePath } from '../../lib/home-path';
import { useSessionStore } from './session-store';

/** "/" sends a signed-in user to their home screen and everybody else to A01. */
export function HomeRedirect() {
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.user?.role);
  const load = useSessionStore((s) => s.load);

  useEffect(() => {
    if (status === 'idle') void load();
  }, [status, load]);

  if (status === 'idle' || status === 'loading') return <p role="status">Đang tải…</p>;
  return <Navigate replace to={homePath(role)} />;
}

import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { useSessionStore } from '../features/session/session-store';
import { StudentShell } from './StudentShell';
import { TeacherShell } from './TeacherShell';

/** Pages any visitor may see (A05): inside the signed-in role's shell, bare otherwise (prototype A05). */
export function RoleShell() {
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.user?.role);
  const load = useSessionStore((s) => s.load);

  useEffect(() => {
    if (status === 'idle') void load();
  }, [status, load]);

  if (status === 'idle' || status === 'loading') return <p role="status">Đang tải…</p>;
  if (role === 'GV') return <TeacherShell />;
  if (role === 'HV') return <StudentShell />;
  return (
    <main>
      <Outlet />
    </main>
  );
}

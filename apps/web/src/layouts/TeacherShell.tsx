import { NavLink, Outlet } from 'react-router';
import { useSessionStore } from '../features/session/session-store';
import './layouts.css';

const TEACHER_NAV = [
  { label: 'Dashboard', to: '/gv', end: true },
  { label: 'Lớp học', to: '/gv/lop-hoc', end: false },
  { label: 'Giáo trình', to: '/gv/giao-trinh', end: false },
  { label: 'Bài thi', to: '/gv/bai-thi', end: false },
  { label: 'Học viên', to: '/gv/hoc-vien', end: false },
  { label: 'Kho tự học', to: '/gv/kho-tu-hoc', end: false },
  { label: 'Tài khoản', to: '/gv/tai-khoan', end: false },
] as const;

export function TeacherShell() {
  const workspace = useSessionStore((s) => s.workspace);
  const user = useSessionStore((s) => s.user);
  return (
    <div className="teacher-shell">
      <aside className="teacher-shell__side">
        <p className="teacher-shell__workspace">{workspace?.name ?? 'SAT'}</p>
        <nav aria-label="Điều hướng chính">
          <ul>
            {TEACHER_NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <details className="teacher-shell__user">
          <summary>{user?.displayName ?? 'Tài khoản'}</summary>
          {/* Placeholder: sign-out is built by module 001. */}
          <button type="button">Đăng xuất</button>
        </details>
      </aside>
      <main className="teacher-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

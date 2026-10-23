import { NavLink, Outlet } from 'react-router';
import './layouts.css';

const STUDENT_NAV = [
  { label: 'Lớp của tôi', to: '/hv', end: true },
  { label: 'Bài thi', to: '/hv/bai-thi', end: false },
  { label: 'Tự học', to: '/tu-hoc', end: false },
  { label: 'Xếp hạng', to: '/hv/xep-hang', end: false },
  { label: 'Tài khoản', to: '/hv/ho-so', end: false },
] as const;

export function StudentShell() {
  return (
    <div className="student-shell">
      <main className="student-shell__main">
        <Outlet />
      </main>
      <nav aria-label="Thanh tab" className="student-shell__tabs">
        <ul>
          {STUDENT_NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

import { NavLink, Outlet } from 'react-router';
import { Avatar, Icon, IconButton, type IconName } from '../components';
import { useSessionStore } from '../features/session/session-store';
import { useCurrentScreen } from './current-screen';
import './layouts.css';

const TEACHER_NAV: { label: string; to: string; end: boolean; icon: IconName }[] = [
  { label: 'Dashboard', to: '/gv', end: true, icon: 'dash' },
  { label: 'Lớp học', to: '/gv/lop-hoc', end: false, icon: 'users' },
  { label: 'Giáo trình', to: '/gv/giao-trinh', end: false, icon: 'book' },
  { label: 'Bài thi', to: '/gv/bai-thi', end: false, icon: 'grade' },
  { label: 'Học viên', to: '/gv/hoc-vien', end: false, icon: 'user' },
  { label: 'Kho tự học', to: '/gv/kho-tu-hoc', end: false, icon: 'layers' },
  { label: 'Tài khoản', to: '/gv/tai-khoan', end: false, icon: 'acct' },
];

/** Not specified by any module yet: shown as in the prototype but disabled (no behaviour without an AC). */
const SOON = 'Sắp có';

/** GV desktop shell (prototype `.gv-shell`): sidebar, top bar with the screen name, content. */
export function TeacherShell() {
  const workspace = useSessionStore((s) => s.workspace);
  const user = useSessionStore((s) => s.user);
  const screen = useCurrentScreen();
  // Prototype crumbs: a top-level screen is named like its sidebar item ("Học viên", not "Danh sách học viên").
  const crumb = TEACHER_NAV.find((item) => item.to === screen?.path)?.label ?? screen?.name ?? '';
  const name = user?.displayName ?? '';
  return (
    <div className="gv-shell">
      <aside className="gv-side">
        <div className="gv-logo">
          <span className="logo-mark" lang="zh-Hans" aria-hidden="true">
            汉
          </span>
          <div>
            SAT
            <small>{workspace?.name ?? ''}</small>
          </div>
        </div>
        <nav aria-label="Điều hướng chính" className="gv-nav">
          {TEACHER_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          {name && <Avatar name={name} size="sm" />}
          <div className="side-foot__who">
            <div className="side-foot__name">{name}</div>
            {user?.email && <div className="side-foot__mail">{user.email}</div>}
          </div>
        </div>
      </aside>
      <div className="gv-main">
        <header className="gv-top">
          <nav className="crumbs" aria-label="Vị trí">
            <span className="cur">{crumb}</span>
          </nav>
          <div className="top-search" title={SOON}>
            <Icon name="search" size={18} />
            <input
              className="input"
              placeholder="Tìm lớp, học viên, giáo trình…"
              aria-label="Tìm kiếm"
              disabled
            />
          </div>
          <div className="gv-top__me">
            <IconButton aria-label="Thông báo" title={SOON} icon={<Icon name="bell" />} disabled />
            {name && <Avatar name={name} size="sm" />}
            <span className="gv-top__name">{name}</span>
          </div>
        </header>
        <main className="gv-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

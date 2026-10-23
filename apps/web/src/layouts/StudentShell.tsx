import { NavLink, Outlet } from 'react-router';
import { Icon, type IconName } from '../components';
import { useCurrentScreen } from './current-screen';
import './layouts.css';

const STUDENT_NAV: { label: string; to: string; end: boolean; icon: IconName }[] = [
  { label: 'Lớp của tôi', to: '/hv', end: true, icon: 'home' },
  { label: 'Bài thi', to: '/hv/bai-thi', end: false, icon: 'grade' },
  { label: 'Tự học', to: '/tu-hoc', end: false, icon: 'thOpen' },
  { label: 'Xếp hạng', to: '/hv/xep-hang', end: false, icon: 'trophy' },
  { label: 'Tài khoản', to: '/hv/ho-so', end: false, icon: 'acct' },
];

/** HV mobile shell (prototype `.hv-shell`): dark app bar with the screen name, content, tab bar. */
export function StudentShell() {
  const screen = useCurrentScreen();
  return (
    <div className="hv-shell">
      <header className="hv-head">
        <span className="pad" />
        <h1 className="hv-head__title">
          {screen?.id === 'A05' ? 'Không tìm thấy' : (screen?.name ?? '')}
        </h1>
      </header>
      <main className="hv-body">
        <Outlet />
      </main>
      <nav aria-label="Thanh tab" className="hv-tabbar">
        {STUDENT_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

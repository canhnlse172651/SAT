import { Outlet } from 'react-router';
import './layouts.css';

/** Frame for A01–A03: centred card, no navigation. */
export function AuthLayout() {
  return (
    <div className="auth-layout">
      <main className="auth-layout__main">
        <p className="auth-layout__brand">SAT</p>
        <Outlet />
      </main>
    </div>
  );
}

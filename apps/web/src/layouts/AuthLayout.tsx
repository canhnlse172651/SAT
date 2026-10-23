import { Outlet } from 'react-router';
import { Icon } from '../components';
import './layouts.css';

/**
 * Frame for A01–A03 (prototype `authDesk` / `authPhone`): on wide screens a dark brand panel beside
 * the form card; on phones a dark brand header above the form.
 */
export function AuthLayout() {
  return (
    <div className="auth-desk">
      <aside className="auth-brand">
        <div className="gv-logo">
          <span className="logo-mark" lang="zh-Hans" aria-hidden="true">
            汉
          </span>
          <div>
            SAT<small>Nền tảng cho giáo viên tiếng Trung</small>
          </div>
        </div>
        <p className="auth-brand__h">Lớp tiếng Trung của bạn, gọn trong một nơi.</p>
        <ul>
          <li>
            <Icon name="book" />
            Soạn bài thủ công hoặc bằng AI từ PDF/Word
          </li>
          <li>
            <Icon name="users" />
            Quản lý lớp và tài khoản học viên
          </li>
          <li>
            <Icon name="grade" />
            Bài tập tự chấm, xếp hạng, theo dõi tiến độ
          </li>
        </ul>
        <div className="big" lang="zh-Hans" aria-hidden="true">
          学
        </div>
      </aside>
      <div className="auth-phone-brand">
        <span className="logo-mark" lang="zh-Hans" aria-hidden="true">
          汉
        </span>
        <div>
          <div className="auth-phone-brand__name">SAT</div>
          <div className="auth-phone-brand__sub">Học tiếng Trung cùng giáo viên của bạn</div>
        </div>
        <div className="big" lang="zh-Hans" aria-hidden="true">
          学
        </div>
      </div>
      <main className="auth-main">
        <div className="auth-card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

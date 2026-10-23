import { ACCOUNT_MESSAGES, loginBodySchema } from '@sat/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button, TextField } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import type { LoginNoticeState } from '../session/session-notice';
import { useAuthStore } from './auth-store';
import { Notice } from './Notice';
import { PasswordField } from './PasswordField';
import { afterSignIn } from './return-to';
import './auth.css';

const POSITIVE = new Set<string>([ACCOUNT_MESSAGES.loggedOut, ACCOUNT_MESSAGES.resetDone]);

/** A01 — one sign-in for GV and HV; the role decides where it lands (REQ-3, REQ-4, AC-5.4, AC-5.5). */
export function LoginPage() {
  useDocumentTitle('Đăng nhập');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const status = useAuthStore((s) => s.status);
  const failure = useAuthStore((s) => s.failure);
  const reset = useAuthStore((s) => s.reset);
  const check = useAuthStore((s) => s.check);
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState((location.state as LoginNoticeState | null)?.notice);

  useEffect(() => reset(), [reset]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(undefined);
    const body = { email, password };
    if (!check(loginBodySchema, body)) return;
    const session = await login(body);
    if (session) {
      void navigate(afterSignIn(session.user.role, params.get('returnTo')), { replace: true });
    }
  };

  return (
    <section aria-labelledby="a01-title" data-screen="A01">
      <h1 id="a01-title" className="auth-h">
        Đăng nhập
      </h1>
      <p className="auth-sub only-desk">
        Một tài khoản cho giáo viên và học viên — hệ thống tự đưa bạn tới đúng trang.
      </p>
      <p className="auth-sub only-phone">
        Dùng email và mật khẩu trong thư “Tài khoản học tập của bạn đã sẵn sàng” mà SAT đã gửi cho
        bạn.
      </p>
      <form className="auth-form" noValidate onSubmit={(e) => void submit(e)}>
        {notice && <Notice tone={POSITIVE.has(notice) ? 'success' : 'info'}>{notice}</Notice>}
        {failure?.form && <Notice tone="danger">{failure.form}</Notice>}
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={failure?.fields['email']}
        />
        <PasswordField
          label="Mật khẩu"
          autoComplete="current-password"
          maxLength={256}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={failure?.fields['password']}
        />
        <div className="auth-row-end only-desk">
          <Link to="/quen-mat-khau" className="link">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="submit" size="lg" block loading={status === 'loading'}>
          Đăng nhập
        </Button>
      </form>
      <p className="auth-alt only-desk">
        Giáo viên mới?{' '}
        <Link to="/dang-ky" className="link">
          Đăng ký tài khoản giáo viên
        </Link>
      </p>
      <Notice tone="neutral" className="only-phone auth-alt-callout">
        Quên mật khẩu? Hãy liên hệ giáo viên của bạn để được cấp lại mật khẩu.
      </Notice>
    </section>
  );
}

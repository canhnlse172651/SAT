import {
  ACCOUNT_MESSAGES as M,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@sat/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button, TextField } from '../../components';
import { ChevronLeftIcon } from '../../components/icons';
import { useDocumentTitle } from '../../lib/use-document-title';
import type { LoginNoticeState } from '../session/session-notice';
import { useAuthStore } from './auth-store';
import { Notice } from './Notice';
import { PasswordRules } from './PasswordRules';
import './auth.css';

type Step = 'request' | 'sent' | 'checking' | 'newPassword' | 'invalid';
const STEPS = ['Nhập email', 'Kiểm tra email', 'Mật khẩu mới'] as const;
const stepIndex: Record<Step, number> = {
  request: 0,
  sent: 1,
  checking: 2,
  newPassword: 2,
  invalid: 2,
};

/** A03 — GV forgot password: request a link, then set a new password from the link (REQ-6). */
export function ForgotPasswordPage() {
  useDocumentTitle('Quên mật khẩu');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const token = params.get('token');
  const status = useAuthStore((s) => s.status);
  const failure = useAuthStore((s) => s.failure);
  const reset = useAuthStore((s) => s.reset);
  const check = useAuthStore((s) => s.check);
  const requestReset = useAuthStore((s) => s.requestReset);
  const inspectReset = useAuthStore((s) => s.inspectReset);
  const confirmReset = useAuthStore((s) => s.confirmReset);
  const [requestStep, setRequestStep] = useState<'request' | 'sent'>('request');
  /** Result of checking the link in the URL; a different token means "still checking". */
  const [link, setLink] = useState<{ token: string; email: string | null } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    reset();
    if (!token) return;
    let live = true;
    void inspectReset(token).then((found) => {
      if (live) setLink({ token, email: found });
    });
    return () => {
      live = false;
    };
  }, [token, reset, inspectReset]);

  const step: Step = !token
    ? requestStep
    : link?.token !== token
      ? 'checking'
      : link.email
        ? 'newPassword'
        : 'invalid';
  const accountEmail = link?.email ?? '';
  const setStep = (next: 'sent' | 'invalid') =>
    next === 'sent' ? setRequestStep('sent') : token && setLink({ token, email: null });

  const sendLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!check(passwordResetRequestSchema, { email })) return;
    if (await requestReset(email)) setStep('sent');
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const body = { token, password, passwordConfirm };
    if (!check(passwordResetConfirmSchema, body)) return;
    if (await confirmReset(body)) {
      const state: LoginNoticeState = { notice: M.resetDone };
      void navigate('/dang-nhap', { replace: true, state });
      return;
    }
    // The link may have expired or been replaced while the form was open.
    if (useAuthStore.getState().failure?.form === M.resetLinkInvalid) setStep('invalid');
  };

  const backToRequest = () => {
    reset();
    setParams({}, { replace: true });
    setRequestStep('request');
  };

  return (
    <section aria-labelledby="a03-title" data-screen="A03">
      <Link to="/dang-nhap" className="auth-page__back">
        <ChevronLeftIcon width={16} height={16} aria-hidden="true" />
        Đăng nhập
      </Link>
      <ol className="auth-page__steps" aria-label={`Bước ${stepIndex[step] + 1}/3`}>
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === stepIndex[step] ? 'step' : undefined}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 'request' && (
        <>
          <h1 id="a03-title" className="auth-page__title">
            Quên mật khẩu
          </h1>
          <p className="auth-page__sub">
            Nhập email bạn dùng để đăng nhập. Nếu đó là tài khoản giáo viên, chúng tôi sẽ gửi liên
            kết đặt lại mật khẩu.
          </p>
          <form className="auth-page__form" noValidate onSubmit={(e) => void sendLink(e)}>
            {failure?.form && <Notice tone="danger">{failure.form}</Notice>}
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="ten@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={failure?.fields['email']}
            />
            <Button type="submit" size="lg" block loading={status === 'loading'}>
              Gửi liên kết đặt lại
            </Button>
          </form>
        </>
      )}

      {step === 'sent' && (
        <>
          <h1 id="a03-title" className="auth-page__title">
            Kiểm tra email
          </h1>
          <Notice tone="success">{M.resetRequested}</Notice>
          <p className="auth-page__help">
            Liên kết dùng một lần và hết hạn sau 60 phút. Tối đa 3 thư mỗi 60 phút.
          </p>
          <p className="auth-page__alt">
            <button type="button" className="link-button" onClick={backToRequest}>
              Đổi email
            </button>
          </p>
        </>
      )}

      {step === 'checking' && (
        <h1 id="a03-title" className="auth-page__title" role="status">
          Đang kiểm tra liên kết…
        </h1>
      )}

      {step === 'invalid' && (
        <>
          <h1 id="a03-title" className="auth-page__title">
            Đặt mật khẩu mới
          </h1>
          <Notice tone="danger">{M.resetLinkInvalid}</Notice>
          <p className="auth-page__alt">
            <Button size="lg" block onClick={backToRequest}>
              Gửi lại liên kết
            </Button>
          </p>
        </>
      )}

      {step === 'newPassword' && (
        <>
          <h1 id="a03-title" className="auth-page__title">
            Đặt mật khẩu mới
          </h1>
          <p className="auth-page__sub">Cho tài khoản {accountEmail}</p>
          <form className="auth-page__form" noValidate onSubmit={(e) => void savePassword(e)}>
            {failure?.form && <Notice tone="danger">{failure.form}</Notice>}
            <TextField
              label="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={failure?.fields['password']}
            />
            <PasswordRules value={password} />
            <TextField
              label="Xác nhận mật khẩu"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              error={failure?.fields['passwordConfirm']}
            />
            <Button type="submit" size="lg" block loading={status === 'loading'}>
              Đặt lại mật khẩu
            </Button>
          </form>
        </>
      )}
    </section>
  );
}

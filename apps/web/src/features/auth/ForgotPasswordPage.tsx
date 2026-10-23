import {
  ACCOUNT_MESSAGES as M,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@sat/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button, Icon, TextField } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import type { LoginNoticeState } from '../session/session-notice';
import { useAuthStore } from './auth-store';
import { Notice } from './Notice';
import { PasswordField } from './PasswordField';
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

  const stepChip = (i: number) =>
    i === stepIndex[step]
      ? 'chip chip--brand'
      : i < stepIndex[step]
        ? 'chip chip--done'
        : 'chip chip--outline';

  return (
    <section aria-labelledby="a03-title" data-screen="A03">
      <Link to="/dang-nhap" className="link auth-back">
        <Icon name="back" size={16} />
        Đăng nhập
      </Link>
      <ol className="auth-steps" aria-label={`Bước ${stepIndex[step] + 1}/3`}>
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={stepChip(i)}
            aria-current={i === stepIndex[step] ? 'step' : undefined}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 'request' && (
        <>
          <h1 id="a03-title" className="auth-h">
            Quên mật khẩu
          </h1>
          <p className="auth-sub">
            Nhập email bạn dùng để đăng nhập. Nếu đó là tài khoản giáo viên, chúng tôi sẽ gửi liên
            kết đặt lại mật khẩu.
          </p>
          <form className="auth-form" noValidate onSubmit={(e) => void sendLink(e)}>
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
          <div className="auth-sent-ic">
            <Icon name="send" size={26} />
          </div>
          <h1 id="a03-title" className="auth-h">
            Kiểm tra email
          </h1>
          <Notice tone="success" className="auth-sent-note">
            {M.resetRequested}
          </Notice>
          <p className="auth-small">
            Liên kết dùng một lần và hết hạn sau 60 phút. Tối đa 3 thư mỗi 60 phút.
          </p>
          <Button variant="outline" block onClick={backToRequest}>
            Đổi email
          </Button>
        </>
      )}

      {step === 'checking' && (
        <h1 id="a03-title" className="auth-h" role="status">
          Đang kiểm tra liên kết…
        </h1>
      )}

      {step === 'invalid' && (
        <>
          <h1 id="a03-title" className="sr-only">
            Đặt mật khẩu mới
          </h1>
          <Notice tone="danger" className="auth-sent-note">
            {M.resetLinkInvalid}
          </Notice>
          <Button block onClick={backToRequest}>
            Gửi lại liên kết
          </Button>
        </>
      )}

      {step === 'newPassword' && (
        <>
          <h1 id="a03-title" className="auth-h">
            Đặt mật khẩu mới
          </h1>
          <p className="auth-sub">Cho tài khoản {accountEmail}</p>
          <form className="auth-form" noValidate onSubmit={(e) => void savePassword(e)}>
            {failure?.form && <Notice tone="danger">{failure.form}</Notice>}
            <PasswordField
              label="Mật khẩu mới"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={failure?.fields['password']}
            />
            <PasswordRules value={password} />
            <PasswordField
              label="Xác nhận mật khẩu"
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

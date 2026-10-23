import { registerBodySchema } from '@sat/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, TextField } from '../../components';
import { ChevronLeftIcon } from '../../components/icons';
import { homePath } from '../../lib/home-path';
import { useDocumentTitle } from '../../lib/use-document-title';
import { useToastStore } from '../toast/toast-store';
import { useAuthStore } from './auth-store';
import { Notice } from './Notice';
import { PasswordRules } from './PasswordRules';
import './auth.css';

const EMPTY = { displayName: '', email: '', password: '', passwordConfirm: '' };
type Field = keyof typeof EMPTY;

/** A02 — teacher sign-up; there is no student sign-up anywhere (REQ-1, AC-1.4). */
export function RegisterPage() {
  useDocumentTitle('Đăng ký giáo viên');
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const status = useAuthStore((s) => s.status);
  const failure = useAuthStore((s) => s.failure);
  const reset = useAuthStore((s) => s.reset);
  const check = useAuthStore((s) => s.check);
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => reset(), [reset]);

  const set = (key: Field) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  // AC-1.3: on any error the two password fields are cleared, the rest is kept.
  const clearPasswords = () => setForm((f) => ({ ...f, password: '', passwordConfirm: '' }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!check(registerBodySchema, form)) return clearPasswords();
    const session = await register(form);
    if (!session) return clearPasswords();
    push('Đã tạo tài khoản. Chào mừng bạn đến với SAT!', 'success');
    void navigate(homePath(session.user.role), { replace: true });
  };

  const err = failure?.fields ?? {};
  return (
    <section aria-labelledby="a02-title" data-screen="A02">
      <Link to="/dang-nhap" className="auth-page__back">
        <ChevronLeftIcon width={16} height={16} aria-hidden="true" />
        Đăng nhập
      </Link>
      <h1 id="a02-title" className="auth-page__title">
        Đăng ký giáo viên
      </h1>
      <p className="auth-page__sub">Miễn phí. Workspace của bạn chỉ mình bạn quản lý.</p>
      <form className="auth-page__form" noValidate onSubmit={(e) => void submit(e)}>
        {failure?.form && <Notice tone="danger">{failure.form}</Notice>}
        <TextField
          label="Họ tên"
          required
          autoComplete="name"
          maxLength={100}
          placeholder="VD: Lưu Thị Lan"
          value={form.displayName}
          onChange={set('displayName')}
          error={err['displayName']}
        />
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="ten@email.com"
          value={form.email}
          onChange={set('email')}
          error={err['email']}
        />
        <TextField
          label="Mật khẩu"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={err['password']}
        />
        <PasswordRules value={form.password} />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          required
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={set('passwordConfirm')}
          error={err['passwordConfirm']}
        />
        <Button type="submit" size="lg" block loading={status === 'loading'}>
          Tạo tài khoản
        </Button>
      </form>
      <p className="auth-page__help">
        Tài khoản học viên do giáo viên tạo — học viên không tự đăng ký.
      </p>
    </section>
  );
}

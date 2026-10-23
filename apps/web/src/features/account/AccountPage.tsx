import { changeEmailBodySchema, displayNameSchema, fieldErrors, formatVnDate } from '@sat/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { Button, ErrorState, Skeleton, TextField } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { PasswordField } from '../auth/PasswordField';
import { useToastStore } from '../toast/toast-store';
import { useAccountStore } from './account-store';
import { ChangePasswordForm } from './ChangePasswordForm';
import { LogoutButton } from './LogoutButton';
import './account.css';

/** T17 Tài khoản giáo viên (REQ-14, REQ-15, AC-5.1) — prototype SCREENS.T17. */
export function AccountPage() {
  useDocumentTitle('Tài khoản');
  const status = useAccountStore((s) => s.status);
  const account = useAccountStore((s) => s.account);
  const load = useAccountStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby="t17-title" data-screen="T17">
      <div className="page-head">
        <div className="page-head__text">
          <h1 id="t17-title" className="page-title">
            Tài khoản
          </h1>
          <div className="page-sub">Thông tin của bạn và bảo mật đăng nhập</div>
        </div>
      </div>
      {status === 'error' && !account && <ErrorState title="Không tải được tài khoản." />}
      {!account && status !== 'error' && <Skeleton height={320} />}
      {account && (
        <div className="account__grid">
          <div className="account__col">
            <ProfileCard key={account.displayName} name={account.displayName} />
            <section className="card card-pad" aria-labelledby="t17-email">
              <h2 id="t17-email" className="account__card-title">
                Đổi email đăng nhập
              </h2>
              <EmailForm key={account.email} />
            </section>
          </div>
          <div className="account__col">
            <section className="card card-pad" aria-labelledby="t17-password">
              <h2 id="t17-password" className="account__card-title">
                Đổi mật khẩu
              </h2>
              <ChangePasswordForm submitLabel="Đổi mật khẩu" />
            </section>
            <section className="card card-pad" aria-labelledby="t17-session">
              <h2 id="t17-session" className="account__card-title account__card-title--tight">
                Phiên đăng nhập
              </h2>
              <p className="account__muted">
                Phiên tự kết thúc sau 8 giờ không thao tác. Dữ liệu workspace của bạn tách biệt hoàn
                toàn với giáo viên khác.
              </p>
              <LogoutButton variant="danger-outline" icon />
            </section>
          </div>
        </div>
      )}
    </section>
  );
}

/** AC-14.1 */
function ProfileCard({ name }: { name: string }) {
  const account = useAccountStore((s) => s.account);
  const updateProfile = useAccountStore((s) => s.updateProfile);
  const push = useToastStore((s) => s.push);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = displayNameSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    try {
      await updateProfile(parsed.data);
      setError(undefined);
      push('Đã lưu thay đổi.', 'success');
    } catch (err) {
      const f = formFailure(err);
      setError(f.fields['displayName'] ?? f.form ?? undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card card-pad" aria-labelledby="t17-profile">
      <h2 id="t17-profile" className="account__card-title">
        Hồ sơ
      </h2>
      <form className="account__form" noValidate onSubmit={(e) => void save(e)}>
        <TextField
          label="Họ tên"
          required
          maxLength={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={error}
        />
        <div className="account__meta">
          <span>
            Email: <b>{account?.email}</b>
          </span>
          <span>Tạo tài khoản: {account ? formatVnDate(new Date(account.createdAt)) : ''}</span>
        </div>
        <div>
          <Button type="submit" loading={busy}>
            Lưu họ tên
          </Button>
        </div>
      </form>
    </section>
  );
}

/** AC-14.2, AC-14.3 */
function EmailForm() {
  const changeEmail = useAccountStore((s) => s.changeEmail);
  const push = useToastStore((s) => s.push);
  const [form, setForm] = useState({ email: '', currentPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = changeEmailBodySchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setBusy(true);
    try {
      await changeEmail(form);
      setForm({ email: '', currentPassword: '' });
      setErrors({});
      push('Đã đổi email đăng nhập.', 'success');
    } catch (err) {
      const f = formFailure(err);
      setErrors(f.fields);
      setFormError(f.form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="account__form" noValidate onSubmit={(e) => void save(e)}>
      {formError && <Notice tone="danger">{formError}</Notice>}
      <TextField
        label="Email mới"
        type="email"
        autoComplete="off"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        error={errors['email']}
      />
      <PasswordField
        label="Mật khẩu hiện tại"
        autoComplete="off"
        maxLength={256}
        value={form.currentPassword}
        onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
        error={errors['currentPassword']}
      />
      <div>
        <Button type="submit" variant="outline" loading={busy}>
          Đổi email
        </Button>
      </div>
    </form>
  );
}

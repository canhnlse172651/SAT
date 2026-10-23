import { ACCOUNT_MESSAGES as M, changePasswordBodySchema, fieldErrors } from '@sat/shared';
import { type FormEvent, useState } from 'react';
import { Button, TextField } from '../../components';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { PasswordRules } from '../auth/PasswordRules';
import { useToastStore } from '../toast/toast-store';
import { useAccountStore } from './account-store';

const EMPTY = { currentPassword: '', newPassword: '', newPasswordConfirm: '' };

/**
 * REQ-15 for T17 and S10: keeps this session and ends the others (AC-15.1). Five wrong current
 * passwords end the session — the API answers 401 and the app goes to A01 (AC-15.3).
 */
export function ChangePasswordForm({ size }: { size?: 'md' | 'lg' }) {
  const changePassword = useAccountStore((s) => s.changePassword);
  const push = useToastStore((s) => s.push);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = changePasswordBodySchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setBusy(true);
    try {
      await changePassword(form);
      setForm(EMPTY);
      setErrors({});
      push(M.passwordChanged, 'success');
    } catch (err) {
      const f = formFailure(err);
      setErrors(f.fields);
      setFormError(f.form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="account__form" noValidate onSubmit={(e) => void submit(e)}>
      {formError && <Notice tone="danger">{formError}</Notice>}
      <TextField
        label="Mật khẩu hiện tại"
        type="password"
        size={size}
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={set('currentPassword')}
        error={errors['currentPassword']}
      />
      <TextField
        label="Mật khẩu mới"
        type="password"
        size={size}
        autoComplete="new-password"
        value={form.newPassword}
        onChange={set('newPassword')}
        error={errors['newPassword']}
      />
      <PasswordRules value={form.newPassword} />
      <TextField
        label="Xác nhận mật khẩu"
        type="password"
        size={size}
        autoComplete="new-password"
        value={form.newPasswordConfirm}
        onChange={set('newPasswordConfirm')}
        error={errors['newPasswordConfirm']}
      />
      <div>
        <Button type="submit" size={size} loading={busy}>
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
}

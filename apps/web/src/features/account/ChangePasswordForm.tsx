import { ACCOUNT_MESSAGES as M, changePasswordBodySchema, fieldErrors } from '@sat/shared';
import { type FormEvent, useState } from 'react';
import { Button } from '../../components';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { PasswordField } from '../auth/PasswordField';
import { PasswordRules } from '../auth/PasswordRules';
import { useToastStore } from '../toast/toast-store';
import { useAccountStore } from './account-store';

const EMPTY = { currentPassword: '', newPassword: '', newPasswordConfirm: '' };

interface Props {
  /** T17: "Xác nhận mật khẩu"; S10 full-screen dialog: "Xác nhận mật khẩu mới". */
  confirmLabel?: string;
  /** Rendered submit button; omit when an outside button submits through `formId`. */
  submitLabel?: string;
  formId?: string;
  onDone?: () => void;
  onBusy?: (busy: boolean) => void;
}

/**
 * REQ-15 for T17 and S10: keeps this session and ends the others (AC-15.1). Five wrong current
 * passwords end the session — the API answers 401 and the app goes to A01 (AC-15.3).
 */
export function ChangePasswordForm({
  confirmLabel = 'Xác nhận mật khẩu',
  submitLabel,
  formId,
  onDone,
  onBusy,
}: Props) {
  const changePassword = useAccountStore((s) => s.changePassword);
  const push = useToastStore((s) => s.push);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const working = (b: boolean) => {
    setBusy(b);
    onBusy?.(b);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = changePasswordBodySchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    working(true);
    try {
      await changePassword(form);
      setForm(EMPTY);
      setErrors({});
      push(M.passwordChanged, 'success');
      onDone?.();
    } catch (err) {
      const f = formFailure(err);
      setErrors(f.fields);
      setFormError(f.form);
    } finally {
      working(false);
    }
  };

  return (
    <form id={formId} className="account__form" noValidate onSubmit={(e) => void submit(e)}>
      {formError && <Notice tone="danger">{formError}</Notice>}
      <PasswordField
        label="Mật khẩu hiện tại"
        autoComplete="current-password"
        maxLength={256}
        value={form.currentPassword}
        onChange={set('currentPassword')}
        error={errors['currentPassword']}
      />
      <PasswordField
        label="Mật khẩu mới"
        autoComplete="new-password"
        value={form.newPassword}
        onChange={set('newPassword')}
        error={errors['newPassword']}
      />
      <PasswordRules value={form.newPassword} />
      <PasswordField
        label={confirmLabel}
        autoComplete="new-password"
        value={form.newPasswordConfirm}
        onChange={set('newPasswordConfirm')}
        error={errors['newPasswordConfirm']}
      />
      {submitLabel && (
        <div>
          <Button type="submit" loading={busy}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

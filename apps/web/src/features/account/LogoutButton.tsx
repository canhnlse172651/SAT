import { ACCOUNT_MESSAGES } from '@sat/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, type ButtonProps, ConfirmDialog, Icon } from '../../components';
import { apiRequest } from '../../lib/api-client';
import { LOGIN_PATH } from '../../lib/home-path';
import type { LoginNoticeState } from '../session/session-notice';
import { useSessionStore } from '../session/session-store';
import { useLogoutGuardStore } from './logout-guard';

interface Props {
  variant?: ButtonProps['variant'];
  block?: boolean;
  size?: ButtonProps['size'];
  className?: string;
  /** Prototype: the logout icon before the label. */
  icon?: boolean;
}

/**
 * "Đăng xuất" with its confirmation (AC-5.1): ends this device's session only (AC-5.6), then A01 with
 * "Đã đăng xuất." — replacing the history entry so Back cannot show signed-in data again. With unsaved
 * review results the dialog becomes the AC-20.9 warning.
 */
export function LogoutButton({ variant = 'outline', block, size, className, icon }: Props) {
  const navigate = useNavigate();
  const clear = useSessionStore((s) => s.clear);
  const unsaved = useLogoutGuardStore((s) => s.unsavedReviews);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST', handleUnauthorized: false });
    } catch {
      // Already signed out or offline: the local session is dropped either way.
    }
    setBusy(false);
    setOpen(false);
    const state: LoginNoticeState = { notice: ACCOUNT_MESSAGES.loggedOut };
    void navigate(LOGIN_PATH, { replace: true, state });
    // The area guard may redirect first; it carries the same notice.
    clear(null, ACCOUNT_MESSAGES.loggedOut);
  };

  return (
    <>
      <Button
        variant={variant}
        block={block}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {icon && <Icon name="logout" size={18} />}
        Đăng xuất
      </Button>
      {unsaved > 0 ? (
        <ConfirmDialog
          open={open}
          title="Đăng xuất?"
          message={`Còn ${unsaved} kết quả ôn tập chưa được lưu. Đăng xuất bây giờ sẽ mất các kết quả này.`}
          cancelLabel="Ở lại"
          confirmLabel="Vẫn đăng xuất"
          tone="danger"
          loading={busy}
          onCancel={() => setOpen(false)}
          onConfirm={() => void logout()}
        />
      ) : (
        <ConfirmDialog
          open={open}
          title="Đăng xuất khỏi SAT?"
          message="Bạn sẽ cần email và mật khẩu để đăng nhập lại."
          confirmLabel="Đăng xuất"
          loading={busy}
          onCancel={() => setOpen(false)}
          onConfirm={() => void logout()}
        />
      )}
    </>
  );
}

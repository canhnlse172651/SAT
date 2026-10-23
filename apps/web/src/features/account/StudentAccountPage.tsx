import { useEffect, useId, useRef, useState } from 'react';
import { Avatar, Button, ErrorState, Icon, IconButton, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { Notice } from '../auth/Notice';
import { useAccountStore } from './account-store';
import { ChangePasswordForm } from './ChangePasswordForm';
import { LogoutButton } from './LogoutButton';
import './account.css';

/**
 * S10 Hồ sơ của tôi — prototype SCREENS.S10 with the data module 001 owns: the password hint
 * (AC-15.5), sign-in data, "Đổi mật khẩu" (REQ-15) and sign-out (AC-5.1, AC-20.9). The default cover
 * and initials avatar stand in until module 011 adds photos and the class list.
 */
export function StudentAccountPage() {
  useDocumentTitle('Hồ sơ của tôi');
  const status = useAccountStore((s) => s.status);
  const account = useAccountStore((s) => s.account);
  const load = useAccountStore((s) => s.load);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'error' && !account) return <ErrorState title="Không tải được hồ sơ." />;
  if (!account) return <Skeleton height={200} />;
  return (
    <div data-screen="S10" className="s10">
      {account.passwordSource === 'system' && (
        <Notice
          tone="neutral"
          icon="key"
          className="s10-hint"
          action={
            <Button size="sm" variant="outline" onClick={() => setChanging(true)}>
              Đổi mật khẩu
            </Button>
          }
        >
          Bạn đang dùng mật khẩu được gửi qua email. Hãy đổi sang mật khẩu của riêng bạn.
        </Notice>
      )}
      <div className="prof-head">
        <div className="pcover" aria-hidden="true" />
        <div className="prof-av">
          <Avatar name={account.displayName} size="xxl" />
        </div>
        <h2 className="prof-name">{account.displayName}</h2>
      </div>

      <h2 className="sec-title">Thông tin cá nhân</h2>
      <dl className="m-card s10-info">
        <div className="info-row">
          <dt>Họ tên</dt>
          <dd>{account.displayName}</dd>
        </div>
        <div className="info-row">
          <dt>Email đăng nhập</dt>
          <dd>{account.email}</dd>
        </div>
        <div className="info-row">
          <dt>Số điện thoại</dt>
          <dd>{account.phone ?? 'Chưa có'}</dd>
        </div>
      </dl>
      <p className="s10-help">Liên hệ giáo viên nếu cần thay đổi thông tin.</p>

      <h2 className="sec-title">Bảo mật</h2>
      <button type="button" className="lrow" onClick={() => setChanging(true)}>
        <span className="l-ic">
          <Icon name="key" />
        </span>
        <span className="l-main">
          <span className="l-title">Đổi mật khẩu</span>
          <span className="l-sub">Các phiên khác sẽ bị đăng xuất</span>
        </span>
        <Icon name="fwd" size={18} className="chev" />
      </button>
      <div className="s10-logout">
        <LogoutButton variant="danger-outline" block icon />
      </div>

      {changing && <PasswordScreen onClose={() => setChanging(false)} />}
    </div>
  );
}

/** Prototype `FSDS.pw`: full-screen "Đổi mật khẩu" dialog on the phone. */
function PasswordScreen({ onClose }: { onClose: () => void }) {
  const formId = useId();
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.querySelector<HTMLElement>('input')?.focus();
    return () => previous?.focus();
  }, []);

  return (
    <div
      ref={ref}
      className="fsd"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="fsd-head">
        <IconButton aria-label="Đóng" icon={<Icon name="close" size={22} />} onClick={onClose} />
        <h2 id={titleId}>Đổi mật khẩu</h2>
      </div>
      <div className="fsd-body">
        <ChangePasswordForm
          formId={formId}
          confirmLabel="Xác nhận mật khẩu mới"
          onBusy={setBusy}
          onDone={onClose}
        />
      </div>
      <div className="fsd-foot">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" form={formId} loading={busy}>
          Lưu mật khẩu
        </Button>
      </div>
    </div>
  );
}

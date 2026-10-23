import { useEffect, useRef, useState } from 'react';
import { Button, ErrorState, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { Notice } from '../auth/Notice';
import { useAccountStore } from './account-store';
import { ChangePasswordForm } from './ChangePasswordForm';
import { LogoutButton } from './LogoutButton';
import './account.css';

/**
 * S10 Hồ sơ của tôi — the part module 001 owns: own sign-in data, password change (REQ-15) with the
 * hint while the password is still the generated one (AC-15.5), and sign-out (AC-5.1, AC-20.9).
 * Module 011 adds the profile (photo, classes, progress, rank) around it.
 */
export function StudentAccountPage() {
  useDocumentTitle('Hồ sơ của tôi');
  const status = useAccountStore((s) => s.status);
  const account = useAccountStore((s) => s.account);
  const load = useAccountStore((s) => s.load);
  const [changing, setChanging] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const openForm = () => {
    setChanging(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ block: 'start' }));
  };

  return (
    <section aria-labelledby="s10-title" data-screen="S10" className="account--mobile">
      <h1 id="s10-title" className="page-title">
        Hồ sơ của tôi
      </h1>
      {status === 'error' && !account && <ErrorState title="Không tải được hồ sơ." />}
      {!account && status !== 'error' && <Skeleton height={200} />}
      {account && (
        <>
          {account.passwordSource === 'system' && (
            <Notice
              action={
                <Button variant="outline" onClick={openForm}>
                  Đổi mật khẩu
                </Button>
              }
            >
              Bạn đang dùng mật khẩu được gửi qua email. Hãy đổi sang mật khẩu của riêng bạn.
            </Notice>
          )}
          <h2 className="account__section">Thông tin cá nhân</h2>
          <dl className="account__rows">
            <div>
              <dt>Họ tên</dt>
              <dd>{account.displayName}</dd>
            </div>
            <div>
              <dt>Email đăng nhập</dt>
              <dd>{account.email}</dd>
            </div>
          </dl>
          <p className="account__muted">Liên hệ giáo viên nếu cần thay đổi thông tin.</p>

          <h2 className="account__section">Bảo mật</h2>
          {changing ? (
            <section ref={formRef} aria-label="Đổi mật khẩu" className="account__card">
              <ChangePasswordForm size="lg" />
            </section>
          ) : (
            <Button variant="outline" size="lg" block onClick={openForm}>
              Đổi mật khẩu
            </Button>
          )}
          <p className="account__muted">Các phiên khác sẽ bị đăng xuất khi bạn đổi mật khẩu.</p>
          <div className="account__logout">
            <LogoutButton variant="danger" size="lg" block />
          </div>
        </>
      )}
    </section>
  );
}

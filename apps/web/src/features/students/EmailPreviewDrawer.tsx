import type { MailPreview } from '@sat/shared';
import { useEffect, useState } from 'react';
import { Button, Drawer, ErrorState, SegmentedControl, Skeleton } from '../../components';
import { useStudentsStore } from './students-store';
import './students.css';

type Kind = MailPreview['kind'];
const KINDS: { value: Kind; label: string }[] = [
  { value: 'activation', label: 'Thư kích hoạt' },
  { value: 'new_password', label: 'Thư mật khẩu mới' },
  { value: 'deadline_reminder', label: 'Thư nhắc hạn nộp' },
];

/** AC-17.6 (prototype `emailPv`): read-only samples of the account e-mails and of the 003 reminder. */
export function EmailPreviewDrawer({ onClose }: { onClose: () => void }) {
  const mailPreviews = useStudentsStore((s) => s.mailPreviews);
  const [kind, setKind] = useState<Kind>('activation');
  const [previews, setPreviews] = useState<MailPreview[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    mailPreviews().then(
      (p) => live && setPreviews(p),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [mailPreviews]);

  const preview = previews?.find((p) => p.kind === kind);
  const reminder = kind === 'deadline_reminder';
  return (
    <Drawer
      open
      onClose={onClose}
      title={reminder ? 'Mẫu email nhắc hạn nộp' : 'Mẫu email tài khoản'}
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      <SegmentedControl
        className="mail-kinds"
        aria-label="Loại thư"
        options={KINDS}
        value={kind}
        onChange={setKind}
      />
      {failed && <ErrorState title="Không tải được mẫu email." />}
      {!preview && !failed && <Skeleton height={240} />}
      {preview && (
        <>
          <div className="mail-pv">
            <div className="mail-meta">
              <div>
                <span className="imp-muted">Từ:</span> {preview.from}
              </div>
              <div>
                <span className="imp-muted">Tới:</span> {preview.to}
              </div>
              <div className="mail-meta__subject">{preview.content.subject}</div>
            </div>
            <div className="mail-body">
              {preview.content.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {preview.content.items.length > 0 && (
                <ul className="mail-items">
                  {preview.content.items.map((i) => (
                    <li key={i.title}>
                      <b>{i.title}</b>
                      <br />
                      <span className="imp-muted">{i.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
              {preview.content.credentials.length > 0 && (
                <div className="mail-cred">
                  {preview.content.credentials.map((c) => (
                    <div key={c.label}>
                      <span className="imp-muted">{c.label}:</span> <b>{c.value}</b>
                    </div>
                  ))}
                </div>
              )}
              {preview.content.button && (
                <p>
                  <span className="btn btn--primary btn--sm mail-btn">
                    {preview.content.button.label}
                  </span>
                </p>
              )}
              {preview.content.after.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="mail-foot">{preview.content.footer}</p>
            </div>
          </div>
          <p className="mail-note">
            {reminder
              ? 'Thư gửi lúc 08:00 ngày hạn nộp tới học viên đã kích hoạt chưa nộp bộ bài tập đó; nhiều bộ cùng hạn trong một lớp được gộp vào một thư.'
              : 'Mẫu xem trước. Mật khẩu ngẫu nhiên 10 ký tự chỉ có trong thư gửi học viên — giáo viên không xem được.'}
          </p>
        </>
      )}
    </Drawer>
  );
}

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

/** AC-17.6: read-only samples of the account e-mails (password masked) and of the 003 reminder. */
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
      <div className="mail-preview">
        <SegmentedControl aria-label="Loại thư" options={KINDS} value={kind} onChange={setKind} />
        {failed && <ErrorState title="Không tải được mẫu email." />}
        {!preview && !failed && <Skeleton height={240} />}
        {preview && (
          <>
            <div className="mail-preview__meta">
              <div>Từ: {preview.from}</div>
              <div>Tới: {preview.to}</div>
              <div className="mail-preview__subject">{preview.content.subject}</div>
            </div>
            <div className="mail-preview__body">
              {preview.content.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {preview.content.items.length > 0 && (
                <ul>
                  {preview.content.items.map((i) => (
                    <li key={i.title}>
                      <b>{i.title}</b>
                      <br />
                      {i.detail}
                    </li>
                  ))}
                </ul>
              )}
              {preview.content.credentials.length > 0 && (
                <div className="mail-preview__cred">
                  {preview.content.credentials.map((c) => (
                    <div key={c.label}>
                      {c.label}: <b>{c.value}</b>
                    </div>
                  ))}
                </div>
              )}
              {preview.content.button && (
                <span className="mail-preview__button">{preview.content.button.label}</span>
              )}
              {preview.content.after.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="mail-preview__footer">{preview.content.footer}</p>
            </div>
            <p className="mail-preview__note">
              {reminder
                ? 'Thư gửi lúc 08:00 ngày hạn nộp tới học viên đã kích hoạt chưa nộp bộ bài tập đó; nhiều bộ cùng hạn trong một lớp được gộp vào một thư.'
                : 'Mẫu xem trước. Mật khẩu ngẫu nhiên 10 ký tự chỉ có trong thư gửi học viên — giáo viên không xem được.'}
            </p>
          </>
        )}
      </div>
    </Drawer>
  );
}

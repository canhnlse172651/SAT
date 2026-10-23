import { ACCOUNT_MESSAGES as M, fieldErrors, studentBodySchema } from '@sat/shared';
import { useState } from 'react';
import { Avatar, Button, Dialog, Tabs } from '../../components';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { useToastStore } from '../toast/toast-store';
import { ImportTab } from './ImportTab';
import { EMPTY_STUDENT } from './student-form';
import { StudentFields, StudentStatusChip } from './StudentFields';
import { useStudentsStore } from './students-store';
import './students.css';

export type AddTab = 'one' | 'import';

interface Added {
  id: string;
  displayName: string;
  email: string;
}

/**
 * T12 "Thêm học viên": one at a time or by Excel. Students are added as "Chưa kích hoạt" with no
 * password and no e-mail (AC-8.1, AC-10.3). Closing never asks (AC-8.3).
 */
export function AddStudentsDialog({
  open,
  initialTab,
  onClose,
}: {
  open: boolean;
  initialTab: AddTab;
  onClose: () => void;
}) {
  const create = useStudentsStore((s) => s.create);
  const push = useToastStore((s) => s.push);
  const [tab, setTab] = useState<AddTab>(initialTab);
  const [form, setForm] = useState(EMPTY_STUDENT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Added[]>([]);
  const [imported, setImported] = useState(false);

  const save = async () => {
    if (busy) return;
    setFormError(null);
    const parsed = studentBodySchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setBusy(true);
    try {
      const s = await create(form);
      setAdded((list) => [{ id: s.id, displayName: s.displayName, email: s.email }, ...list]);
      setForm(EMPTY_STUDENT);
      setErrors({});
      push(`Đã thêm ${s.displayName} — Chưa kích hoạt.`, 'success');
    } catch (err) {
      const f = formFailure(err);
      setErrors(f.fields);
      setFormError(f.form);
    } finally {
      setBusy(false);
    }
  };

  const done = added.length > 0 || imported;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Thêm học viên"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {done ? 'Đóng' : 'Hủy'}
          </Button>
          {tab === 'one' && (
            <Button loading={busy} onClick={() => void save()}>
              Thêm học viên
            </Button>
          )}
        </>
      }
    >
      <Tabs
        aria-label="Cách thêm học viên"
        value={tab}
        onChange={(id) => setTab(id as AddTab)}
        items={[
          {
            id: 'one',
            label: 'Thêm từng người',
            content: (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void save();
                }}
              >
                {formError && <Notice tone="danger">{formError}</Notice>}
                <StudentFields value={form} onChange={setForm} errors={errors} />
                <p className="student-form__help">
                  Chỉ cần họ tên và email. Không có mật khẩu: khi bạn bấm “Kích hoạt”, hệ thống tạo
                  mật khẩu ngẫu nhiên và gửi email đăng nhập tới học viên.
                </p>
                {/* Enter in a field adds the student. */}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
                {added.length > 0 && (
                  <section aria-labelledby="t12-added">
                    <h3 id="t12-added" className="dialog-section-title">
                      Vừa thêm ({added.length})
                    </h3>
                    <p className="students__muted">{M.activationHint}</p>
                    <ul className="added-list" aria-label="Học viên vừa thêm">
                      {added.map((s) => (
                        <li key={s.id}>
                          <Avatar name={s.displayName} size="sm" />
                          <span className="added-list__who">
                            <b>{s.displayName}</b>{' '}
                            <span className="students__muted">{s.email}</span>
                          </span>
                          <StudentStatusChip status="pending" />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </form>
            ),
          },
          {
            id: 'import',
            label: 'Import Excel',
            content: <ImportTab onAdded={() => setImported(true)} />,
          },
        ]}
      />
    </Dialog>
  );
}

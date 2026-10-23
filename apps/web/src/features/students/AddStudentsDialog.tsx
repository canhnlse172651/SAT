import { ACCOUNT_MESSAGES as M, fieldErrors, studentBodySchema } from '@sat/shared';
import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, Tabs } from '../../components';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { useToastStore } from '../toast/toast-store';
import { AddedList } from './AddedList';
import { ImportTab } from './ImportTab';
import { EMPTY_STUDENT } from './student-form';
import { StudentFields } from './StudentFields';
import { useStudentsStore } from './students-store';
import { useStudentImport } from './use-student-import';
import './students.css';

export type AddTab = 'one' | 'import';

export interface Added {
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
  onAdded,
}: {
  open: boolean;
  initialTab: AddTab;
  onClose: () => void;
  /** Students just added (one by one or by import) — 003 selects them in its pickers (003 AC-3.4). */
  onAdded?: (students: Added[]) => void;
}) {
  const create = useStudentsStore((s) => s.create);
  const push = useToastStore((s) => s.push);
  const imp = useStudentImport();
  const [tab, setTab] = useState<AddTab>(initialTab);
  const [form, setForm] = useState(EMPTY_STUDENT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Added[]>([]);

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
      const one = { id: s.id, displayName: s.displayName, email: s.email };
      setAdded((list) => [...list, one]);
      onAdded?.([one]);
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

  const reported = useRef<unknown>(null);
  useEffect(() => {
    if (!imp.result || reported.current === imp.result) return;
    reported.current = imp.result;
    onAdded?.(imp.result.added);
  }, [imp.result, onAdded]);

  const importConfirm = async () => {
    const ok = await imp.confirm();
    if (ok) push(`Đã thêm ${imp.report?.validCount ?? 0} học viên — Chưa kích hoạt.`, 'success');
  };

  const done = added.length > 0 || !!imp.result;
  const importing = tab === 'import' && !!imp.report && !imp.result;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Thêm học viên"
      size={tab === 'import' && imp.report ? 'xl' : 'lg'}
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
          {importing && imp.report && (
            <Button
              disabled={imp.report.validCount === 0}
              loading={imp.busy === 'importing'}
              onClick={() => void importConfirm()}
            >
              Nhập {imp.report.validCount} học viên hợp lệ
            </Button>
          )}
        </>
      }
    >
      <Tabs
        className="t12-tabs"
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
                {formError && (
                  <Notice tone="danger" className="t12-error">
                    {formError}
                  </Notice>
                )}
                <StudentFields value={form} onChange={setForm} errors={errors} />
                {/* Enter in a field adds the student. */}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
                <p className="t12-help">
                  Chỉ cần họ tên và email. Không có mật khẩu: khi bạn bấm “Kích hoạt”, hệ thống tạo
                  mật khẩu ngẫu nhiên và gửi email đăng nhập tới học viên.
                </p>
                {added.length > 0 && (
                  <section aria-labelledby="t12-added">
                    <h3 id="t12-added" className="t12-added-title">
                      Vừa thêm ({added.length})
                    </h3>
                    <p className="imp-muted">{M.activationHint}</p>
                    <AddedList students={added} />
                  </section>
                )}
              </form>
            ),
          },
          {
            id: 'import',
            label: 'Import Excel',
            content: <ImportTab state={imp} />,
          },
        ]}
      />
    </Dialog>
  );
}

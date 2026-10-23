import { fieldErrors, type Student, studentBodySchema } from '@sat/shared';
import { useState } from 'react';
import { Button, Dialog } from '../../components';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { useToastStore } from '../toast/toast-store';
import { studentFormOf } from './student-form';
import { StudentFields } from './StudentFields';
import { useStudentsStore } from './students-store';

/** AC-11.6: edit name, e-mail, phone and note; saving never sends an e-mail. */
export function EditStudentDialog({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const update = useStudentsStore((s) => s.update);
  const push = useToastStore((s) => s.push);
  const [form, setForm] = useState(() => studentFormOf(student));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sending = student.status === 'sending';

  const save = async () => {
    setFormError(null);
    const parsed = studentBodySchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setBusy(true);
    try {
      await update(student.id, form);
      push('Đã lưu thay đổi.', 'success');
      onSaved();
    } catch (err) {
      const f = formFailure(err);
      setErrors(f.fields);
      setFormError(f.form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Sửa thông tin học viên"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={busy} onClick={() => void save()}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {formError && <Notice tone="danger">{formError}</Notice>}
        <StudentFields value={form} onChange={setForm} errors={errors} emailReadOnly={sending} />
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        <p className="student-form__help">
          {sending
            ? 'Đang gửi email — chưa đổi được Email.'
            : 'Đổi email không tự gửi thư; các lần Gửi lại và Đặt lại mật khẩu sau đó dùng email mới.'}
        </p>
      </form>
    </Dialog>
  );
}

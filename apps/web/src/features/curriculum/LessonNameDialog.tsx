import { lessonNameSchema } from '@sat/shared';
import { type FormEvent, useState } from 'react';
import { Button, Dialog, TextField } from '../../components';

export interface LessonNameDialogProps {
  open: boolean;
  mode: 'add' | 'rename';
  initialName: string;
  onClose: () => void;
  /** Resolves when saved; a thrown error with `field` keeps the dialog open with the message. */
  onSubmit: (name: string) => Promise<void>;
}

/** "Thêm bài" (AC-5.1 … AC-5.3) and "Đổi tên" (AC-5.4) — prototype MODALS.baiName. */
export function LessonNameDialog(props: LessonNameDialogProps) {
  // Mounted only while open, so every opening starts from the given name.
  return props.open ? <LessonNameForm {...props} /> : null;
}

function LessonNameForm({ mode, initialName, onClose, onSubmit }: LessonNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const parsed = lessonNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    try {
      await onSubmit(parsed.data);
    } finally {
      setBusy(false);
    }
  };

  const formId = `lesson-name-${mode}`;
  return (
    <Dialog
      open
      onClose={onClose}
      title={mode === 'add' ? 'Thêm bài' : 'Đổi tên bài'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button type="submit" form={formId} loading={busy} disabled={busy}>
            {mode === 'add' ? 'Thêm bài' : 'Lưu'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={(e) => void submit(e)} noValidate className="cur-form">
        <TextField
          label="Tên bài"
          required
          value={name}
          maxLength={150}
          error={error}
          onChange={(e) => setName(e.target.value)}
        />
        {mode === 'add' && (
          <p className="small muted">
            Bài mới ở trạng thái Nháp, có sẵn 2 phần rỗng Bài học · Bài tập.
          </p>
        )}
      </form>
    </Dialog>
  );
}

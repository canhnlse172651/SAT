import { STUDENT_STATUS_LABELS, type StudentStatus } from '@sat/shared';
import { TextField, Textarea } from '../../components';
import type { StudentFormValue } from './student-form';
import './students.css';

interface Props {
  value: StudentFormValue;
  onChange: (value: StudentFormValue) => void;
  errors: Record<string, string>;
  /** AC-12.6: the address cannot change while an e-mail is being sent. */
  emailReadOnly?: boolean;
}

/** Họ tên, Email, Số điện thoại, Ghi chú — T12 add and the edit dialog (AC-8.5). */
export function StudentFields({ value, onChange, errors, emailReadOnly }: Props) {
  const set = (key: keyof StudentFormValue) => (e: { target: { value: string } }) =>
    onChange({ ...value, [key]: e.target.value });
  return (
    <div className="student-form">
      <TextField
        label="Họ tên"
        required
        autoComplete="off"
        maxLength={100}
        placeholder="VD: Nguyễn Văn An"
        value={value.displayName}
        onChange={set('displayName')}
        error={errors['displayName']}
      />
      <TextField
        label="Email"
        type="email"
        required
        maxLength={254}
        placeholder="ten@email.com"
        readOnly={emailReadOnly}
        value={value.email}
        onChange={set('email')}
        error={errors['email']}
      />
      <TextField
        label="Số điện thoại"
        inputMode="tel"
        placeholder="Không bắt buộc · 9–15 chữ số"
        value={value.phone}
        onChange={set('phone')}
        error={errors['phone']}
      />
      <Textarea
        label="Ghi chú"
        rows={1}
        maxLength={500}
        placeholder="Chỉ giáo viên thấy"
        value={value.note}
        onChange={set('note')}
        error={errors['note']}
      />
    </div>
  );
}

/** AC-11.1 status label. */
export function StudentStatusChip({ status }: { status: StudentStatus }) {
  return <span className={`st-chip st-chip--${status}`}>{STUDENT_STATUS_LABELS[status]}</span>;
}

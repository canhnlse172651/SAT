import { STUDENT_STATUS_LABELS, type StudentStatus } from '@sat/shared';
import { Icon, type IconName, TextField, Textarea } from '../../components';
import type { StudentFormValue } from './student-form';
import '../auth/auth.css';
import './students.css';

interface Props {
  value: StudentFormValue;
  onChange: (value: StudentFormValue) => void;
  errors: Record<string, string>;
  /** AC-12.6: the address cannot change while an e-mail is being sent. */
  emailReadOnly?: boolean;
}

/** Họ tên, Email, Số điện thoại, Ghi chú — T12 add and the edit dialog (AC-8.5), prototype grid-2. */
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

const CHIPS: Record<StudentStatus, { tone: string; icon: IconName }> = {
  pending: { tone: '', icon: 'mail' },
  sending: { tone: 'chip--info', icon: 'refresh' },
  active: { tone: 'chip--done', icon: 'check' },
  failed: { tone: 'chip--danger', icon: 'alert' },
  locked: { tone: 'chip--danger', icon: 'lock' },
};

/** AC-11.1 status label (prototype `stuChip`); `plain` drops the icon (added lists). */
export function StudentStatusChip({ status, plain }: { status: StudentStatus; plain?: boolean }) {
  const chip = CHIPS[status];
  return (
    <span className={['chip', chip.tone].filter(Boolean).join(' ')}>
      {!plain && <Icon name={chip.icon} size={14} />}
      {STUDENT_STATUS_LABELS[status]}
    </span>
  );
}

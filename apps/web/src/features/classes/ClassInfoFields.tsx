import { CLASS_LIMITS, CLASS_MESSAGES as M, dayRange, vnDay, vnDayStart } from '@sat/shared';
import { DatePicker, TextField, Textarea } from '../../components';
import type { InfoErrors } from './class-info';
import type { ClassInfo } from './class-wizard-store';

export interface ClassInfoFieldsProps {
  info: ClassInfo;
  onChange: (patch: Partial<ClassInfo>) => void;
  errors: InfoErrors;
  /** VN day used for the allowed range and the "Đang học ngay" notice. */
  today: string;
  /** "Sửa thông tin lớp" of an ended class: the start date is locked (AC-10.3). */
  startDisabled?: boolean;
  /** Show the AC-2.6 notice (wizard only). */
  startsNowNotice?: boolean;
}

/** T03 step 1 and "Sửa thông tin lớp" (AC-2.1 … AC-2.6, AC-7.3). */
export function ClassInfoFields({
  info,
  onChange,
  errors,
  today,
  startDisabled,
  startsNowNotice,
}: ClassInfoFieldsProps) {
  const [from, to] = dayRange(today);
  const startsNow = !!info.startDate && vnDay(info.startDate) <= today;
  return (
    <div className="cls-info-fields">
      <TextField
        label="Tên lớp"
        required
        value={info.name}
        maxLength={CLASS_LIMITS.nameMax + 50}
        placeholder="VD: HSK1 – Tối 3·5 (K13)"
        error={errors.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <DatePicker
        label="Ngày bắt đầu"
        required
        value={info.startDate}
        min={vnDayStart(from)}
        max={vnDayStart(to)}
        disabled={startDisabled}
        hint={startDisabled ? M.endedHint : undefined}
        error={errors.startDate}
        onChange={(startDate) => onChange({ startDate })}
      />
      {startsNowNotice && startsNow && !errors.startDate && (
        <div className="cls-callout" role="status">
          {M.startsNow}
        </div>
      )}
      <Textarea
        label="Mô tả"
        rows={2}
        value={info.description}
        maxLength={CLASS_LIMITS.descriptionMax}
        placeholder="Không bắt buộc"
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <TextField
        label="Lịch học"
        value={info.schedule}
        maxLength={CLASS_LIMITS.scheduleMax}
        placeholder="VD: Thứ 2, 4, 6 — 19:00–20:30"
        hint={`${info.schedule.length}/${CLASS_LIMITS.scheduleMax}`}
        onChange={(e) => onChange({ schedule: e.target.value })}
      />
    </div>
  );
}

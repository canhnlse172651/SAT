import {
  CLASS_MESSAGES as M,
  type ClassDetail,
  type PatchClassBody,
  vnDay,
  vnDayStart,
} from '@sat/shared';
import { useState } from 'react';
import { Button, Dialog } from '../../components';
import { ApiError } from '../../lib/api-client';
import { formFailure } from '../auth/form-errors';
import { useToastStore } from '../toast/toast-store';
import type { ClassInfo } from './class-wizard-store';
import { useClassesStore } from './classes-store';
import { type InfoErrors, validateInfo } from './class-info';
import { ClassInfoFields } from './ClassInfoFields';
import { hasCode } from './errors';

/** "Sửa thông tin lớp" (AC-7.3, AC-7.4, AC-7.5, AC-10.3): the fields and rules of T03 step 1. */
export function EditClassDialog({ detail, onClose }: { detail: ClassDetail; onClose: () => void }) {
  const push = useToastStore((s) => s.push);
  const update = useClassesStore((s) => s.update);
  const nameAvailable = useClassesStore((s) => s.nameAvailable);
  const [info, setInfo] = useState<ClassInfo>({
    name: detail.name,
    startDate: vnDayStart(detail.startDate),
    description: detail.description,
    schedule: detail.schedule,
  });
  const [errors, setErrors] = useState<InfoErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ended = detail.status === 'ended';

  const save = async () => {
    if (busy) return;
    setFormError(null);
    const start = info.startDate ? vnDay(info.startDate) : null;
    const dateChanged = start !== detail.startDate;
    // AC-7.3: the range is checked only when the start date changes.
    const found = validateInfo(info, detail.today, dateChanged);
    setErrors(found);
    if (Object.keys(found).length) return;
    const patch: PatchClassBody = { expectedVersion: detail.version };
    if (info.name.trim() !== detail.name) patch.name = info.name;
    if (dateChanged && start) patch.startDate = start;
    if (info.description.trim() !== detail.description) patch.description = info.description;
    if (info.schedule.trim() !== detail.schedule) patch.schedule = info.schedule;
    setBusy(true);
    try {
      if (patch.name && !(await nameAvailable(patch.name.trim(), detail.id))) {
        setErrors({ name: M.nameTaken });
        return;
      }
      await update(detail.id, patch);
      push(M.saved, 'success');
      onClose();
    } catch (err) {
      if (hasCode(err, 'CLASS_NAME_TAKEN')) setErrors({ name: M.nameTaken });
      else if (hasCode(err, 'ACTIVE_START_FUTURE')) setErrors({ startDate: M.activeStartFuture });
      else if (err instanceof ApiError && err.status === 409 && err.code === 'CONFLICT')
        setFormError(M.changedElsewhere);
      else {
        const f = formFailure(err);
        setErrors(f.fields as InfoErrors);
        setFormError(f.form);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Sửa thông tin lớp"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={busy} onClick={() => void save()}>
            Lưu
          </Button>
        </>
      }
    >
      {formError && (
        <p className="err-msg" role="alert">
          {formError}
        </p>
      )}
      <ClassInfoFields
        info={info}
        onChange={(patch) => setInfo((i) => ({ ...i, ...patch }))}
        errors={errors}
        today={detail.today}
        startDisabled={ended}
      />
    </Dialog>
  );
}

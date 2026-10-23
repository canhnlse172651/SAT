import {
  CLASS_MESSAGES as M,
  classNameSchema,
  dayRange,
  startDateRangeMessage,
  vnDay,
} from '@sat/shared';
import type { ClassInfo } from './class-wizard-store';

export type InfoErrors = Partial<Record<'name' | 'startDate', string>>;

/** AC-2.2, AC-2.3, AC-2.5 (the uniqueness of AC-2.4 is asked from the API by the caller). */
export function validateInfo(info: ClassInfo, today: string, checkDate = true): InfoErrors {
  const errors: InfoErrors = {};
  const name = classNameSchema.safeParse(info.name);
  if (!name.success) errors.name = name.error.issues[0]?.message ?? M.nameRequired;
  if (checkDate) {
    const [from, to] = dayRange(today);
    const day = info.startDate ? vnDay(info.startDate) : null;
    if (!day || day < from || day > to) errors.startDate = startDateRangeMessage(today);
  }
  return errors;
}

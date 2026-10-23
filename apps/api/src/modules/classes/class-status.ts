import { type ClassFilter, type ClassStatus, classStatusOf, vnDay } from '@sat/shared';
import type { Clock } from '../../common/ports/index.js';
import type { ClassDoc } from './classes.model.js';

/* AC-14.1, AC-14.2: the status is derived from the start day and the end day in Vietnam time — 00:00 of the start
   day opens the class without any job. */

export const todayOf = (clock: Clock): string => vnDay(clock.now());

export const statusOf = (c: Pick<ClassDoc, 'startDate' | 'endDate'>, today: string): ClassStatus =>
  classStatusOf({ startDate: c.startDate, endDate: c.endDate ?? null }, today);

/** The Mongo filter of a T02 status filter (AC-6.1, AC-6.2). */
export function statusFilter(filter: ClassFilter, today: string): Record<string, unknown> {
  switch (filter) {
    case 'live':
      return { endDate: null };
    case 'upcoming':
      return { endDate: null, startDate: { $gt: today } };
    case 'active':
      return { endDate: null, startDate: { $lte: today } };
    case 'ended':
      return { endDate: { $ne: null } };
    default:
      return {};
  }
}

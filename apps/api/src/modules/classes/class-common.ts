import { CLASS_ERROR_CODES as E, CLASS_MESSAGES as M, foldSearch } from '@sat/shared';
import { type Model, Types } from 'mongoose';
import { notFound } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { statusOf } from './class-status.js';
import type { ClassDoc } from './classes.model.js';

/** HV screens a refusal sends back to (AC-14.5, AC-17.5, AC-18.1). */
export const HV_PATHS = {
  s01: '/hv',
  s02: (classId: string) => `/hv/lop/${classId}`,
  s11: (classId: string, lessonId: string) => `/hv/lop/${classId}/bai/${lessonId}`,
} as const;

/** Uniqueness key of a class name: trimmed, case-insensitive (AC-2.4). */
export const nameKeyOf = (name: string): string => name.trim().toLowerCase().normalize('NFC');
export const searchKeyOf = (name: string): string => foldSearch(name);

export const isDuplicateKey = (err: unknown, field?: string): boolean => {
  const e = err as { code?: number; keyPattern?: Record<string, unknown> } | null;
  return e?.code === 11000 && (!field || !!e.keyPattern?.[field]);
};

export const nameTaken = (): AppError =>
  new AppError(409, E.CLASS_NAME_TAKEN, M.nameTaken, { step: 1, field: 'name' });

/** A class of the caller's workspace; a foreign, missing or malformed id is the uniform 404 (AC-14.6). */
export async function loadClass(
  model: Model<ClassDoc>,
  workspaceId: string,
  id: string,
): Promise<ClassDoc> {
  if (!Types.ObjectId.isValid(id)) throw notFound();
  const doc = await scoped(model, workspaceId).findById(id).lean<ClassDoc>();
  if (!doc) throw notFound();
  return doc;
}

/** AC-10.3: an ended class keeps only name, description, schedule, reopen and delete. */
export function assertNotEnded(c: Pick<ClassDoc, 'startDate' | 'endDate'>, today: string): void {
  if (statusOf(c, today) === 'ended') throw new AppError(409, E.CLASS_ENDED, M.endedHint);
}

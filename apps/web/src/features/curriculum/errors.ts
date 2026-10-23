import { CONFLICT, CURRICULUM_ERROR_CODES, NOT_FOUND } from '@sat/shared';
import { ApiError } from '../../lib/api-client';
import { NETWORK_ERROR } from '../auth/form-errors';

const KNOWN_CODES: readonly string[] = Object.values(CURRICULUM_ERROR_CODES);

/** What to tell the GV: the API's own wording for expected failures, otherwise a connection message. */
export function messageOf(err: unknown): string {
  if (!(err instanceof ApiError)) return NETWORK_ERROR;
  if (err.status < 500 || KNOWN_CODES.includes(err.code)) return err.message;
  return NETWORK_ERROR;
}

/** AC-17.4: the data changed in another tab or device. */
export const isConflict = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 409 && err.code === CONFLICT;

export const isNotFound = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 404 && err.code === NOT_FOUND;

export const hasCode = (err: unknown, code: keyof typeof CURRICULUM_ERROR_CODES): boolean =>
  err instanceof ApiError && err.code === CURRICULUM_ERROR_CODES[code];

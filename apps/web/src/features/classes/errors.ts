import { CLASS_ERROR_CODES } from '@sat/shared';
import { ApiError } from '../../lib/api-client';
import { NETWORK_ERROR } from '../auth/form-errors';

const KNOWN: readonly string[] = Object.values(CLASS_ERROR_CODES);

/** The API's own wording for expected failures, otherwise a connection message. */
export function messageOf(err: unknown, fallback = NETWORK_ERROR): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status < 500 || KNOWN.includes(err.code)) return err.message;
  return fallback;
}

export const hasCode = (err: unknown, code: keyof typeof CLASS_ERROR_CODES): boolean =>
  err instanceof ApiError && err.code === CLASS_ERROR_CODES[code];

export const detailsOf = <T>(err: unknown): Partial<T> =>
  err instanceof ApiError && err.details && typeof err.details === 'object'
    ? (err.details as Partial<T>)
    : {};

/** Where an HV refusal sends the student (AC-14.5, AC-17.5, AC-18.1). */
export const backOf = (err: unknown): string | null => {
  const back = detailsOf<{ back: string }>(err).back;
  return typeof back === 'string' ? back : null;
};

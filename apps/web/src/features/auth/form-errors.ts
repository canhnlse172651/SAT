import { ACCOUNT_ERROR_CODES, fieldErrors, VALIDATION_ERROR } from '@sat/shared';
import { ApiError } from '../../lib/api-client';

export const NETWORK_ERROR = 'Không thể kết nối tới máy chủ. Vui lòng thử lại.';

export interface FormFailure {
  /** Messages under fields (first issue per field). */
  fields: Record<string, string>;
  /** Message for the whole form (callout), when it is not about one field. */
  form: string | null;
}

/** Maps an API failure to what a form shows: field issues of a 400, `details.field`, or one message. */
export function formFailure(err: unknown): FormFailure {
  if (!(err instanceof ApiError)) return { fields: {}, form: NETWORK_ERROR };
  if (err.code === VALIDATION_ERROR && Array.isArray(err.details)) {
    return {
      fields: fieldErrors(err.details as { path: PropertyKey[]; message: string }[]),
      form: null,
    };
  }
  const field = (err.details as { field?: unknown } | undefined)?.field;
  if (typeof field === 'string') return { fields: { [field]: err.message }, form: null };
  if (err.status >= 500 || err.code === 'HTTP_ERROR') return { fields: {}, form: NETWORK_ERROR };
  return { fields: {}, form: err.message };
}

export const isCode = (err: unknown, code: keyof typeof ACCOUNT_ERROR_CODES): boolean =>
  err instanceof ApiError && err.code === ACCOUNT_ERROR_CODES[code];

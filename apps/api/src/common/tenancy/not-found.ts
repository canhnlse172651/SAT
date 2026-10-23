import { AppError } from '../../errors.js';

export const NOT_FOUND_MESSAGE = 'Không tìm thấy nội dung bạn yêu cầu.';

/** The one answer for missing, other-workspace and wrong-role targets (ADR-0006). */
export const notFound = (): AppError => new AppError(404, 'NOT_FOUND', NOT_FOUND_MESSAGE);

/** Returns `doc` or throws the uniform 404. */
export function orNotFound<T>(doc: T | null | undefined): T {
  if (doc === null || doc === undefined) throw notFound();
  return doc;
}

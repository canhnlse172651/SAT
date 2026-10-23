import { objectId } from '@sat/shared';
import { notFound } from '../../common/tenancy/not-found.js';

/** A malformed path id is answered like a missing one (ADR-0006, AC-17.2). */
export const pathId = (raw: string): string => {
  const parsed = objectId.safeParse(raw);
  if (!parsed.success) throw notFound();
  return parsed.data;
};

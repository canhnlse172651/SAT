import { z } from 'zod';

/** Public id of every document: a 24-character hex MongoDB ObjectId (ADR-0006). */
export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
export type ObjectIdString = z.infer<typeof objectId>;

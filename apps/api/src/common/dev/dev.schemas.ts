import { objectId, roleSchema } from '@sat/shared';
import { z } from 'zod';

export const devSessionBodySchema = z.object({
  role: roleSchema,
  userId: objectId.optional(),
  workspaceId: objectId.optional(),
});

/** Moves the dev clock (ms, at most ±400 days per call). */
export const devClockBodySchema = z.object({
  advanceMs: z
    .number()
    .int()
    .min(-400 * 86_400_000)
    .max(400 * 86_400_000),
});

export const devOutboxQuerySchema = z.object({
  to: z.string().min(1).max(320).optional(),
  tag: z.string().min(1).max(64).optional(),
});

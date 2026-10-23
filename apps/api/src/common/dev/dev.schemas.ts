import { objectId, roleSchema } from '@sat/shared';
import { z } from 'zod';

export const devSessionBodySchema = z.object({
  role: roleSchema,
  userId: objectId.optional(),
  workspaceId: objectId.optional(),
});

export const devOutboxQuerySchema = z.object({
  to: z.string().min(1).max(320).optional(),
  tag: z.string().min(1).max(64).optional(),
});

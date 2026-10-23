import { z } from 'zod';
import { roleSchema } from '../roles.js';

/** Response of GET /api/session. */
export const sessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    role: roleSchema,
    displayName: z.string(),
  }),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

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

/** `details.reason` of a 401 UNAUTHENTICATED (ADR-0005): no/unknown session, idle expiry or logout, locked account, too many wrong current passwords (001 AC-15.3). */
export const SESSION_FAILURE_REASONS = [
  'missing',
  'expired',
  'locked',
  'too_many_attempts',
] as const;
export const sessionFailureReasonSchema = z.enum(SESSION_FAILURE_REASONS);
export type SessionFailureReason = z.infer<typeof sessionFailureReasonSchema>;

import { z } from 'zod';

/** GV = teacher (workspace owner), HV = student. */
export const ROLES = ['GV', 'HV'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

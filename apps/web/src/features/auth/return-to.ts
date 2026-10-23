import type { Role } from '@sat/shared';
import { homePath } from '../../lib/home-path';

const AREAS: Record<Role, RegExp> = {
  GV: /^\/gv(\/|\?|$)/,
  HV: /^\/(hv|tu-hoc)(\/|\?|$)/,
};

/** AC-5.5, AC-20.8: back to the screen that asked for sign-in when the role may see it, else the role home. */
export function afterSignIn(role: Role, returnTo: string | null): string {
  if (
    returnTo &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//') &&
    AREAS[role].test(returnTo)
  ) {
    return returnTo;
  }
  return homePath(role);
}

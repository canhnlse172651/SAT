export { AuthModule } from './auth.module.js';
export { AuthGuard } from './auth.guard.js';
export { CurrentUser, Public, Roles } from './decorators.js';
export { SessionService } from './session.service.js';
export { hashPassword, needsRehash, verifyPassword } from './password.js';
export { SESSION_COOKIE, clearedSessionCookie, sessionCookie } from './cookie.js';
export {
  AUTH_OPTIONS,
  SESSION_PRINCIPAL_RESOLVER,
  type AuthOptions,
  type AuthPrincipal,
  type SessionPrincipalResolver,
} from './auth.types.js';
export type { SessionEndReason } from './session.model.js';

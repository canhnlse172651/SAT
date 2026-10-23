import type { Request } from 'express';
import type { Role, SessionFailureReason } from '@sat/shared';

/** The authenticated caller, resolved from the session on every request. */
export interface AuthPrincipal {
  sessionId: string;
  userId: string;
  role: Role;
  workspaceId: string;
}

/** Why authentication failed; sent as `details.reason` of the 401 (ADR-0005). */
export type AuthFailureReason = SessionFailureReason;

export type AuthedRequest = Request & { auth?: AuthPrincipal };

/** Injection tokens. */
export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');
export const SESSION_PRINCIPAL_RESOLVER = Symbol('SESSION_PRINCIPAL_RESOLVER');

export interface AuthOptions {
  sessionTtlGvHours: number;
  sessionTtlHvDays: number;
  cookieSecure: boolean;
  allowedOrigins: readonly string[];
}

export type PrincipalCheck = { active: true } | { active: false; reason: 'locked' | 'missing' };

/**
 * Hook point for module 001: checked on every request so a locked or deleted account is rejected
 * immediately. When no resolver is provided every principal is accepted.
 */
export interface SessionPrincipalResolver {
  check(principal: AuthPrincipal): Promise<PrincipalCheck>;
}

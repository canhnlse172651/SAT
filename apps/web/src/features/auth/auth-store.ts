import {
  fieldErrors,
  type LoginBody,
  type PasswordResetConfirmBody,
  type RegisterBody,
  resetLinkResponseSchema,
  sessionResponseSchema,
  type SessionResponse,
} from '@sat/shared';
import type { z } from 'zod';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';
import { useSessionStore } from '../session/session-store';
import { type FormFailure, formFailure } from './form-errors';

export type AuthStatus = 'idle' | 'loading' | 'ok' | 'error';

interface AuthState {
  status: AuthStatus;
  failure: FormFailure | null;
  /** Clears status and errors (a page mounts, the user edits). */
  reset: () => void;
  /** Client-side check with the shared rules: true when the body may be sent (AC-2.1). */
  check: (schema: z.ZodType, body: unknown) => boolean;
  login: (body: LoginBody) => Promise<SessionResponse | null>;
  register: (body: RegisterBody) => Promise<SessionResponse | null>;
  requestReset: (email: string) => Promise<boolean>;
  inspectReset: (token: string) => Promise<string | null>;
  confirmReset: (body: PasswordResetConfirmBody) => Promise<boolean>;
}

const post = (path: string, body: unknown) =>
  apiRequest<unknown>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    // A wrong password is an answer here, not an expired session.
    handleUnauthorized: false,
  });

/** A01–A03 requests (REQ-1, REQ-3, REQ-6). Forms keep their own input state. */
export const useAuthStore = create<AuthState>()((set) => {
  const run = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    set({ status: 'loading', failure: null });
    try {
      const result = await fn();
      set({ status: 'ok' });
      return result;
    } catch (err) {
      set({ status: 'error', failure: formFailure(err) });
      return null;
    }
  };
  const signedIn = (raw: unknown) => {
    const session = sessionResponseSchema.parse(raw);
    useSessionStore.getState().signedIn(session);
    return session;
  };

  return {
    status: 'idle',
    failure: null,
    reset: () => set({ status: 'idle', failure: null }),
    check: (schema, body) => {
      const result = schema.safeParse(body);
      if (result.success) return true;
      set({ status: 'error', failure: { fields: fieldErrors(result.error.issues), form: null } });
      return false;
    },
    login: (body) => run(async () => signedIn(await post('/auth/login', body))),
    register: (body) => run(async () => signedIn(await post('/auth/register', body))),
    requestReset: async (email) =>
      (await run(async () => {
        await post('/auth/password-reset', { email });
        return true;
      })) === true,
    inspectReset: async (token) => {
      const raw = await run(() =>
        apiRequest<unknown>(`/auth/password-reset/${encodeURIComponent(token)}`),
      );
      return raw ? resetLinkResponseSchema.parse(raw).email : null;
    },
    confirmReset: async (body) =>
      (await run(async () => {
        await post('/auth/password-reset/confirm', body);
        return true;
      })) === true,
  };
});

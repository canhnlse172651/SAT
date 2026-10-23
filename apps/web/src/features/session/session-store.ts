import {
  type SessionFailureReason,
  sessionResponseSchema,
  type SessionResponse,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest, sessionFailureReason } from '../../lib/api-client';

export type SessionStatus = 'idle' | 'loading' | 'ok' | 'error';

interface SessionState {
  status: SessionStatus;
  user: SessionResponse['user'] | null;
  workspace: SessionResponse['workspace'] | null;
  /** Why the last session ended (401 `details.reason`); A01 turns it into a notice (001 AC-5.4, AC-12.3, AC-15.3). */
  reason: SessionFailureReason | null;
  load: () => Promise<void>;
  /** Signed in (A01/A02): store who it is without another request. */
  signedIn: (session: SessionResponse) => void;
  clear: (reason?: SessionFailureReason | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'idle',
  user: null,
  workspace: null,
  reason: null,
  load: async () => {
    set({ status: 'loading' });
    try {
      const raw = await apiRequest<unknown>('/session', { handleUnauthorized: false });
      const { user, workspace } = sessionResponseSchema.parse(raw);
      set({ status: 'ok', user, workspace, reason: null });
    } catch (err) {
      // Not signed in (401) and transport failures both lead the guard to the login screen.
      set({ status: 'error', user: null, workspace: null, reason: sessionFailureReason(err) });
    }
  },
  signedIn: ({ user, workspace }) => set({ status: 'ok', user, workspace, reason: null }),
  // Signed out / session expired: 'error' (not 'idle') so the guard redirects instead of reloading.
  clear: (reason = null) => set({ status: 'error', user: null, workspace: null, reason }),
}));

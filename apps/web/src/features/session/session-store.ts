import { sessionResponseSchema, type SessionResponse } from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';

export type SessionStatus = 'idle' | 'loading' | 'ok' | 'error';

interface SessionState {
  status: SessionStatus;
  user: SessionResponse['user'] | null;
  workspace: SessionResponse['workspace'] | null;
  load: () => Promise<void>;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'idle',
  user: null,
  workspace: null,
  load: async () => {
    set({ status: 'loading' });
    try {
      const raw = await apiRequest<unknown>('/session', { handleUnauthorized: false });
      const { user, workspace } = sessionResponseSchema.parse(raw);
      set({ status: 'ok', user, workspace });
    } catch {
      // Not signed in (401) and transport failures both lead the guard to the login screen.
      set({ status: 'error', user: null, workspace: null });
    }
  },
  // Signed out / session expired: 'error' (not 'idle') so the guard redirects instead of reloading.
  clear: () => set({ status: 'error', user: null, workspace: null }),
}));

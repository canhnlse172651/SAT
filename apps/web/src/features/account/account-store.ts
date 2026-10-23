import {
  type AccountResponse,
  accountResponseSchema,
  type ChangeEmailBody,
  type ChangePasswordBody,
} from '@sat/shared';
import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';
import { useSessionStore } from '../session/session-store';

export type AccountStatus = 'idle' | 'loading' | 'ok' | 'error';

interface AccountState {
  status: AccountStatus;
  account: AccountResponse | null;
  load: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  changeEmail: (body: ChangeEmailBody) => Promise<void>;
  changePassword: (body: ChangePasswordBody) => Promise<void>;
}

const send = (method: string, path: string, body: unknown) =>
  apiRequest<unknown>(path, { method, body: JSON.stringify(body) });

/** T17 and the 001 part of S10 (REQ-14, REQ-15). Errors are thrown to the form that asked. */
export const useAccountStore = create<AccountState>()((set) => {
  const apply = async (raw: unknown) => {
    set({ status: 'ok', account: accountResponseSchema.parse(raw) });
    // The shell shows the name and workspace from the session.
    await useSessionStore.getState().load();
  };
  return {
    status: 'idle',
    account: null,
    load: async () => {
      set({ status: 'loading' });
      try {
        set({
          status: 'ok',
          account: accountResponseSchema.parse(await apiRequest<unknown>('/account')),
        });
      } catch {
        set({ status: 'error' });
      }
    },
    updateProfile: async (displayName) =>
      apply(await send('PATCH', '/account/profile', { displayName })),
    changeEmail: async (body) => apply(await send('POST', '/account/email', body)),
    changePassword: async (body) => {
      await send('POST', '/account/password', body);
      set((s) => ({
        account: s.account
          ? { ...s.account, passwordSource: s.account.passwordSource && 'user' }
          : null,
      }));
    },
  };
});

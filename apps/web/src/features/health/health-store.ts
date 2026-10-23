import { create } from 'zustand';
import { apiRequest } from '../../lib/api-client';

export type HealthStatusValue = 'idle' | 'loading' | 'ok' | 'error';

interface HealthState {
  status: HealthStatusValue;
  error: string | null;
  check: () => Promise<void>;
}

export const useHealthStore = create<HealthState>()((set) => ({
  status: 'idle',
  error: null,
  check: async () => {
    set({ status: 'loading', error: null });
    try {
      await apiRequest<{ status: string }>('/health');
      set({ status: 'ok' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },
}));

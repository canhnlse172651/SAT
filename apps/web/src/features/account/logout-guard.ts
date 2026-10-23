import { create } from 'zustand';

interface LogoutGuardState {
  /** Vocabulary review results on this device not saved yet (module 012 sets it — 012 AC-18.6). */
  unsavedReviews: number;
  setUnsavedReviews: (count: number) => void;
}

/** AC-20.9: what "Đăng xuất" must warn about before ending the session. */
export const useLogoutGuardStore = create<LogoutGuardState>()((set) => ({
  unsavedReviews: 0,
  setUnsavedReviews: (count) => set({ unsavedReviews: Math.max(0, Math.trunc(count)) }),
}));

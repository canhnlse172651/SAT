import { create } from 'zustand';
import type { ToastData, ToastKind } from '../../components';

export type { ToastKind };

interface ToastState {
  toasts: ToastData[];
  push: (message: string, kind?: ToastKind) => string;
  dismiss: (id: string) => void;
}

/** Prototype `toast()`: gone after 2.8 s, at most 2 on screen; warnings and errors stay a little longer. */
export const TOAST_MS: Record<ToastKind, number> = {
  success: 2800,
  info: 2800,
  warn: 5000,
  error: 5000,
};
const MAX_VISIBLE = 2;

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, kind = 'info') => {
    const id = String(nextId++);
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }].slice(-MAX_VISIBLE) }));
    setTimeout(() => get().dismiss(id), TOAST_MS[kind]);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

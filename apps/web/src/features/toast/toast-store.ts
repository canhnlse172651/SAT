import { create } from 'zustand';
import type { ToastData, ToastKind } from '../../components';

export type { ToastKind };

interface ToastState {
  toasts: ToastData[];
  push: (message: string, kind?: ToastKind) => string;
  dismiss: (id: string) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, kind = 'info') => {
    const id = String(nextId++);
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

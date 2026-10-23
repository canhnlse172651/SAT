import type { ComponentType } from 'react';

/** Built screens, by id; each loads its feature page lazily (the rest show PlaceholderPage). */
export const SCREEN_PAGES: Record<string, () => Promise<ComponentType>> = {
  A01: async () => (await import('../features/auth/LoginPage')).LoginPage,
  A02: async () => (await import('../features/auth/RegisterPage')).RegisterPage,
  A03: async () => (await import('../features/auth/ForgotPasswordPage')).ForgotPasswordPage,
};

import type { ComponentType } from 'react';

/** Built screens, by id; each loads its feature page lazily (the rest show PlaceholderPage). */
export const SCREEN_PAGES: Record<string, () => Promise<ComponentType>> = {
  A01: async () => (await import('../features/auth/LoginPage')).LoginPage,
  A02: async () => (await import('../features/auth/RegisterPage')).RegisterPage,
  A03: async () => (await import('../features/auth/ForgotPasswordPage')).ForgotPasswordPage,
  T05: async () => (await import('../features/curriculum/CurriculaPage')).CurriculaPage,
  T06: async () => (await import('../features/curriculum/CurriculumPage')).CurriculumPage,
  // T07 and T09 are the two tabs of one editor (002 AC-7.12); 004 / 005 fill the tabs.
  T07: async () => (await import('../features/curriculum/ManualEditorPage')).LessonTabPage,
  T09: async () => (await import('../features/curriculum/ManualEditorPage')).ExerciseTabPage,
  T18: async () => (await import('../features/curriculum/LessonPage')).LessonPage,
  T21: async () => (await import('../features/curriculum/PreviewPage')).PreviewPage,
  T11: async () => (await import('../features/students/StudentsPage')).StudentsPage,
  T17: async () => (await import('../features/account/AccountPage')).AccountPage,
  // S10 belongs to 011; until then it shows the 001 part (password, sign-out).
  S10: async () => (await import('../features/account/StudentAccountPage')).StudentAccountPage,
};

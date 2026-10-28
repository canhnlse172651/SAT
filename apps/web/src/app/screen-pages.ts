import type { ComponentType } from 'react';

/** Built screens, by id; each loads its feature page lazily (the rest show PlaceholderPage). */
export const SCREEN_PAGES: Record<string, () => Promise<ComponentType>> = {
  A01: async () => (await import('../features/auth/LoginPage')).LoginPage,
  A02: async () => (await import('../features/auth/RegisterPage')).RegisterPage,
  A03: async () => (await import('../features/auth/ForgotPasswordPage')).ForgotPasswordPage,
  T02: async () => (await import('../features/classes/ClassesPage')).ClassesPage,
  T03: async () => (await import('../features/classes/CreateClassPage')).CreateClassPage,
  T04: async () => (await import('../features/classes/ClassPage')).ClassPage,
  T05: async () => (await import('../features/curriculum/CurriculaPage')).CurriculaPage,
  T06: async () => (await import('../features/curriculum/CurriculumPage')).CurriculumPage,
  // T07 and T09 are the two tabs of one editor (002 AC-7.12); 004 / 005 fill the tabs.
  T07: async () => (await import('../features/curriculum/ManualEditorPage')).LessonTabPage,
  T09: async () => (await import('../features/curriculum/ManualEditorPage')).ExerciseTabPage,
  // T08 (004) is the deck dialog over T07's Bài học tab; its own path opens that tab.
  T08: async () => (await import('../features/curriculum/ManualEditorPage')).LessonTabPage,
  T10: async () => (await import('../features/exams/ExamsPage')).ExamsPage,
  T14: async () => (await import('../features/exercises/SubmissionPage')).SubmissionPage,
  T16: async () => (await import('../features/exams/ExamResultsPage')).ExamResultsPage,
  T22: async () => (await import('../features/exams/ExamEditorPage')).ExamEditorPage,
  T18: async () => (await import('../features/curriculum/LessonPage')).LessonPage,
  T21: async () => (await import('../features/curriculum/PreviewPage')).PreviewPage,
  T11: async () => (await import('../features/students/StudentsPage')).StudentsPage,
  T17: async () => (await import('../features/account/AccountPage')).AccountPage,
  S01: async () => (await import('../features/classes/MyClassesPage')).MyClassesPage,
  S02: async () => (await import('../features/classes/ClassHomePage')).ClassHomePage,
  S11: async () => (await import('../features/classes/LessonUnitPage')).LessonUnitPage,
  S03: async () => (await import('../features/steps/StepViewPage')).StepViewPage,
  S04: async () => (await import('../features/steps/FlashcardsPage')).FlashcardsPage,
  S05: async () => (await import('../features/exercises/ExercisePage')).ExercisePage,
  S06: async () => (await import('../features/exercises/ReviewPage')).ReviewPage,
  S07: async () => (await import('../features/exams/MyExamsPage')).MyExamsPage,
  S08: async () => (await import('../features/exams/ExamTakePage')).ExamTakePage,
  // S10 belongs to 011; until then it shows the 001 part (password, sign-out).
  S10: async () => (await import('../features/account/StudentAccountPage')).StudentAccountPage,
};

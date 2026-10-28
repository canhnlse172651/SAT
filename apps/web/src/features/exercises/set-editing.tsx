import {
  type ExerciseProblem,
  type ExerciseSetContent,
  type Question,
  setContentSchema,
} from '@sat/shared';
import { createContext, useContext } from 'react';

/** What every question editor of one set needs: field errors (after the GV left the field) and the lock (AC-18.1). */
export interface SetEditing {
  /** The message of an invalid field the GV has left (AC-2.4, AC-2.6), or undefined. */
  error: (path: string) => string | undefined;
  /** Structure locked by submissions: no add / remove / reorder / points / kind changes (AC-18.1). */
  locked: boolean;
}

export const SetEditingContext = createContext<SetEditing>({
  error: () => undefined,
  locked: false,
});
export const useSetEditing = (): SetEditing => useContext(SetEditingContext);

/**
 * The working copy of a set. Saved content is parsed (legacy sets upgraded); an edited copy is used as it is, because it
 * may hold values a save would refuse (e.g. points being typed, AC-2.4).
 */
export function setOf(content: unknown): ExerciseSetContent {
  const parsed = setContentSchema.safeParse(content);
  if (parsed.success) return parsed.data;
  const raw = content as Partial<ExerciseSetContent> | null;
  return Array.isArray(raw?.questions)
    ? { instructions: raw.instructions ?? '', stepId: raw.stepId ?? null, questions: raw.questions }
    : { instructions: '', stepId: null, questions: [] };
}

/** Field rules shown at the field (incomplete content is listed on the question instead, AC-2.7). */
export const invalidAt = (problems: readonly ExerciseProblem[]): Map<string, string> => {
  const out = new Map<string, string>();
  for (const p of problems)
    if (p.kind === 'invalid' && !out.has(p.path)) out.set(p.path, p.message);
  return out;
};

/** Focuses the field of `path` inside the set's block (AC-12.14). */
export function focusField(itemId: string, path: string): void {
  const root = document.querySelector(`[data-item="${itemId}"]`);
  const el = root?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`);
  el?.scrollIntoView({ block: 'center' });
  el?.focus();
}

/** Scrolls to the first question with a publish issue (AC-12.6). */
export function scrollToQuestion(itemId: string, n: string): void {
  const root = document.querySelector(`[data-item="${itemId}"]`);
  root
    ?.querySelector(`[data-question="${CSS.escape(n.split('.')[0] ?? n)}"]`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export type QuestionPatch = (q: Question) => Question;

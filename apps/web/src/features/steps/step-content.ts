import {
  type Block,
  type FieldProblem,
  type StepContent,
  newBlockId,
  stepContentSchema,
} from '@sat/shared';
import { useLessonEditorStore, workingItem } from '../curriculum/lesson-editor-store';

/** The step content of a working copy (an unreadable one shows as an empty step). */
export function stepOf(content: unknown): StepContent {
  const parsed = stepContentSchema.safeParse(content);
  return parsed.success ? parsed.data : { goal: '', blocks: [] };
}

/** Field problems by path, for the message under each control. */
export const problemMap = (problems: readonly FieldProblem[]): Map<string, FieldProblem> => {
  const out = new Map<string, FieldProblem>();
  for (const p of problems) if (!out.has(p.path)) out.set(p.path, p);
  return out;
};

/** "Chưa hoàn chỉnh: …" for a required field, the message itself for an invalid value (AC-4.4, AC-11.4). */
export const problemText = (p: FieldProblem | undefined): string | undefined =>
  p ? (p.kind === 'incomplete' ? `Chưa hoàn chỉnh: ${p.message}` : p.message) : undefined;

export const move = <T>(list: readonly T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it as T);
  return next;
};

export const replaceAt = <T>(list: readonly T[], at: number, value: T): T[] =>
  list.map((x, i) => (i === at ? value : x));

/**
 * Applies `fn` to the step's *current* working copy — for results that arrive later (finished uploads) and must not
 * overwrite edits made in the meantime. Does nothing when the step is gone.
 */
export function patchStep(itemId: string, fn: (content: StepContent) => StepContent): void {
  const { lesson, drafts, edit } = useLessonEditorStore.getState();
  const item = lesson?.items.find((i) => i.id === itemId);
  if (!item) return;
  const w = workingItem(item, drafts);
  edit(itemId, { title: w.title, content: fn(stepOf(w.content)) });
}

/** Updates one block (by id) of the current working copy. */
export const patchBlock = (itemId: string, blockId: string, fn: (b: Block) => Block): void =>
  patchStep(itemId, (c) => ({
    ...c,
    blocks: c.blocks.map((b) => (b.id === blockId ? fn(b) : b)),
  }));

/** A copy of a block with fresh ids (blocks and cards), used when a list of words becomes a deck. */
export const withFreshId = <B extends Block>(b: B): B => ({ ...b, id: newBlockId() });

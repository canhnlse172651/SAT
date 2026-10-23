import type {
  AiLabel,
  CurriculumCard,
  CurriculumDetail,
  Item,
  LearnItem,
  Lesson,
  LessonRow,
  Section,
} from '@sat/shared';
import { itemNotReadyReason } from '@sat/shared';
import { Logger } from '@nestjs/common';
import type { CurriculumDoc, ItemDoc, LessonDoc } from './curriculum.model.js';

export const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);
export const coverUrl = (c: Pick<CurriculumDoc, 'coverFileId'>): string | null =>
  c.coverFileId ? `/api/files/${String(c.coverFileId)}` : null;

export const sectionItems = (l: Pick<LessonDoc, 'items'>, section: Section): ItemDoc[] =>
  l.items.filter((i) => i.section === section);

export function itemDto(it: ItemDoc, withData: ReadonlySet<string>): Item {
  return {
    id: String(it._id),
    section: it.section,
    title: it.title,
    status: it.status,
    ai: it.ai,
    content: it.content,
    version: it.version,
    updatedAt: it.updatedAt.toISOString(),
    notReady: itemNotReadyReason(it.section, it.title, it.content),
    hasLearningData: withData.has(String(it._id)),
  };
}

export function lessonRowDto(
  l: LessonDoc,
  ai: AiLabel | null,
  withData: ReadonlySet<string>,
): LessonRow {
  return {
    id: String(l._id),
    name: l.name,
    status: l.status,
    stepCount: sectionItems(l, 'lesson').length,
    setCount: sectionItems(l, 'exercise').length,
    draftCount: l.items.filter((i) => i.status === 'draft').length,
    publishedItemCount: l.items.filter((i) => i.status === 'published').length,
    hasLearningData: l.items.some((i) => withData.has(String(i._id))),
    ai,
    updatedAt: l.updatedAt.toISOString(),
    version: l.version,
  };
}

export function cardDto(
  c: CurriculumDoc,
  counts: { lessons: number; published: number },
  usedBy: number,
): CurriculumCard {
  return {
    id: String(c._id),
    name: c.name,
    hsk: c.hsk,
    description: c.description,
    coverUrl: coverUrl(c),
    archived: !!c.archivedAt,
    lessonCount: counts.lessons,
    publishedLessonCount: counts.published,
    usedBy,
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function detailDto(
  c: CurriculumDoc,
  lessons: LessonRow[],
  usedBy: number,
): CurriculumDetail {
  return {
    ...cardDto(
      c,
      {
        lessons: lessons.length,
        published: lessons.filter((l) => l.status === 'published').length,
      },
      usedBy,
    ),
    version: c.version,
    coverFileId: c.coverFileId ? String(c.coverFileId) : null,
    lessons,
  };
}

export function lessonDto(
  l: LessonDoc,
  ctx: {
    curriculum: Pick<CurriculumDoc, 'name' | 'lessonIds'>;
    usedBy: number;
    ai: AiLabel | null;
    withData: ReadonlySet<string>;
  },
): Lesson {
  const ids = ctx.curriculum.lessonIds.map(String);
  return {
    id: String(l._id),
    curriculumId: String(l.curriculumId),
    curriculumName: ctx.curriculum.name,
    name: l.name,
    status: l.status,
    version: l.version,
    position: ids.indexOf(String(l._id)) + 1,
    lessonCount: ids.length,
    usedBy: ctx.usedBy,
    items: l.items.map((i) => itemDto(i, ctx.withData)),
    ai: ctx.ai,
    hasLearningData: l.items.some((i) => ctx.withData.has(String(i._id))),
    updatedAt: l.updatedAt.toISOString(),
    sectionUpdatedAt: {
      lesson: iso(l.sectionUpdatedAt?.lesson),
      exercise: iso(l.sectionUpdatedAt?.exercise),
    },
  };
}

/** What an HV gets: never the AI mark (AC-11.7) nor the correct answers. */
export function learnItemDto(it: ItemDoc): LearnItem {
  let content = it.content;
  if (it.section === 'exercise' && content && typeof content === 'object') {
    const questions = (content as { questions?: Record<string, unknown>[] }).questions ?? [];
    content = { questions: questions.map(({ answer: _answer, ...q }) => q) };
  }
  return { id: String(it._id), section: it.section, title: it.title, content };
}

/* ---------- NFR-7: one structured line per mutation, ids and counts only ---------- */

const logger = new Logger('Curriculum');

export interface ActionLog {
  action: string;
  result?: 'ok' | 'denied' | 'failed';
  actorId: string;
  curriculumId?: string | undefined;
  lessonId?: string | undefined;
  itemId?: string | undefined;
  [count: string]: unknown;
}

export function logAction({ result = 'ok', ...entry }: ActionLog): void {
  logger.log({ msg: 'curriculum', result, ...entry });
}

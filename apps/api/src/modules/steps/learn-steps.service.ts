import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CLASS_ERROR_CODES,
  type Block,
  type CardMark,
  type FileRef,
  type LearnStep,
  type MarkBody,
  STEP_ERROR_CODES as E,
  STEP_MESSAGES as SM,
  type StepContent,
  notStartedMessage,
  stepContentSchema,
  stepFileIds,
} from '@sat/shared';
import { type Model, Types } from 'mongoose';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { CLOCK, type Clock } from '../../common/ports/clock.js';
import { NOT_FOUND_MESSAGE } from '../../common/tenancy/not-found.js';
import { scoped } from '../../common/tenancy/scoped.js';
import { AppError } from '../../errors.js';
import { ClassAccess, type ItemInClass } from '../classes/class-access.js';
import { HV_PATHS } from '../classes/class-common.js';
import { visibleUnit } from '../classes/class-visibility.js';
import { LearnClassesService } from '../classes/learn-classes.service.js';
import { StepFilesService } from './step-files.service.js';
import { CARD_MARK_MODEL, type CardMarkDoc } from './steps.model.js';
import { STEP_PRACTICE, type StepPractice } from './steps.ports.js';

/** Signed file links of S03 / S04 expire after 60 minutes (NFR-6). */
const LINK_TTL_MS = 60 * 60_000;
/** Per-process key: links are only meant to live while the page is open. */
const LINK_KEY = randomBytes(32);

const ddmmyyyy = (day: string) => day.split('-').reverse().join('/');

/** A direct link to something the HV may not open: A05, one answer whatever the reason (AC-13.4). */
const notVisible = (classId: string) =>
  new AppError(404, 'NOT_FOUND', NOT_FOUND_MESSAGE, { back: HV_PATHS.s02(classId) });
/** The next action on an open S03 / S04 after the step became unavailable (AC-13.5). */
const unavailable = (back: string) =>
  new AppError(409, E.STEP_UNAVAILABLE, SM.unavailable, { back });

const contentOf = (raw: unknown): StepContent => {
  const parsed = stepContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : { goal: '', blocks: [] };
};

export interface SignedFile {
  exp: number;
  sig: string;
}

/** S03 / S04 for an HV (REQ-13, REQ-14, REQ-16): the access rules of 003, nothing about viewing is recorded (AC-14.8). */
@Injectable()
export class LearnStepsService {
  constructor(
    @InjectModel(CARD_MARK_MODEL) private readonly marks: Model<CardMarkDoc>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(STEP_PRACTICE) private readonly practice: StepPractice,
    private readonly access: ClassAccess,
    private readonly learn: LearnClassesService,
    private readonly files: StepFilesService,
  ) {}

  /**
   * The step if the HV may open it now (AC-13.2). `continuing` = an action of an open S03 / S04 (AC-13.5); `lessonHint`
   * = the Bài that screen showed, to send the HV back to it when it is still visible.
   */
  private async open(
    p: AuthPrincipal,
    classId: string,
    stepId: string,
    continuing: boolean,
    lessonHint?: string,
  ): Promise<ItemInClass> {
    let found: ItemInClass | null;
    try {
      found = await this.access.item(p, classId, stepId);
    } catch (err) {
      if (err instanceof AppError && err.code === CLASS_ERROR_CODES.CLASS_NOT_STARTED) {
        const view = await this.access.view(p, classId);
        throw new AppError(409, err.code, notStartedMessage(ddmmyyyy(view.cls.startDate)), {
          back: HV_PATHS.s02(classId),
        });
      }
      if (
        continuing &&
        err instanceof AppError &&
        err.code === CLASS_ERROR_CODES.CLASS_NOT_MEMBER
      ) {
        throw unavailable(HV_PATHS.s01);
      }
      throw err;
    }
    if (found && found.item.section === 'lesson' && found.visible) return found;
    if (!continuing) throw notVisible(classId);
    if (found) throw unavailable(this.access.backOf(found));
    // The step is gone (deleted or replaced): back to its Bài when that is still visible.
    if (lessonHint) {
      const view = await this.access.started(p, classId);
      const lesson = (await this.access.lessons(p.workspaceId, view.cls)).find(
        (l) => String(l._id) === lessonHint,
      );
      if (lesson && visibleUnit(view.cls, lesson)?.steps.length)
        throw unavailable(HV_PATHS.s11(classId, lessonHint));
    }
    throw unavailable(HV_PATHS.s02(classId));
  }

  private signature(
    p: AuthPrincipal,
    classId: string,
    stepId: string,
    fileId: string,
    exp: number,
  ) {
    return createHmac('sha256', LINK_KEY)
      .update(`${p.userId}|${classId}|${stepId}|${fileId}|${exp}`)
      .digest('base64url');
  }

  private sign(
    p: AuthPrincipal,
    classId: string,
    stepId: string,
    ref: FileRef | null,
  ): FileRef | null {
    if (!ref) return null;
    const exp = this.clock.now().getTime() + LINK_TTL_MS;
    const sig = this.signature(p, classId, stepId, ref.id, exp);
    return {
      ...ref,
      url: `/api/learn/classes/${classId}/steps/${stepId}/files/${ref.id}?exp=${exp}&sig=${sig}`,
    };
  }

  /** AC-13.2 … AC-13.8, AC-14.1, AC-14.7, AC-10.3, AC-16.1. */
  async view(
    p: AuthPrincipal,
    classId: string,
    stepId: string,
    continuing: boolean,
    lessonHint?: string,
    from?: string,
  ): Promise<LearnStep> {
    // "Trước" / "Tiếp" is an action on the step being viewed: it is refused once that step is no longer open (AC-13.5).
    if (from && from !== stepId) await this.open(p, classId, from, true, lessonHint);
    const found = await this.open(p, classId, stepId, continuing, lessonHint);
    const steps = found.unit?.steps ?? [];
    const at = steps.findIndex((s) => s._id.equals(found.item._id));
    const neighbour = (i: number) => {
      const s = steps[i];
      return s ? { id: String(s._id), title: s.title } : null;
    };
    const content = contentOf(found.item.content);
    const sign = (ref: FileRef | null) => this.sign(p, classId, stepId, ref);
    const blocks: Block[] = content.blocks.map((b) => {
      switch (b.type) {
        case 'deck':
          return {
            ...b,
            cards: b.cards.map((c) => ({ ...c, image: sign(c.image), audio: sign(c.audio) })),
          };
        case 'document':
        case 'video':
        case 'image':
        case 'audio':
          return { ...b, file: sign(b.file) };
        default:
          return b;
      }
    });

    const lessonId = String(found.lesson._id);
    const [links, unit, marks] = await Promise.all([
      this.practice.setsOf(p.workspaceId, [stepId]),
      this.learn.lesson(p, classId, lessonId),
      scoped(this.marks, p.workspaceId)
        .find({ studentId: new Types.ObjectId(p.userId), stepId: found.item._id })
        .lean<CardMarkDoc[]>(),
    ]);
    const linked = new Set(links.get(stepId) ?? []);
    const cardIds = new Set(
      content.blocks.flatMap((b) => (b.type === 'deck' ? b.cards.map((c) => c.id) : [])),
    );
    return {
      classId,
      lesson: { id: lessonId, name: found.lesson.name },
      step: { id: stepId, title: found.item.title, goal: content.goal, blocks },
      position: at + 1,
      total: steps.length,
      prev: neighbour(at - 1),
      next: neighbour(at + 1),
      // Visible sets only, in the order of the Bài tập section (AC-10.3).
      practice: unit.sets
        .filter((s) => linked.has(s.id))
        .map((s) => ({
          id: s.id,
          title: s.title,
          state: s.status === 'done' ? 'done' : s.status === 'closed' ? 'closed' : 'open',
        })),
      marks: Object.fromEntries(
        marks.filter((m) => cardIds.has(m.cardId)).map((m) => [m.cardId, m.mark]),
      ) as Record<string, CardMark>,
    };
  }

  /** AC-16.5: one mark per student, step and card (overwritten), shared by every class; AC-13.5 on the way. */
  async mark(p: AuthPrincipal, body: MarkBody, lessonHint?: string): Promise<void> {
    const found = await this.open(p, body.classId, body.stepId, true, lessonHint);
    const deck = contentOf(found.item.content).blocks.find(
      (b) => b.type === 'deck' && b.id === body.deckId,
    );
    // A card the GV removed meanwhile is not recorded (the HV keeps the version they opened — AC-13.6).
    if (deck?.type !== 'deck' || !deck.cards.some((c) => c.id === body.cardId)) return;
    // An upsert (one document per student + step + card, NFR-4): `scoped()` has none, so the filter carries
    // `workspaceId` itself — the inserted document gets it from the filter.
    await this.marks.updateOne(
      {
        workspaceId: new Types.ObjectId(p.workspaceId),
        studentId: new Types.ObjectId(p.userId),
        stepId: found.item._id,
        cardId: body.cardId,
      },
      { $set: { mark: body.mark, deckId: body.deckId } },
      { upsert: true },
    );
  }

  /**
   * A signed file link of a step (NFR-6): valid signature for this HV, not expired, the step still open to them and the
   * file still part of it. Anything else is the uniform 404.
   */
  async file(
    p: AuthPrincipal,
    classId: string,
    stepId: string,
    fileId: string,
    signed: SignedFile,
  ): Promise<void> {
    const expected = Buffer.from(this.signature(p, classId, stepId, fileId, signed.exp));
    const given = Buffer.from(signed.sig);
    if (
      expected.length !== given.length ||
      !timingSafeEqual(expected, given) ||
      signed.exp < this.clock.now().getTime()
    ) {
      throw notVisible(classId);
    }
    let found: ItemInClass;
    try {
      found = await this.open(p, classId, stepId, true);
    } catch {
      throw notVisible(classId);
    }
    if (!stepFileIds(contentOf(found.item.content)).includes(fileId)) throw notVisible(classId);
  }

  /** Text pages of a DOCX / PPTX for the inline viewer (AC-14.5). */
  async preview(p: AuthPrincipal, fileId: string): Promise<string[][]> {
    return (await this.files.preview(p.workspaceId, fileId)) ?? [];
  }
}

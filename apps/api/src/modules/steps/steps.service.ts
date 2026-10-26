import { Inject, Injectable } from '@nestjs/common';
import type { PracticeSet, StepsInfo } from '@sat/shared';
import type { AuthPrincipal } from '../../common/auth/auth.types.js';
import { ClassAccess } from '../classes/class-access.js';
import { LessonsService } from '../curriculum/lessons.service.js';
import { StepFilesService } from './step-files.service.js';
import { STEP_PRACTICE, type StepPractice } from './steps.ports.js';

/** T07 side data of a Bài (GV): who sees its published steps, storage, practice sets per step. */
@Injectable()
export class StepsService {
  constructor(
    @Inject(STEP_PRACTICE) private readonly practice: StepPractice,
    private readonly lessons: LessonsService,
    private readonly files: StepFilesService,
    private readonly access: ClassAccess,
  ) {}

  /** AC-5.5, AC-7.4, AC-8.1 (N), AC-10.1, AC-10.2 (sets that no longer exist are simply absent). */
  async info(p: AuthPrincipal, lessonId: string): Promise<StepsInfo> {
    const { lesson, curriculum } = await this.lessons.load(p, lessonId);
    const steps = lesson.items.filter((i) => i.section === 'lesson');
    const sets = lesson.items.filter((i) => i.section === 'exercise');
    const links = await this.practice.setsOf(
      p.workspaceId,
      steps.map((s) => String(s._id)),
    );
    const practice: Record<string, PracticeSet[]> = {};
    for (const step of steps) {
      const ids = new Set(links.get(String(step._id)) ?? []);
      practice[String(step._id)] = sets
        .filter((s) => ids.has(String(s._id)))
        .map((s) => ({ id: String(s._id), title: s.title, status: s.status }));
    }
    const [audience, storage] = await Promise.all([
      this.access.stepsAudience(p.workspaceId, String(curriculum._id), lessonId),
      this.files.usage(p.workspaceId),
    ]);
    return { audience, storage, practice };
  }
}

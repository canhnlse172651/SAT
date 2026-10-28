import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CLASS_LEARNING, type ClassLearning, DevClassLearning } from '../classes/classes.ports.js';
import {
  DevCurriculumLinks,
  LEARNING_DATA,
  type LearningData,
  SET_HOOKS,
} from '../curriculum/curriculum.ports.js';
import { DevStepPractice, STEP_PRACTICE, type StepPractice } from '../steps/steps.ports.js';
import {
  ExerciseLinks,
  mergedClassLearning,
  mergedLearningData,
  mergedStepPractice,
} from './exercise-links.js';
import { ATTEMPT_MODEL, attemptSchema } from './exercises.model.js';
import { SetHooksService } from './set-hooks.service.js';

export interface ExercisesModuleOptions {
  /** The curriculum module (002) instance: sets live in its Bài. */
  curriculum: DynamicModule;
  /** Outside production the 002–004 QA stand-ins (`dev_*` collections) count next to real attempts and links. */
  devHelpers: boolean;
}

/**
 * Module 005 — exercise sets' content, attempts, grading, S05 / S06 / T14. Global because it binds ports other modules
 * read: `LEARNING_DATA` and `SET_HOOKS` (002), `CLASS_LEARNING` (003, also behind 001's `STUDENT_LINKS`) and
 * `STEP_PRACTICE` (004).
 */
@Global()
@Module({})
export class ExercisesModule {
  static forRoot(options: ExercisesModuleOptions): DynamicModule {
    const merge =
      <T>(merged: (real: T, dev: T) => T) =>
      (real: T, dev: T): T =>
        options.devHelpers ? merged(real, dev) : real;
    return {
      module: ExercisesModule,
      imports: [
        options.curriculum,
        MongooseModule.forFeature([{ name: ATTEMPT_MODEL, schema: attemptSchema }]),
      ],
      providers: [
        ExerciseLinks,
        DevCurriculumLinks,
        DevClassLearning,
        DevStepPractice,
        {
          provide: LEARNING_DATA,
          useFactory: merge<LearningData>(mergedLearningData),
          inject: [ExerciseLinks, DevCurriculumLinks],
        },
        {
          provide: CLASS_LEARNING,
          useFactory: merge<ClassLearning>(mergedClassLearning),
          inject: [ExerciseLinks, DevClassLearning],
        },
        {
          provide: STEP_PRACTICE,
          useFactory: merge<StepPractice>(mergedStepPractice),
          inject: [ExerciseLinks, DevStepPractice],
        },
        SetHooksService,
        { provide: SET_HOOKS, useExisting: SetHooksService },
      ],
      exports: [LEARNING_DATA, CLASS_LEARNING, STEP_PRACTICE, SET_HOOKS, ExerciseLinks],
    };
  }
}

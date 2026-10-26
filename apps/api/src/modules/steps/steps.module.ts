import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { STEP_HOOKS } from '../curriculum/curriculum.ports.js';
import { StepFilesService } from './step-files.service.js';
import { StepHooksService } from './step-hooks.service.js';
import { StepsDevController } from './steps-dev.controller.js';
import {
  CARD_MARK_MODEL,
  LESSON_FILE_MODEL,
  cardMarkSchema,
  lessonFileSchema,
} from './steps.model.js';
import { DevStepPractice, STEP_PRACTICE } from './steps.ports.js';

export interface StepsModuleOptions {
  /** The curriculum module (002) instance: steps live in its Bài. */
  curriculum: DynamicModule;
  /** `/api/dev/steps/*` stand-ins (development and test only). */
  devHelpers: boolean;
}

/**
 * Module 004 — the content of steps (blocks, decks), files and storage, the HV viewer and card marks. Global because it
 * binds `STEP_HOOKS`, which 002's item lifecycle calls.
 */
@Global()
@Module({})
export class StepsModule {
  static forRoot(options: StepsModuleOptions): DynamicModule {
    return {
      module: StepsModule,
      imports: [
        options.curriculum,
        MongooseModule.forFeature([
          { name: LESSON_FILE_MODEL, schema: lessonFileSchema },
          { name: CARD_MARK_MODEL, schema: cardMarkSchema },
        ]),
      ],
      controllers: [...(options.devHelpers ? [StepsDevController] : [])],
      providers: [
        // 005 re-binds `STEP_PRACTICE` when it exists (steps.ports.ts).
        DevStepPractice,
        { provide: STEP_PRACTICE, useExisting: DevStepPractice },
        StepFilesService,
        StepHooksService,
        { provide: STEP_HOOKS, useExisting: StepHooksService },
      ],
      exports: [STEP_HOOKS, StepFilesService],
    };
  }
}

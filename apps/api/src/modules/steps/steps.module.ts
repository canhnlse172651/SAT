import {
  type DynamicModule,
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { STEP_LIMITS } from '@sat/shared';
import express from 'express';
import { MongooseModule } from '@nestjs/mongoose';
import { STEP_HOOKS } from '../curriculum/curriculum.ports.js';
import { ExcelService } from './excel.service.js';
import { LearnStepsController } from './learn-steps.controller.js';
import { LearnStepsService } from './learn-steps.service.js';
import { StepFilesService } from './step-files.service.js';
import { StepHooksService } from './step-hooks.service.js';
import { StepsDevController } from './steps-dev.controller.js';
import { StepsController } from './steps.controller.js';
import {
  CARD_MARK_MODEL,
  LESSON_FILE_MODEL,
  cardMarkSchema,
  lessonFileSchema,
} from './steps.model.js';
import { DevStepPractice } from './steps.ports.js';
import { StepsService } from './steps.service.js';

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
export class StepsModule implements NestModule {
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
      controllers: [
        StepsController,
        LearnStepsController,
        ...(options.devHelpers ? [StepsDevController] : []),
      ],
      providers: [
        // `STEP_PRACTICE` is bound by 005 (ExercisesModule, global); the dev endpoint still writes the stand-in links.
        DevStepPractice,
        StepFilesService,
        StepHooksService,
        { provide: STEP_HOOKS, useExisting: StepHooksService },
        StepsService,
        ExcelService,
        LearnStepsService,
      ],
      exports: [STEP_HOOKS, StepFilesService],
    };
  }

  /** The Excel import is the raw .xlsx (≤ 5 MB is checked by the service; larger bodies are 413). */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(express.raw({ type: () => true, limit: STEP_LIMITS.excelMaxBytes + 512 * 1024 }))
      .forRoutes({ path: 'steps/import', method: RequestMethod.POST });
  }
}

import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CURRICULUM_LIMITS } from '@sat/shared';
import express from 'express';
import { AiReplaceService } from './ai-replace.service.js';
import { CurriculumDevController } from './curriculum-dev.controller.js';
import { CurriculumContext } from './curriculum.context.js';
import { CurriculumController } from './curriculum.controller.js';
import {
  CURRICULUM_MODEL,
  LESSON_MODEL,
  curriculumSchema,
  lessonSchema,
} from './curriculum.model.js';
import { CurriculumReader } from './curriculum-reader.js';
import { AI_DRAFTS, CurriculumFaults, DevCurriculumLinks } from './curriculum.ports.js';
import { CurriculumService } from './curriculum.service.js';
import { LearnController } from './learn.controller.js';
import { LearnService } from './learn.service.js';
import { LessonsController } from './lessons.controller.js';
import { LessonsService } from './lessons.service.js';

export interface CurriculumModuleOptions {
  /** `/api/dev/curriculum/*` stand-ins for 003 / 005 / 010 (development and test only). */
  devHelpers: boolean;
}

/** Module 002 — curricula, Bài and their items. */
@Module({})
export class CurriculumModule implements NestModule {
  static forRoot(options: CurriculumModuleOptions): DynamicModule {
    // Exported: 005 keeps the content of sets in the Bài's items.
    const models = MongooseModule.forFeature([
      { name: CURRICULUM_MODEL, schema: curriculumSchema },
      { name: LESSON_MODEL, schema: lessonSchema },
    ]);
    return {
      module: CurriculumModule,
      imports: [models],
      controllers: [
        CurriculumController,
        LessonsController,
        LearnController,
        ...(options.devHelpers ? [CurriculumDevController] : []),
      ],
      providers: [
        // 010 re-binds `AI_DRAFTS` when it exists (curriculum.ports.ts); `CURRICULUM_CLASSES` is bound by 003
        // (ClassesModule, global), `LEARNING_DATA` and `SET_HOOKS` by 005 (ExercisesModule, global).
        DevCurriculumLinks,
        { provide: AI_DRAFTS, useExisting: DevCurriculumLinks },
        CurriculumFaults,
        CurriculumContext,
        CurriculumService,
        LessonsService,
        AiReplaceService,
        LearnService,
        CurriculumReader,
      ],
      exports: [models, CurriculumService, LessonsService, AiReplaceService, CurriculumReader],
    };
  }

  /** The cover upload is the raw image (≤ 2 MB is checked by the service; larger bodies are 413). */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(express.raw({ type: () => true, limit: CURRICULUM_LIMITS.coverMaxBytes + 256 * 1024 }))
      .forRoutes({ path: 'curricula/covers', method: RequestMethod.POST });
  }
}

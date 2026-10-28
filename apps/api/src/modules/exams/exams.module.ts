import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CLASS_EXAMS, type ClassExams, DevClassExams } from '../classes/classes.ports.js';
import { ExamLinks, mergedClassExams } from './exam-links.js';
import { ExamResultsService } from './exam-results.service.js';
import { ExamSettleService } from './exam-settle.service.js';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';
import { LearnExamsController } from './learn-exams.controller.js';
import { LearnExamsService } from './learn-exams.service.js';
import {
  EXAM_ATTEMPT_MODEL,
  EXAM_MODEL,
  EXAM_NOSHOW_MODEL,
  examAttemptSchema,
  examNoShowSchema,
  examSchema,
} from './exams.model.js';

export interface ExamsModuleOptions {
  /** Outside production 003's exam stand-ins (`dev_class_links`) count next to real exams. */
  devHelpers: boolean;
}

/**
 * Module 006 — standalone exams: T10 / T22 / T16 (GV), S07 / S08 (HV), attempts, auto-submit, results for 008 / 009.
 * Global because it binds 003's `CLASS_EXAMS` (also behind 001's `STUDENT_LINKS`).
 */
@Global()
@Module({})
export class ExamsModule {
  static forRoot(options: ExamsModuleOptions): DynamicModule {
    return {
      module: ExamsModule,
      imports: [
        MongooseModule.forFeature([
          { name: EXAM_MODEL, schema: examSchema },
          { name: EXAM_ATTEMPT_MODEL, schema: examAttemptSchema },
          { name: EXAM_NOSHOW_MODEL, schema: examNoShowSchema },
        ]),
      ],
      controllers: [ExamsController, LearnExamsController],
      providers: [
        ExamSettleService,
        ExamsService,
        ExamResultsService,
        LearnExamsService,
        ExamLinks,
        DevClassExams,
        {
          provide: CLASS_EXAMS,
          useFactory: (real: ExamLinks, dev: DevClassExams): ClassExams =>
            options.devHelpers ? mergedClassExams(real, dev) : real,
          inject: [ExamLinks, DevClassExams],
        },
      ],
      // `ExamResultsService.rows()` is what 008 / 009 read (AC-13.5).
      exports: [CLASS_EXAMS, ExamResultsService],
    };
  }
}

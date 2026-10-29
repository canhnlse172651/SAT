import { type DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LearnScoringController } from './learn-scoring.controller.js';
import { ScoringController } from './scoring.controller.js';
import { RANK_SCORE_MODEL, rankScoreSchema } from './scoring.model.js';
import { ScoringService } from './scoring.service.js';

export interface ScoringModuleOptions {
  /** The 002 module instance (`CurriculumReader`: Bài order and sets). */
  curriculum: DynamicModule;
}

/**
 * Module 008 — Điểm & Xếp hạng: S09 (HV) and T04 tab "Xếp hạng" (GV). Read side only: scores are derived on every read
 * from 003 (class, members, deadlines, hidden sections), 002 (Bài order), 005 (`CLASS_LEARNING`), 006
 * (`ExamResultsService.scoringData`) and 001 (`StudentDirectory`).
 */
@Module({})
export class ScoringModule {
  static forRoot(options: ScoringModuleOptions): DynamicModule {
    return {
      module: ScoringModule,
      imports: [
        options.curriculum,
        MongooseModule.forFeature([{ name: RANK_SCORE_MODEL, schema: rankScoreSchema }]),
      ],
      controllers: [LearnScoringController, ScoringController],
      providers: [ScoringService],
    };
  }
}

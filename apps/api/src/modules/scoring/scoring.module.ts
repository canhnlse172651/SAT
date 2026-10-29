import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RANK_SCORE_MODEL, rankScoreSchema } from './scoring.model.js';
import { ScoringService } from './scoring.service.js';

/**
 * Module 008 — Điểm & Xếp hạng: S09 (HV) and T04 tab "Xếp hạng" (GV). Read side only: scores are derived on every read
 * from 003 (class, members, deadlines, hidden sections), 002 (Bài order), 005 (`CLASS_LEARNING`), 006
 * (`ExamResultsService.scoringData`) and 001 (`StudentDirectory`), all exported by their (global) modules.
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: RANK_SCORE_MODEL, schema: rankScoreSchema }])],
  providers: [ScoringService],
})
export class ScoringModule {}

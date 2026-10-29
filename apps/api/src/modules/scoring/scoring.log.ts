import { Logger } from '@nestjs/common';

/*
 * NFR-8: one structured line per change of a displayed Điểm xếp hạng — class, student and item ids, averages and score
 * before / after, reason, time; never names or e-mails.
 */

const logger = new Logger('Scoring');

export type ScoreChangeReason = 'Điểm mới' | 'Quá hạn' | 'Điều chỉnh điểm' | 'Thay đổi nội dung';

export interface ScoreChangeLog {
  classId: string;
  studentId: string;
  itemId: string | null;
  reason: ScoreChangeReason;
  before: { avgEx: number; avgExam: number; score: number } | null;
  after: { avgEx: number; avgExam: number; score: number };
  at: string;
}

export function logScoreChange(entry: ScoreChangeLog): void {
  logger.log({ msg: 'scoring', action: 'score.change', ...entry });
}

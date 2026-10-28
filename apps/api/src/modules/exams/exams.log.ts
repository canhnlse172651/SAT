import { Logger } from '@nestjs/common';

/*
 * NFR-10: one structured line per create, save, schedule, unschedule, schedule / class change, delete, archive, restore,
 * duplicate, attempt start, submit, auto-submit and "Không làm bài" — exam, class, attempt and actor ids, counts and codes
 * only: never question text, answers, keys, names or e-mails.
 */

const logger = new Logger('Exams');

export interface ExamLog {
  action: string;
  result?: 'ok' | 'denied' | 'failed';
  code?: string;
  [field: string]: unknown;
}

export function logExam({ result = 'ok', ...entry }: ExamLog): void {
  if (result === 'failed') logger.warn({ msg: 'exams', result, ...entry });
  else logger.log({ msg: 'exams', result, ...entry });
}

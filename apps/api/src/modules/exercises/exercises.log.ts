import { Logger } from '@nestjs/common';

/*
 * NFR-10: one structured line per duplicate, start, submit, grade, re-grade (with the count), autosave / submit failure
 * and purge — ids, counts and codes only: never question text, answers, names or e-mails.
 */

const logger = new Logger('Exercises');

export interface ExerciseLog {
  action: string;
  result?: 'ok' | 'denied' | 'failed';
  code?: string;
  [field: string]: unknown;
}

export function logExercise({ result = 'ok', ...entry }: ExerciseLog): void {
  if (result === 'failed') logger.warn({ msg: 'exercises', result, ...entry });
  else logger.log({ msg: 'exercises', result, ...entry });
}

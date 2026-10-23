import { Logger } from '@nestjs/common';

/* NFR-8: one structured line per mutation and per reminder sweep — ids and counts only, never names or e-mails. */

const logger = new Logger('Classes');

export interface ClassLog {
  action: string;
  result?: 'ok' | 'denied' | 'failed';
  actorId?: string;
  classId?: string | undefined;
  [count: string]: unknown;
}

export function logClass({ result = 'ok', ...entry }: ClassLog): void {
  if (result === 'failed') logger.warn({ msg: 'classes', result, ...entry });
  else logger.log({ msg: 'classes', result, ...entry });
}

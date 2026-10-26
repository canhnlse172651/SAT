import { Logger } from '@nestjs/common';

/*
 * NFR-8: one structured line per upload failure, Excel import, publish / save of a published step, delete / archive /
 * restore and AI replacement — ids, kinds, counts and codes only: never step content, names, e-mails or file links.
 */

const logger = new Logger('Steps');

export interface StepLog {
  action: string;
  result?: 'ok' | 'denied' | 'failed';
  code?: string;
  [field: string]: unknown;
}

export function logStep({ result = 'ok', ...entry }: StepLog): void {
  if (result === 'failed') logger.warn({ msg: 'steps', result, ...entry });
  else logger.log({ msg: 'steps', result, ...entry });
}

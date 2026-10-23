import { Injectable, Logger } from '@nestjs/common';
import { toVnParts } from '@sat/shared';
import type { Clock } from './clock.js';

export type JobHandler = (payload: unknown) => Promise<void> | void;

export interface JobScheduler {
  /** Register the handler that runs jobs scheduled under `name`. */
  handle(name: string, handler: JobHandler): void;
  /** Run `name` once at `runAt`. */
  schedule(name: string, runAt: Date, payload?: unknown): Promise<void>;
  /** Run `handler` every day at `at` ("HH:mm", Vietnam time). */
  every(name: string, at: string, handler: JobHandler): void;
}

/** Injection token for the JobScheduler port. */
export const JOB_SCHEDULER = Symbol('JOB_SCHEDULER');

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDailyTime(at: string): { hour: number; minute: number } {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(at);
  if (!m) throw new Error(`Invalid daily time "${at}", expected HH:mm`);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Next instant strictly after `after` whose Vietnam wall-clock time is `at`. */
export function nextDailyRun(at: string, after: Date): Date {
  const { hour, minute } = parseDailyTime(at);
  const p = toVnParts(after);
  const sinceMidnight = ((p.hour * 60 + p.minute) * 60 + p.second) * 1000 + p.millisecond;
  const target = (hour * 60 + minute) * 60 * 1000;
  const delta = target > sinceMidnight ? target - sinceMidnight : target - sinceMidnight + DAY_MS;
  return new Date(after.getTime() + delta);
}

/** Test scheduler: nothing runs until `runDue()` is called. */
export class ManualScheduler implements JobScheduler {
  private readonly handlers = new Map<string, JobHandler>();
  private readonly once: { name: string; runAt: Date; payload: unknown }[] = [];
  private readonly daily: { name: string; at: string; next: Date }[] = [];

  constructor(private readonly clock: Clock) {}

  handle(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
  }

  schedule(name: string, runAt: Date, payload?: unknown): Promise<void> {
    this.once.push({ name, runAt, payload });
    return Promise.resolve();
  }

  every(name: string, at: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
    this.daily.push({ name, at, next: nextDailyRun(at, this.clock.now()) });
  }

  /** Runs every job due at the clock's current time; returns how many ran. */
  async runDue(): Promise<number> {
    const now = this.clock.now().getTime();
    let ran = 0;
    for (const job of [...this.once]) {
      if (job.runAt.getTime() > now) continue;
      this.once.splice(this.once.indexOf(job), 1);
      await this.handlers.get(job.name)?.(job.payload);
      ran++;
    }
    for (const job of this.daily) {
      if (job.next.getTime() > now) continue;
      job.next = nextDailyRun(job.at, this.clock.now());
      await this.handlers.get(job.name)?.(undefined);
      ran++;
    }
    return ran;
  }
}

/** Placeholder until the production scheduler ADR is decided: never runs anything. */
@Injectable()
export class NoopScheduler implements JobScheduler {
  private readonly logger = new Logger('NoopScheduler');

  handle(name: string): void {
    this.logger.warn({ msg: 'no scheduler configured; handler ignored', job: name });
  }

  schedule(name: string, runAt: Date): Promise<void> {
    this.logger.warn({ msg: 'no scheduler configured; job dropped', job: name, runAt });
    return Promise.resolve();
  }

  every(name: string, at: string): void {
    this.logger.warn({ msg: 'no scheduler configured; daily job not registered', job: name, at });
  }
}

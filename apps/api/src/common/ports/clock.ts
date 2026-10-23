import { startOfVnDay } from '@sat/shared';

export interface Clock {
  now(): Date;
}

/** Injection token for the Clock port. */
export const CLOCK = Symbol('CLOCK');

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Development clock: system time plus an offset that only the dev-only `POST /api/dev/clock` changes, so QA can
 * check rules that span hours or days (session expiry, lockouts, sending limits) against a running server.
 */
export class OffsetClock implements Clock {
  private offsetMs = 0;

  now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }

  advance(ms: number): void {
    this.offsetMs += ms;
  }

  reset(): void {
    this.offsetMs = 0;
  }
}

/** Test clock: frozen until set or advanced. */
export class FixedClock implements Clock {
  private current: Date;

  constructor(initial: Date | string = '2026-01-01T00:00:00.000Z') {
    this.current = new Date(initial);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date | string): void {
    this.current = new Date(date);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

/** 00:00 Vietnam time of the current VN calendar day, as a UTC instant. */
export function vnToday(clock: Clock): Date {
  return startOfVnDay(clock.now());
}

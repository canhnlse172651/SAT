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

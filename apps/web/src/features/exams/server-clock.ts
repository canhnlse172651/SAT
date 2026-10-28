import { useEffect, useState } from 'react';

/*
 * NFR-1, AC-3.2, AC-9.1: every exam time on screen follows the server clock, never the device's. Each exam response carries
 * `serverNow`; the offset to the device clock is kept here (a round trip of a few hundred ms is within the 2 s budget).
 */

let offsetMs = 0;

/** Records the server time of a response received just now. */
export function syncServer(serverNow: string): void {
  const t = Date.parse(serverNow);
  if (Number.isFinite(t)) offsetMs = t - Date.now();
}

/** The current server time. */
export const serverNow = (): Date => new Date(Date.now() + offsetMs);

/** Re-renders every `everyMs` and returns the server time (counters, countdowns). */
export function useServerNow(everyMs = 1000): Date {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

/** A random token for this page load: the device / tab holding an attempt (AC-10.4) or one submission (AC-11.3). */
export const newToken = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');

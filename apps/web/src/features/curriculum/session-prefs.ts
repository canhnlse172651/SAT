/**
 * Choices kept for the current sign-in only (AC-3.2 T05 level filter, AC-16.8 "Web / Mobile"): session storage
 * under the `sat.ss.` prefix, cleared by the session store on sign-in and sign-out.
 */
export const SESSION_PREF_PREFIX = 'sat.ss.';

export function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = sessionStorage.getItem(SESSION_PREF_PREFIX + key);
    return allowed.includes(v as T) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: string): void {
  try {
    sessionStorage.setItem(SESSION_PREF_PREFIX + key, value);
  } catch {
    // Storage blocked: the choice only lasts while the page is open.
  }
}

export function clearSessionPrefs(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(SESSION_PREF_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Nothing stored.
  }
}

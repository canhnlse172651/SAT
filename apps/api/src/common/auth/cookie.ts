export const SESSION_COOKIE = 'sat_sid';

/** Parses a `Cookie` request header into a map (first occurrence wins). */
export function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of (header ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const name = part.slice(0, eq).trim();
    let value = part.slice(eq + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"'))
      value = value.slice(1, -1);
    if (!cookies.has(name)) cookies.set(name, value);
  }
  return cookies;
}

export function readSessionToken(header: string | undefined): string | undefined {
  return parseCookies(header).get(SESSION_COOKIE) || undefined;
}

export function sessionCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${Math.floor(maxAgeSeconds)}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

export function clearedSessionCookie(secure: boolean): string {
  return sessionCookie('', 0, secure);
}

/**
 * `Secure` is on in production and whenever APP_ORIGIN is https; it is off only for local http
 * development, or when `COOKIE_SECURE=false` outside production (hermetic e2e server).
 */
export function isCookieSecure(env: {
  NODE_ENV: string;
  APP_ORIGIN: string;
  COOKIE_SECURE?: boolean | undefined;
}): boolean {
  if (env.NODE_ENV === 'production') return true;
  return env.COOKIE_SECURE ?? env.APP_ORIGIN.startsWith('https://');
}

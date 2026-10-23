import { describe, expect, it } from 'vitest';
import {
  clearedSessionCookie,
  isCookieSecure,
  parseCookies,
  readSessionToken,
  sessionCookie,
} from './cookie.js';

describe('session cookie', () => {
  it('sets HttpOnly, SameSite=Lax, Path=/, Max-Age and Secure', () => {
    expect(sessionCookie('abc', 28800, true)).toBe(
      'sat_sid=abc; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800; Secure',
    );
  });

  it('omits Secure when not secure', () => {
    expect(sessionCookie('abc', 10, false)).not.toContain('Secure');
  });

  it('clears with Max-Age=0', () => {
    expect(clearedSessionCookie(true)).toContain('Max-Age=0');
  });

  it('parses a Cookie header without dependencies', () => {
    expect(readSessionToken('a=1; sat_sid=tok; b=2')).toBe('tok');
    expect(readSessionToken('sat_sid="quoted"')).toBe('quoted');
    expect(readSessionToken(undefined)).toBeUndefined();
    expect(readSessionToken('sat_sid=')).toBeUndefined();
    expect(parseCookies('x=1; x=2').get('x')).toBe('1');
  });

  it('Secure is forced in production, otherwise follows https or COOKIE_SECURE', () => {
    const http = 'http://localhost:5173';
    const https = 'https://sat.test';
    expect(isCookieSecure({ NODE_ENV: 'production', APP_ORIGIN: http, COOKIE_SECURE: false })).toBe(
      true,
    );
    expect(isCookieSecure({ NODE_ENV: 'development', APP_ORIGIN: http })).toBe(false);
    expect(isCookieSecure({ NODE_ENV: 'development', APP_ORIGIN: https })).toBe(true);
    expect(isCookieSecure({ NODE_ENV: 'test', APP_ORIGIN: https, COOKIE_SECURE: false })).toBe(
      false,
    );
  });
});

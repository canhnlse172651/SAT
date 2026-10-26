import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig auth settings', () => {
  it('defaults: dev origin, 8 h GV, 30 d HV, COOKIE_SECURE unset', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({
      APP_ORIGIN: 'http://localhost:5173',
      SESSION_TTL_GV_HOURS: 8,
      SESSION_TTL_HV_DAYS: 30,
    });
    expect(c.COOKIE_SECURE).toBeUndefined();
  });

  it('normalises APP_ORIGIN and parses COOKIE_SECURE', () => {
    const c = loadConfig({ APP_ORIGIN: 'https://sat.example.com/', COOKIE_SECURE: 'false' });
    expect(c.APP_ORIGIN).toBe('https://sat.example.com');
    expect(c.COOKIE_SECURE).toBe(false);
  });

  it('requires APP_ORIGIN in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/APP_ORIGIN/);
    expect(loadConfig({ NODE_ENV: 'production', APP_ORIGIN: 'https://x.io' }).APP_ORIGIN).toBe(
      'https://x.io',
    );
  });
});

describe('loadConfig upload settings', () => {
  it('defaults to var/uploads and 500 MiB, and parses overrides', () => {
    expect(loadConfig({})).toMatchObject({
      UPLOADS_DIR: 'var/uploads',
      UPLOAD_MAX_BYTES: 524288000,
    });
    expect(loadConfig({ UPLOADS_DIR: '/data/u', UPLOAD_MAX_BYTES: '1024' })).toMatchObject({
      UPLOADS_DIR: '/data/u',
      UPLOAD_MAX_BYTES: 1024,
    });
  });

  it('rejects a non-positive UPLOAD_MAX_BYTES', () => {
    expect(() => loadConfig({ UPLOAD_MAX_BYTES: '0' })).toThrow(/UPLOAD_MAX_BYTES/);
  });
});

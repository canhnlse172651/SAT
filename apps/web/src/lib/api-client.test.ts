import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, setUnauthorizedHandler } from './api-client';
import { stubFetch } from '../test/stub-fetch';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe('apiRequest', () => {
  it('sends same-origin credentials', async () => {
    const fetchMock = stubFetch({ 'GET /api/ping': { body: { ok: true } } });
    await apiRequest('/ping');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ping',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('maps the error contract to ApiError with the requestId', async () => {
    stubFetch({
      'GET /api/x': {
        status: 409,
        body: { error: { code: 'CONFLICT', message: 'Đã đổi', requestId: 'req-1' } },
      },
    });
    const err = await apiRequest('/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 409,
      code: 'CONFLICT',
      message: 'Đã đổi',
      requestId: 'req-1',
    });
  });

  it('calls the unauthorized handler on 401 unless opted out', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    stubFetch({
      'GET /api/a': {
        status: 401,
        body: { error: { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r' } },
      },
    });
    await expect(apiRequest('/a')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(apiRequest('/a', { handleUnauthorized: false })).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

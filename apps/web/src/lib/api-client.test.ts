import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiRequest,
  sessionFailureReason,
  setUnauthorizedHandler,
  uploadRequest,
} from './api-client';
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

  it('[001:AC-5.4] keeps error.details and exposes the 401 reason', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    stubFetch({
      'GET /api/b': {
        status: 401,
        body: {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'x',
            details: { reason: 'locked' },
            requestId: 'r',
          },
        },
      },
      'GET /api/c': {
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'x',
            details: [{ path: ['email'] }],
            requestId: 'r',
          },
        },
      },
    });
    const err = await apiRequest('/b').catch((e: unknown) => e);
    expect(handler).toHaveBeenCalledWith(err);
    expect(sessionFailureReason(err)).toBe('locked');
    const bad = await apiRequest('/c').catch((e: unknown) => e);
    expect(bad).toMatchObject({ details: [{ path: ['email'] }] });
    expect(sessionFailureReason(bad)).toBeNull();
  });
});

/** Minimal XMLHttpRequest double: the test drives upload progress and the response. */
class FakeXhr {
  static last: FakeXhr | null = null;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown = null;
  status = 0;
  responseText = '';
  withCredentials = false;
  aborted = false;
  upload: { onprogress: ((e: ProgressEvent) => void) | null; onload: (() => void) | null } = {
    onprogress: null,
    onload: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

describe('uploadRequest', () => {
  it('posts the bytes with headers, reports progress and parses the JSON answer', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    const onProgress = vi.fn();
    const onSent = vi.fn();
    const blob = new Blob(['abc']);
    const p = uploadRequest<{ id: string }>('/steps/files?kind=image', blob, {
      headers: { 'X-File-Name': 'a.png' },
      onProgress,
      onSent,
    });
    const xhr = FakeXhr.last!;
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/steps/files?kind=image');
    expect(xhr.headers).toMatchObject({
      'X-File-Name': 'a.png',
      'Content-Type': 'application/octet-stream',
      Accept: 'application/json',
    });
    expect(xhr.body).toBe(blob);
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 3 } as ProgressEvent);
    expect(onProgress).toHaveBeenCalledWith(1, 3);
    xhr.upload.onload?.();
    expect(onSent).toHaveBeenCalled();
    xhr.respond(201, { id: 'f1' });
    await expect(p).resolves.toEqual({ id: 'f1' });
  });

  it('maps errors, network failures and aborts to ApiError', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    const p1 = uploadRequest('/x', new Blob([]));
    FakeXhr.last!.respond(409, { error: { code: 'STORAGE_FULL', message: 'Đầy', requestId: 'r' } });
    await expect(p1).rejects.toMatchObject({ status: 409, code: 'STORAGE_FULL', message: 'Đầy' });

    const p2 = uploadRequest('/x', new Blob([]));
    FakeXhr.last!.onerror?.();
    await expect(p2).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });

    const ctrl = new AbortController();
    const p3 = uploadRequest('/x', new Blob([]), { signal: ctrl.signal });
    ctrl.abort();
    await expect(p3).rejects.toMatchObject({ code: 'ABORTED' });
    expect(FakeXhr.last!.aborted).toBe(true);

    const p4 = uploadRequest('/x', new Blob([]));
    FakeXhr.last!.respond(401, {
      error: { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r' },
    });
    await expect(p4).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalled();
  });
});

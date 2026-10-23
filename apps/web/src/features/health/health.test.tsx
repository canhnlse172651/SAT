// Walking-skeleton tests: infrastructure only, so they cite no acceptance criterion.
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthStatus } from './HealthStatus';
import { useHealthStore } from './health-store';

const initialState = useHealthStore.getState();

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockFetch(status: number, body: unknown) {
  // A fresh Response per call: a body stream can only be read once.
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    jsonResponse(status, body),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  useHealthStore.setState(initialState, true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('health store', () => {
  it('becomes ok when the API answers', async () => {
    const fetchMock = mockFetch(200, { status: 'ok' });
    await useHealthStore.getState().check();
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.anything());
    expect(useHealthStore.getState()).toMatchObject({ status: 'ok', error: null });
  });

  it('surfaces the API error message', async () => {
    mockFetch(503, { error: { code: 'NOT_READY', message: 'database down' } });
    await useHealthStore.getState().check();
    expect(useHealthStore.getState()).toMatchObject({ status: 'error', error: 'database down' });
  });
});

describe('<HealthStatus />', () => {
  it('checks the API on mount and shows the result', async () => {
    mockFetch(200, { status: 'ok' });
    render(<HealthStatus />);
    expect(await screen.findByText('API is healthy')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('data-status', 'ok');
  });
});

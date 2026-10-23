// Walking-skeleton tests: infrastructure only, so they cite no acceptance criterion.
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { stubFetch } from '../../test/stub-fetch';
import { HealthStatus } from './HealthStatus';
import { useHealthStore } from './health-store';

const initialState = useHealthStore.getState();

beforeEach(() => {
  useHealthStore.setState(initialState, true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('health store', () => {
  it('becomes ok when the API answers', async () => {
    const fetchMock = stubFetch({ 'GET /api/health': { body: { status: 'ok' } } });
    await useHealthStore.getState().check();
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.anything());
    expect(useHealthStore.getState()).toMatchObject({ status: 'ok', error: null });
  });

  it('surfaces the API error message', async () => {
    stubFetch({
      'GET /api/health': {
        status: 503,
        body: { error: { code: 'NOT_READY', message: 'database down', requestId: 'r' } },
      },
    });
    await useHealthStore.getState().check();
    expect(useHealthStore.getState()).toMatchObject({ status: 'error', error: 'database down' });
  });
});

describe('<HealthStatus />', () => {
  it('checks the API on mount and shows the result', async () => {
    stubFetch({ 'GET /api/health': { body: { status: 'ok' } } });
    renderWithProviders(<HealthStatus />);
    expect(await screen.findByText('API is healthy')).toBeInTheDocument();
    expect(screen.getAllByRole('status').some((e) => e.dataset.status === 'ok')).toBe(true);
  });
});

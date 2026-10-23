import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoutes, type RenderOptions } from '../test/render';
import { stubFetch, unauthenticated } from '../test/stub-fetch';
import { createAppRoutes } from './routes';
import { SCREENS } from './screens';

afterEach(() => {
  vi.unstubAllGlobals();
});

const gv: RenderOptions['session'] = { role: 'GV' };
const hv: RenderOptions['session'] = { role: 'HV', displayName: 'Minh' };

const open = (route: string, session?: RenderOptions['session']) =>
  renderRoutes(createAppRoutes(), { route, session });

describe('route guard (RequireRole)', () => {
  it('[001:AC-16.3] sends a signed-out visitor to A01 with returnTo', async () => {
    stubFetch({ 'GET /api/session': unauthenticated });
    const { router } = open('/gv/lop-hoc?x=1');
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/dang-nhap'));
    expect(router.state.location.search).toBe(`?returnTo=${encodeURIComponent('/gv/lop-hoc?x=1')}`);
  });

  it('[001:AC-20.10] sends an HV opening a teacher screen to S01', async () => {
    const { router } = open('/gv/giao-trinh', hv);
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/hv'));
    expect(await screen.findByRole('heading', { name: /S01 Lớp của tôi/ })).toBeInTheDocument();
  });

  it('[001:AC-16.4] sends a GV opening S01–S12 to T01', async () => {
    const { router } = open('/hv/lop/k12', gv);
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/gv'));
    expect(await screen.findByRole('heading', { name: /T01 Dashboard/ })).toBeInTheDocument();
  });

  it('[001:AC-20.4] sends a GV opening S13–S20 to A05', async () => {
    open('/tu-hoc/tu-vung', gv);
    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeInTheDocument();
  });

  it('[001:AC-20.2] lets an HV open S13–S20', async () => {
    open('/tu-hoc/thi-thu', hv);
    expect(await screen.findByRole('heading', { name: /S19 Thi thử HSK/ })).toBeInTheDocument();
  });

  it('loads the session once and lets a signed-in GV through', async () => {
    const fetchMock = stubFetch({
      'GET /api/session': {
        body: {
          user: { id: 'u1', role: 'GV', displayName: 'Cô Lan' },
          workspace: { id: 'w1', name: 'Lớp cô Lan' },
        },
      },
    });
    open('/gv');
    expect(await screen.findByRole('heading', { name: /T01 Dashboard/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('"/" goes to the role home', async () => {
    const { router } = open('/', hv);
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/hv'));
  });
});

describe('route table', () => {
  it('has unique screen ids and paths', () => {
    expect(new Set(SCREENS.map((s) => s.id)).size).toBe(SCREENS.length);
    expect(new Set(SCREENS.map((s) => s.path)).size).toBe(SCREENS.length);
  });

  it('renders an unbuilt screen as a placeholder', async () => {
    open('/gv/giao-trinh/c1/bai/b1/review-ai', gv);
    expect(
      await screen.findByRole('heading', { name: 'Đang xây dựng · T20 Review nội dung AI' }),
    ).toBeInTheDocument();
  });

  it('shows A05 for an unknown URL', async () => {
    open('/khong-co-trang-nay', gv);
    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeInTheDocument();
  });
});

describe('shells', () => {
  it('TeacherShell lists the sidebar in order, with workspace name, screen name and disabled search', async () => {
    open('/gv', { role: 'GV', workspaceName: 'Lớp cô Lan' });
    const nav = await screen.findByRole('navigation', { name: 'Điều hướng chính' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual([
      'Dashboard',
      'Lớp học',
      'Giáo trình',
      'Bài thi',
      'Học viên',
      'Kho tự học',
      'Tài khoản',
    ]);
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Lớp cô Lan')).toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Vị trí' })).getByText('Dashboard'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tìm kiếm' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Thông báo' })).toBeDisabled();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('StudentShell lists the tab bar in order', async () => {
    open('/hv', hv);
    const nav = await screen.findByRole('navigation', { name: 'Thanh tab' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Lớp của tôi', 'Bài thi', 'Tự học', 'Xếp hạng', 'Tài khoản']);
    expect(screen.getByRole('heading', { level: 1, name: 'Lớp của tôi' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

describe('401 handling', () => {
  it('[001:AC-16.3] a 401 from any API call clears the session and goes to A01 with returnTo', async () => {
    const { apiRequest } = await import('../lib/api-client');
    const { useSessionStore } = await import('../features/session/session-store');
    stubFetch({ 'GET /api/classes': unauthenticated });
    const { router } = open('/gv/lop-hoc', gv);
    await screen.findByRole('heading', { name: /T02/ });

    await expect(apiRequest('/classes')).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/dang-nhap'));
    expect(router.state.location.search).toBe(`?returnTo=${encodeURIComponent('/gv/lop-hoc')}`);
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('[001:AC-5.4] [001:AC-12.3] the 401 reason reaches A01 as a notice', async () => {
    const { apiRequest } = await import('../lib/api-client');
    const { useSessionStore } = await import('../features/session/session-store');
    stubFetch({
      'GET /api/classes': {
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
    });
    const { router } = open('/gv/lop-hoc', gv);
    await screen.findByRole('heading', { name: /T02/ });
    await expect(apiRequest('/classes')).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/dang-nhap'));
    expect(router.state.location.state).toEqual({
      notice: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ giáo viên của bạn.',
    });
    expect(useSessionStore.getState().reason).toBe('locked');
  });
});

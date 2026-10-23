import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from '../app/ErrorBoundary';
import { ApiError } from '../lib/api-client';
import { renderWithProviders } from '../test/render';
import { NotFoundPage } from './NotFoundPage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NotFoundPage (A05)', () => {
  it('[001:AC-16.2] shows the shared message and a home link for a GV', () => {
    renderWithProviders(<NotFoundPage />, { session: { role: 'GV' } });
    expect(
      screen.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về Dashboard' })).toHaveAttribute('href', '/gv');
  });

  it('links an HV home to S01 and a signed-out visitor to A01', () => {
    renderWithProviders(<NotFoundPage />, { session: { role: 'HV' } });
    expect(screen.getByRole('link', { name: 'Về trang lớp' })).toHaveAttribute('href', '/hv');
  });

  it('links a signed-out visitor to the login screen', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByRole('link', { name: 'Về trang đăng nhập' })).toHaveAttribute(
      'href',
      '/dang-nhap',
    );
  });
});

describe('ErrorFallback', () => {
  it('shows the requestId of an API error', () => {
    renderWithProviders(<ErrorFallback error={new ApiError(500, 'INTERNAL', 'boom', 'req-42')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('req-42');
  });

  it('renders A05 for a 404 API error', () => {
    renderWithProviders(<ErrorFallback error={new ApiError(404, 'NOT_FOUND', 'x', 'r')} />);
    expect(
      screen.getByRole('heading', { name: 'Không tìm thấy nội dung bạn yêu cầu.' }),
    ).toBeInTheDocument();
  });
});

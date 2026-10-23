import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('is an alert with the message and the request id', () => {
    render(<ErrorState message="Không tải được danh sách lớp." requestId="req-123" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Không tải được danh sách lớp.');
    expect(alert).toHaveTextContent('Mã yêu cầu: req-123');
  });

  it('omits the request id and retry when not given', () => {
    render(<ErrorState />);
    expect(screen.queryByText(/Mã yêu cầu/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

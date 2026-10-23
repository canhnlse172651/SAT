import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast, ToastViewport } from './Toast';

describe('Toast', () => {
  it('announces success as a status and errors as an alert', () => {
    render(
      <>
        <Toast kind="success" message="Đã lưu" />
        <Toast kind="error" message="Lưu thất bại" />
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Đã lưu');
    expect(screen.getByRole('alert')).toHaveTextContent('Lưu thất bại');
  });
});

describe('ToastViewport', () => {
  it('lists toasts in a labelled region and dismisses by id', async () => {
    const onDismiss = vi.fn();
    render(
      <ToastViewport
        toasts={[
          { id: 'a', kind: 'success', message: 'Đã lưu' },
          { id: 'b', kind: 'warn', message: 'Sắp hết hạn' },
        ]}
        onDismiss={onDismiss}
      />,
    );
    const region = screen.getByRole('region', { name: 'Thông báo' });
    expect(within(region).getAllByRole('status')).toHaveLength(2);
    await userEvent.click(
      within(region).getAllByRole('button', { name: 'Đóng thông báo' })[1] as HTMLElement,
    );
    expect(onDismiss).toHaveBeenCalledWith('b');
  });
});

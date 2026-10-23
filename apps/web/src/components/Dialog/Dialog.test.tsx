import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from '../Drawer/BottomSheet';
import { Drawer } from '../Drawer/Drawer';
import { ConfirmDialog } from './ConfirmDialog';
import { Dialog } from './Dialog';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Mở</button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm học viên"
        footer={<button onClick={() => setOpen(false)}>Lưu</button>}
      >
        <input aria-label="Email" />
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('renders a modal dialog named by its title only while open', async () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mở' }));
    const dialog = screen.getByRole('dialog', { name: 'Thêm học viên' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus inside, traps Tab and wraps around', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Mở' }));
    const close = screen.getByRole('button', { name: 'Đóng' });
    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveFocus();
  });

  it('closes on Esc and returns focus to the opener', async () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Mở' });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes from the close button and from the scrim', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open onClose={onClose} title="T">
        x
      </Dialog>,
    );
    expect(container).toBeEmptyDOMElement(); // rendered through a portal
    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(document.querySelector('.overlay__scrim') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('ConfirmDialog', () => {
  it('focuses Cancel first and reports the choice', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        tone="danger"
        title="Xóa bài?"
        message="Bài đã có bài nộp sẽ được lưu trữ."
        confirmLabel="Xóa"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Xóa bài?' });
    expect(dialog).toHaveAccessibleDescription('Bài đã có bài nộp sẽ được lưu trữ.');
    expect(screen.getByRole('button', { name: 'Hủy' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('Drawer and BottomSheet', () => {
  it('Drawer is a modal dialog with its title', () => {
    render(
      <Drawer open onClose={() => {}} title="Chi tiết học viên">
        nội dung
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Chi tiết học viên' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });

  it('BottomSheet closes on Esc', async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} title="Bộ lọc">
        nội dung
      </BottomSheet>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is a switch reflecting checked and reports the toggle', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Hiện với lớp" />);
    const sw = screen.getByRole('switch', { name: 'Hiện với lớp' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles with the keyboard', async () => {
    const onChange = vi.fn();
    render(<Switch checked onChange={onChange} label="Nhắc hạn" />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

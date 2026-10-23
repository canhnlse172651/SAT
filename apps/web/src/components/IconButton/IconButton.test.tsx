import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('is named by its aria-label and clickable', async () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="Đóng" icon={<span>x</span>} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

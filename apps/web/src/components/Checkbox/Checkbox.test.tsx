import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles by clicking the label', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Ghi nhớ tôi" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Ghi nhớ tôi' });
    expect(box).not.toBeChecked();
    await userEvent.click(screen.getByText('Ghi nhớ tôi'));
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('cannot be toggled when disabled', async () => {
    render(<Checkbox label="Khóa" disabled />);
    await userEvent.click(screen.getByText('Khóa'));
    expect(screen.getByRole('checkbox', { name: 'Khóa' })).not.toBeChecked();
  });
});

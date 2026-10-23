import { parseVnDate } from '@sat/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

const vn = (s: string) => parseVnDate(s) as Date;

describe('Calendar (003:AC-21.2)', () => {
  it('shows the selected month, marks today and the selected day, and disables days out of range', () => {
    render(
      <Calendar
        selected={vn('30/10/2026')}
        today={vn('21/10/2026')}
        min={vn('10/10/2026')}
        max={vn('31/10/2026')}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('Tháng 10 năm 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '21 tháng 10 năm 2026' })).toHaveAttribute(
      'aria-current',
      'date',
    );
    expect(
      screen.getByRole('button', { name: '30 tháng 10 năm 2026' }).closest('td'),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: '9 tháng 10 năm 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tháng sau' })).toBeDisabled();
  });

  it('moves with the keyboard and selects with Enter', async () => {
    const onSelect = vi.fn();
    render(<Calendar selected={vn('21/10/2026')} onSelect={onSelect} autoFocus />);
    expect(screen.getByRole('button', { name: '21 tháng 10 năm 2026' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(vn('29/10/2026'));
  });
});

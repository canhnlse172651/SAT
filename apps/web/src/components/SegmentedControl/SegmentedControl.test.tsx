import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'all', label: 'Tất cả' },
] as const;

function Harness() {
  const [value, setValue] = useState<'week' | 'month' | 'all'>('week');
  return (
    <SegmentedControl
      aria-label="Khoảng thời gian"
      options={[...options]}
      value={value}
      onChange={setValue}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a radiogroup with one checked radio', () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup', { name: 'Khoảng thời gian' })).toBeVisible();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Tuần' })).toBeChecked();
  });

  it('selects on click', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Tháng' }));
    expect(screen.getByRole('radio', { name: 'Tháng' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tuần' })).not.toBeChecked();
  });

  it('arrow keys move selection and focus', async () => {
    render(<Harness />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Tất cả' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tất cả' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Tuần' })).toBeChecked();
  });
});

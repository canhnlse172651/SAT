import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'hsk1', label: 'HSK 1' },
  { value: 'hsk2', label: 'HSK 2' },
];

describe('Select', () => {
  it('is a labelled combobox and selects an option', async () => {
    render(<Select label="Cấp độ" options={options} placeholder="Chọn cấp độ" />);
    const select = screen.getByRole('combobox', { name: 'Cấp độ' });
    expect(select).toHaveValue('');
    await userEvent.selectOptions(select, 'HSK 2');
    expect(select).toHaveValue('hsk2');
  });

  it('marks an error as invalid', () => {
    render(<Select label="Cấp độ" options={options} error="Chọn một cấp độ" />);
    expect(screen.getByRole('combobox', { name: 'Cấp độ' })).toBeInvalid();
  });
});

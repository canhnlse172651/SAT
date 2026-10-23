import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('is found by its label and accepts typing', async () => {
    render(<TextField label="Họ và tên" />);
    const input = screen.getByLabelText('Họ và tên');
    await userEvent.type(input, 'Lan');
    expect(input).toHaveValue('Lan');
  });

  it('exposes the error as invalid and described', () => {
    render(<TextField label="Email" error="Bắt buộc" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Bắt buộc');
  });
});

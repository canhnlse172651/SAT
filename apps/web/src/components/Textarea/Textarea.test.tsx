import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('counts characters against maxLength while typing', async () => {
    render(<Textarea label="Mô tả ngắn" maxLength={10} />);
    expect(screen.getByText('0/10')).toBeVisible();
    await userEvent.type(screen.getByLabelText('Mô tả ngắn'), 'xin chào');
    expect(screen.getByText('8/10')).toBeVisible();
  });

  it('counts a controlled value', () => {
    render(<Textarea label="Ghi chú" maxLength={5} value="abc" onChange={() => {}} />);
    expect(screen.getByText('3/5')).toBeVisible();
  });

  it('shows the error on the field', () => {
    render(<Textarea label="Ghi chú" error="Quá dài" />);
    expect(screen.getByLabelText('Ghi chú')).toBeInvalid();
  });
});

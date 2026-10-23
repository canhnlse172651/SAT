import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from './FormField';

describe('FormField', () => {
  it('labels the control and links hint and error through aria-describedby', () => {
    render(
      <FormField label="Email" hint="Dùng email công việc" error="Email không hợp lệ" required>
        {(a11y) => <input {...a11y} />}
      </FormField>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Email không hợp lệ Dùng email công việc');
  });

  it('has no invalid state or description without error and hint', () => {
    render(<FormField label="Tên">{(a11y) => <input {...a11y} />}</FormField>);
    const input = screen.getByLabelText('Tên');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});

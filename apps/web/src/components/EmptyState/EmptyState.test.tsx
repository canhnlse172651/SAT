import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows title, description and action', () => {
    render(
      <EmptyState
        title="Chưa có lớp học"
        description="Tạo lớp đầu tiên."
        action={<button>Tạo lớp</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Chưa có lớp học' })).toBeVisible();
    expect(screen.getByText('Tạo lớp đầu tiên.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tạo lớp' })).toBeVisible();
  });
});

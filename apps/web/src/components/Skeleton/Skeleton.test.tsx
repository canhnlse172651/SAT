import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    render(<Skeleton width={120} height={20} />);
    const el = screen.getByTestId('skeleton');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveStyle({ width: '120px', height: '20px' });
  });

  it('renders the requested number of lines', () => {
    const { container } = render(<Skeleton lines={3} />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3);
  });
});

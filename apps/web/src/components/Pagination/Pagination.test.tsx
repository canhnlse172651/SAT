import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('is a labelled nav marking the current page', () => {
    render(<Pagination page={2} pageCount={5} onChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Phân trang' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Trang 3' })).not.toHaveAttribute('aria-current');
  });

  it('collapses distant pages into an ellipsis but keeps first and last', () => {
    render(<Pagination page={10} pageCount={20} onChange={() => {}} />);
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual([
      'Trang trước',
      'Trang 1',
      'Trang 9',
      'Trang 10',
      'Trang 11',
      'Trang 20',
      'Trang sau',
    ]);
  });

  it('goes to previous, next and a chosen page; disables the ends', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Pagination page={1} pageCount={3} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'Trang 3' }));
    expect(onChange).toHaveBeenLastCalledWith(3);
    rerender(<Pagination page={3} pageCount={3} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

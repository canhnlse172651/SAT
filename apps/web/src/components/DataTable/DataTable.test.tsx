import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row {
  id: string;
  name: string;
  score: number;
}

const columns: Array<Column<Row>> = [
  { key: 'name', header: 'Học viên', sortable: true },
  { key: 'score', header: 'Điểm', sortable: true, align: 'right' },
  { key: 'note', header: 'Ghi chú', render: (r) => `Ghi chú của ${r.name}` },
];

const rows: Row[] = [
  { id: '1', name: 'An', score: 90 },
  { id: '2', name: 'Bình', score: 75 },
];

describe('DataTable', () => {
  it('renders a named table with headers and rows', () => {
    render(<DataTable caption="Bảng điểm" columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    expect(screen.getByRole('table', { name: 'Bảng điểm' })).toBeVisible();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('cell', { name: 'Ghi chú của Bình' })).toBeVisible();
  });

  it('sets aria-sort on the sorted column and asks for the next direction', async () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        caption="Bảng điểm"
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        sort={{ key: 'score', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Điểm' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: 'Học viên' })).toHaveAttribute(
      'aria-sort',
      'none',
    );
    expect(screen.getByRole('columnheader', { name: 'Ghi chú' })).not.toHaveAttribute('aria-sort');

    await userEvent.click(
      within(screen.getByRole('columnheader', { name: 'Điểm' })).getByRole('button'),
    );
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'score', direction: 'desc' });
    await userEvent.click(
      within(screen.getByRole('columnheader', { name: 'Học viên' })).getByRole('button'),
    );
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });
  });

  it('shows the default empty state, or the empty slot', () => {
    const { rerender } = render(
      <DataTable caption="Bảng điểm" columns={columns} rows={[]} getRowKey={(r) => r.id} />,
    );
    expect(screen.getByText('Chưa có dữ liệu')).toBeVisible();
    rerender(
      <DataTable
        caption="Bảng điểm"
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        empty={<p>Lớp chưa có học viên</p>}
      />,
    );
    expect(screen.getByText('Lớp chưa có học viên')).toBeVisible();
  });

  it('activates a clickable row with the mouse and Enter', async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        caption="Bảng điểm"
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getAllByRole('row')[1] as HTMLElement;
    await userEvent.click(row);
    expect(onRowClick).toHaveBeenLastCalledWith(rows[0]);
    row.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});

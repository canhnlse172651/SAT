import { formatVnDate, parseVnDate } from '@sat/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { addDays, addMonths, monthGrid, toYmd, weekdayIndex } from './calendar';
import { DatePicker, type DatePickerProps } from './DatePicker';

const vn = (s: string) => parseVnDate(s) as Date;

function Harness(
  props: Partial<DatePickerProps> & { initial?: Date | null; spy?: (d: Date | null) => void },
) {
  const { initial = null, spy, ...rest } = props;
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <DatePicker
      label="Hạn nộp"
      value={value}
      onChange={(d) => {
        spy?.(d);
        setValue(d);
      }}
      {...rest}
    />
  );
}

describe('calendar helpers', () => {
  it('starts weeks on Monday', () => {
    expect(weekdayIndex(2026, 10, 19)).toBe(0); // Monday
    expect(weekdayIndex(2026, 10, 25)).toBe(6); // Sunday
  });

  it('builds a month grid padded to whole weeks', () => {
    const rows = monthGrid(2026, 2); // Feb 2026 starts on Sunday, 28 days
    expect(rows.every((r) => r.length === 7)).toBe(true);
    expect(rows[0]?.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(rows.flat().filter((c) => c !== null)).toHaveLength(28);
  });

  it('adds days and months across boundaries, clamping the day', () => {
    expect(addDays({ y: 2026, m: 12, d: 31 }, 1)).toEqual({ y: 2027, m: 1, d: 1 });
    expect(addMonths({ y: 2026, m: 1, d: 31 }, 1)).toEqual({ y: 2026, m: 2, d: 28 });
    expect(addMonths({ y: 2026, m: 1, d: 15 }, -1)).toEqual({ y: 2025, m: 12, d: 15 });
  });

  it('reads the Vietnam calendar day of an instant (UTC+7)', () => {
    expect(toYmd(new Date('2026-10-22T18:00:00Z'))).toEqual({ y: 2026, m: 10, d: 23 });
  });
});

describe('DatePicker', () => {
  it('shows the value as dd/MM/yyyy in Vietnam time', () => {
    render(<Harness initial={vn('05/11/2026')} />);
    expect(screen.getByLabelText('Hạn nộp')).toHaveValue('05/11/2026');
  });

  it('parses typed text to 00:00 Vietnam time', async () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    await userEvent.type(screen.getByLabelText('Hạn nộp'), '31/12/2026');
    const last = spy.mock.calls.at(-1)?.[0] as Date;
    expect(last.toISOString()).toBe('2026-12-30T17:00:00.000Z');
    expect(formatVnDate(last)).toBe('31/12/2026');
  });

  it('flags an invalid date on blur and keeps what was typed', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Hạn nộp');
    await userEvent.type(input, '31/02/2026');
    await userEvent.tab();
    expect(input).toBeInvalid();
    expect(input).toHaveValue('31/02/2026');
    expect(screen.getByText(/Ngày không hợp lệ/)).toBeVisible();
  });

  it('clears the value when the text is emptied', async () => {
    const spy = vi.fn();
    render(<Harness initial={vn('05/11/2026')} spy={spy} />);
    const input = screen.getByLabelText('Hạn nộp');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(spy).toHaveBeenLastCalledWith(null);
  });

  it('opens a calendar on the selected month and picks a day', async () => {
    const spy = vi.fn();
    render(<Harness initial={vn('05/11/2026')} spy={spy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Chọn ngày' }));
    expect(screen.getByRole('dialog', { name: 'Chọn ngày' })).toBeVisible();
    expect(screen.getByText('Tháng 11 năm 2026')).toBeVisible();
    expect(screen.getByRole('button', { name: '5 tháng 11 năm 2026' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: '20 tháng 11 năm 2026' }));
    expect(spy).toHaveBeenLastCalledWith(vn('20/11/2026'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Hạn nộp')).toHaveValue('20/11/2026');
  });

  it('navigates days and months with the keyboard and selects with Enter', async () => {
    const spy = vi.fn();
    render(<Harness initial={vn('05/11/2026')} spy={spy} />);
    await userEvent.click(screen.getByRole('button', { name: 'Chọn ngày' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '6 tháng 11 năm 2026' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: '13 tháng 11 năm 2026' })).toHaveFocus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('button', { name: '13 tháng 12 năm 2026' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(spy).toHaveBeenLastCalledWith(vn('13/12/2026'));
  });

  it('closes on Esc and returns focus to the calendar button', async () => {
    render(<Harness initial={vn('05/11/2026')} />);
    const trigger = screen.getByRole('button', { name: 'Chọn ngày' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('disables days outside min and max and refuses typed dates outside them', async () => {
    const spy = vi.fn();
    render(
      <Harness
        initial={vn('15/11/2026')}
        min={vn('10/11/2026')}
        max={vn('20/11/2026')}
        spy={spy}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Chọn ngày' }));
    expect(screen.getByRole('button', { name: '9 tháng 11 năm 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '21 tháng 11 năm 2026' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '10 tháng 11 năm 2026' })).toBeEnabled();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: '20 tháng 11 năm 2026' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    const input = screen.getByLabelText('Hạn nộp');
    await userEvent.clear(input);
    spy.mockClear();
    await userEvent.type(input, '25/11/2026');
    await userEvent.tab();
    expect(spy).not.toHaveBeenCalledWith(vn('25/11/2026'));
    expect(screen.getByText(/ngoài khoảng/)).toBeVisible();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

const items = [
  { id: 'lesson', label: 'Bài học', content: <p>Nội dung bài học</p> },
  { id: 'exercise', label: 'Bài tập', count: 3, content: <p>Nội dung bài tập</p> },
  { id: 'doc', label: 'Tài liệu', content: <p>Nội dung tài liệu</p> },
];

function Harness() {
  const [value, setValue] = useState('lesson');
  return <Tabs aria-label="Soạn bài" items={items} value={value} onChange={setValue} />;
}

describe('Tabs', () => {
  it('exposes tablist, tabs and the selected tabpanel', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Soạn bài' })).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Bài học' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Bài học' })).toHaveTextContent('Nội dung bài học');
  });

  it('uses a roving tabindex: only the selected tab is tabbable', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Bài học' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /Bài tập/ })).toHaveAttribute('tabindex', '-1');
  });

  it('moves selection and focus with arrow keys, wrapping around', async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Bài học' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Bài tập/ })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Nội dung bài tập');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Tài liệu' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Bài học' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Tài liệu' })).toHaveFocus();
  });

  it('shows the count next to the label', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Bài tập 3' })).toBeVisible();
  });
});

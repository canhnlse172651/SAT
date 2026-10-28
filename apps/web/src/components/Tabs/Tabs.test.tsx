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

function Harness({ keepMounted }: { keepMounted?: boolean }) {
  const [value, setValue] = useState('lesson');
  return (
    <Tabs
      aria-label="Soạn bài"
      items={items}
      value={value}
      onChange={setValue}
      keepMounted={keepMounted}
    />
  );
}

let mounts = 0;
function Counted() {
  const [n] = useState(() => ++mounts);
  return <p>Lần dựng {n}</p>;
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

  it('renders only the selected panel by default', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: /Bài tập/ }));
    expect(screen.queryByText('Nội dung bài học')).toBeNull();
  });

  it('[005:NFR-13] keepMounted keeps visited panels mounted and hidden, so coming back does not rebuild them', async () => {
    mounts = 0;
    function Kept() {
      const [value, setValue] = useState('a');
      return (
        <Tabs
          aria-label="Giữ"
          keepMounted
          value={value}
          onChange={setValue}
          items={[
            { id: 'a', label: 'A', content: <Counted /> },
            { id: 'b', label: 'B', content: <p>Nội dung B</p> },
            { id: 'c', label: 'C', content: <p>Nội dung C</p> },
          ]}
        />
      );
    }
    render(<Kept />);
    expect(screen.queryByText('Nội dung C')).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByText('Lần dựng 1')).not.toBeVisible();
    expect(screen.getByRole('tabpanel', { name: 'B' })).toHaveTextContent('Nội dung B');
    await userEvent.click(screen.getByRole('tab', { name: 'A' }));
    expect(screen.getByRole('tabpanel', { name: 'A' })).toHaveTextContent('Lần dựng 1');
    expect(screen.getByText('Nội dung B')).not.toBeVisible();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });
});

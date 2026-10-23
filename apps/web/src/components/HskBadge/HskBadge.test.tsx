import { HSK_BANDS } from '@sat/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HskBadge } from './HskBadge';

describe('HskBadge', () => {
  it.each(HSK_BANDS.map((b) => [b, b === '7-9' ? 'HSK 7–9' : `HSK ${b}`] as const))(
    'renders band %s as "%s"',
    (band, label) => {
      render(<HskBadge band={band} />);
      expect(screen.getByText(label)).toBeVisible();
    },
  );

  it('uses the HSK 7 colour for the 7-9 band', () => {
    render(<HskBadge band="7-9" />);
    expect(screen.getByText('HSK 7–9').style.getPropertyValue('--hc')).toBe('var(--hsk7)');
  });

  it('renders a curriculum level 1–9 with its own colour (002 AC-3.1)', () => {
    render(<HskBadge level={8} />);
    const badge = screen.getByText('HSK8');
    expect(badge.style.getPropertyValue('--hc')).toBe('var(--hsk8)');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiCatalog } from './UiCatalog';

describe('UiCatalog', () => {
  it('renders the GV desktop and HV mobile previews', () => {
    render(<UiCatalog />);
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.getAllByRole('tablist')).toHaveLength(2);
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    expect(screen.getAllByRole('table').length).toBeGreaterThanOrEqual(4);
  });
});

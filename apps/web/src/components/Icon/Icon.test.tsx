import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { ICON_PATHS } from './icon-paths';

describe('Icon', () => {
  it('draws the prototype path, hidden from assistive technology', () => {
    const { container } = render(<Icon name="mail" size={16} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '16');
    expect(container.querySelector('path')).toHaveAttribute('d', ICON_PATHS.mail);
  });

  it('has the curriculum icons of the prototype (002: grip, more, copy, up, down, archive, image, text)', () => {
    for (const name of [
      'grip',
      'more',
      'copy',
      'up',
      'down',
      'archive',
      'image',
      'text',
    ] as const) {
      const { container } = render(<Icon name={name} />);
      expect(container.querySelector('path')?.getAttribute('d')).toBe(ICON_PATHS[name]);
    }
  });
});

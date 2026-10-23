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
});

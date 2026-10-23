import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';
import { AVATAR_COLORS, avatarColor } from './avatar-color';

describe('Avatar', () => {
  it('falls back to the initials of the first and last word, named by the full name', () => {
    render(<Avatar name="Nguyễn Văn An" />);
    const avatar = screen.getByRole('img', { name: 'Nguyễn Văn An' });
    expect(avatar).toHaveTextContent('NA');
  });

  it('uses a single initial for a single word and keeps Vietnamese letters', () => {
    render(<Avatar name="đức" />);
    expect(screen.getByRole('img', { name: 'đức' })).toHaveTextContent('Đ');
  });

  it('gets one fixed colour of the prototype palette per name', () => {
    render(<Avatar name="Nguyễn Thị Ánh" />);
    const color = screen
      .getByRole('img', { name: 'Nguyễn Thị Ánh' })
      .style.getPropertyValue('--av');
    expect(AVATAR_COLORS).toContain(color);
    expect(avatarColor('Nguyễn Thị Ánh')).toBe(color);
    expect(avatarColor('Nguyễn Thị Ánh')).toBe(avatarColor('Nguyễn Thị Ánh'));
  });

  it('shows the image, and the initials again if it fails to load', () => {
    const { container } = render(<Avatar name="Lê Lan" src="/a.png" />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('src', '/a.png');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Lê Lan' })).toHaveTextContent('LL');
  });
});

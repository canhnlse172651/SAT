import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioButton } from './AudioButton';

const play = vi.fn();
const pause = vi.fn();

beforeEach(() => {
  play.mockReset().mockResolvedValue(undefined);
  pause.mockReset();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AudioButton', () => {
  it('plays and stops, reflecting the state in aria-pressed', async () => {
    render(<AudioButton src="/a.mp3" />);
    const btn = screen.getByRole('button', { name: 'Nghe phát âm' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(btn);
    expect(play).toHaveBeenCalledOnce();
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(pause).toHaveBeenCalledOnce();
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('returns to idle when the clip ends', async () => {
    const { container } = render(<AudioButton src="/a.mp3" />);
    const btn = screen.getByRole('button', { name: 'Nghe phát âm' });
    await userEvent.click(btn);
    fireEvent.ended(container.querySelector('audio') as HTMLAudioElement);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an error when playback is rejected', async () => {
    play.mockRejectedValue(new Error('NotAllowedError'));
    render(<AudioButton src="/a.mp3" />);
    await userEvent.click(screen.getByRole('button', { name: 'Nghe phát âm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không phát được âm thanh');
  });

  it('shows an error when the file cannot load', () => {
    const { container } = render(<AudioButton src="/missing.mp3" />);
    fireEvent.error(container.querySelector('audio') as HTMLAudioElement);
    expect(screen.getByRole('alert')).toHaveTextContent('Không phát được âm thanh');
  });
});

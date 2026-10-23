import { useRef, useState } from 'react';
import { cx } from '../cx';
import { PlayIcon, StopIcon } from '../icons';
import './AudioButton.css';

export interface AudioButtonProps {
  src: string;
  /** Accessible name; stays constant while playing, `aria-pressed` carries the state. */
  label?: string;
  className?: string;
}

type PlayState = 'idle' | 'playing' | 'error';

export function AudioButton({ src, label = 'Nghe phát âm', className }: AudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayState>('idle');

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state === 'playing') {
      audio.pause();
      audio.currentTime = 0;
      setState('idle');
      return;
    }
    setState('playing');
    Promise.resolve(audio.play()).catch(() => setState('error'));
  };

  return (
    <span className={cx('audio', className)}>
      <button
        type="button"
        className={cx('audio__btn', state === 'error' && 'audio__btn--error')}
        aria-label={label}
        aria-pressed={state === 'playing'}
        onClick={toggle}
      >
        {state === 'playing' ? <StopIcon /> : <PlayIcon />}
      </button>
      {state === 'error' && (
        <span role="alert" className="audio__err">
          Không phát được âm thanh
        </span>
      )}
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onEnded={() => setState('idle')}
        onError={() => setState('error')}
      />
    </span>
  );
}

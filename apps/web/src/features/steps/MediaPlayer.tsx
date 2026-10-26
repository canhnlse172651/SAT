import { STEP_MESSAGES as SM } from '@sat/shared';
import { useRef, useState } from 'react';
import { Button } from '../../components';
import { pauseOthers } from './viewer-prefs';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5] as const;
const speedLabel = (s: number) => `${String(s).replace('.', ',')}×`;

/**
 * AC-14.2: video / audio in the step — play / pause, seek bar, duration (native controls), speeds 0,5×–1,5× and, for
 * video, fullscreen; never autoplay, no download button. AC-14.3: starting one pauses the others. AC-14.6: a block that
 * cannot load shows its own error.
 */
export function MediaPlayer({
  kind,
  src,
  label,
  onRetry,
}: {
  kind: 'video' | 'audio';
  src: string;
  label: string;
  onRetry?: () => void;
}) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="st-blockerr" role="alert">
        <span>{SM.blockFailed}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFailed(false);
            onRetry?.();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const common = {
    ref,
    src,
    controls: true,
    preload: 'metadata' as const,
    controlsList: 'nodownload noplaybackrate',
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    onPlay: () => pauseOthers(ref.current),
    onError: () => setFailed(true),
    'aria-label': label,
  };
  return (
    <div className={`st-media st-media--${kind}`}>
      {kind === 'video' ? (
        <video {...common} playsInline disablePictureInPicture className="st-media__video" />
      ) : (
        <audio {...common} className="st-media__audio" />
      )}
      <label className="st-media__speed">
        <span className="sr-only">Tốc độ phát</span>
        <select
          className="input"
          aria-label="Tốc độ phát"
          value={speed}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSpeed(v);
            if (ref.current) ref.current.playbackRate = v;
          }}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {speedLabel(s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

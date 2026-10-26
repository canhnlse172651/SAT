import { STEP_MESSAGES as SM } from '@sat/shared';
import { useEffect, useRef, useState } from 'react';
import { YOUTUBE_ORIGIN, pauseOthers } from './viewer-prefs';

/**
 * AC-18.1, AC-18.3: a YouTube video (privacy-enhanced embed, no autoplay; speed and fullscreen are YouTube's own player
 * controls). A video that was removed, made private or cannot be embedded shows "Video không còn khả dụng…".
 */
export function YouTubePlayer({ id, title }: { id: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YOUTUBE_ORIGIN || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string; info?: { playerState?: number } | number } | null;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data?.event === 'onError') setGone(true);
      const state =
        data?.event === 'onStateChange'
          ? data.info
          : typeof data?.info === 'object'
            ? data.info?.playerState
            : undefined;
      if (state === 1) pauseOthers(frame.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (gone) {
    return (
      <div className="st-blockerr" role="alert">
        {SM.youtubeGone}
      </div>
    );
  }
  return (
    <iframe
      ref={frame}
      data-yt=""
      className="st-yt st-yt--view"
      title={title}
      src={`${YOUTUBE_ORIGIN}/embed/${id}?enablejsapi=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
      allow="encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      onLoad={() =>
        frame.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening', id, channel: 'widget' }),
          YOUTUBE_ORIGIN,
        )
      }
    />
  );
}

/* S03 helpers that are not components: one medium at a time (AC-14.3) and the dialogue switches (AC-15.4). */

const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** AC-14.3: pauses every other video / audio of the page, YouTube embeds included. */
export function pauseOthers(except: Element | null): void {
  for (const m of document.querySelectorAll<HTMLMediaElement>('video, audio')) {
    if (m !== except && !m.paused) m.pause();
  }
  for (const f of document.querySelectorAll<HTMLIFrameElement>('iframe[data-yt]')) {
    if (f === except) continue;
    f.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
      YT_ORIGIN,
    );
  }
}

export const YOUTUBE_ORIGIN = YT_ORIGIN;

export interface DialoguePrefs {
  pinyin: boolean;
  translation: boolean;
}

const PREFS_KEY = 'sat.step.dialogue';

/** AC-15.4: both on by default; kept for the HV's later views on the same device. */
export function readDialoguePrefs(): DialoguePrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const v = raw ? (JSON.parse(raw) as Partial<DialoguePrefs>) : {};
    return { pinyin: v.pinyin !== false, translation: v.translation !== false };
  } catch {
    return { pinyin: true, translation: true };
  }
}

export function writeDialoguePrefs(prefs: DialoguePrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode / blocked storage: the switch still works for this view.
  }
}

/** "Tải về" of a signed HV link or a GV file link. */
export const downloadUrl = (url: string): string =>
  url.includes('?') ? `${url}&download=1` : `${url}?download=1`;

/** DOCX / PPTX text pages: the signed HV route, or the GV preview route (T21). */
export function previewUrl(url: string, fileId: string): string {
  if (url.startsWith('/api/learn/')) {
    const [path, query = ''] = url.split('?');
    return `${path}/preview?${query}`;
  }
  return `/api/steps/files/${fileId}/preview`;
}

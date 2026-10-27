/** Web fonts of DESIGN.md (UI, display, Hanzi); `display=swap` shows the fallback font until they arrive. */
export const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Newsreader:wght@500;600&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;600;700&display=swap';

/**
 * Adds the font stylesheet once the page has loaded. Written in index.html it held back the app's scripts until the font
 * host answered; added earlier from script it still delayed the page's load and took bandwidth from the app and its data
 * on a phone network (NFR-1 / NFR-3 of 004). The fallback font shows until then.
 */
export function loadFonts(doc: Document = document): void {
  const add = () => {
    if (doc.head.querySelector(`link[rel="stylesheet"][href="${FONTS_URL}"]`)) return;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS_URL;
    doc.head.append(link);
  };
  if (doc.readyState === 'complete') add();
  else doc.defaultView?.addEventListener('load', add, { once: true });
}

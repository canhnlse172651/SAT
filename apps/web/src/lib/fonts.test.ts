import { afterEach, describe, expect, it } from 'vitest';
import { FONTS_URL, loadFonts } from './fonts';

const links = () => document.head.querySelectorAll(`link[rel="stylesheet"][href="${FONTS_URL}"]`);

describe('loadFonts', () => {
  afterEach(() => {
    for (const l of links()) l.remove();
    Reflect.deleteProperty(document, 'readyState');
  });

  it('adds the web-font stylesheet once, from script, so it never blocks the app from starting', () => {
    expect(FONTS_URL).toMatch(
      /^https:\/\/fonts\.googleapis\.com\/css2\?.*Be\+Vietnam\+Pro.*Noto\+Sans\+SC.*display=swap$/,
    );
    loadFonts();
    loadFonts();
    expect(links()).toHaveLength(1);
  });

  it('waits for the page to finish loading, so the fonts never compete with the app (NFR-3 of 004)', () => {
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
    loadFonts();
    expect(links()).toHaveLength(0);
    window.dispatchEvent(new Event('load'));
    expect(links()).toHaveLength(1);
  });
});

import { unzipSync } from 'fflate';

/*
 * AC-5.4: the bytes must match the format of the extension; AC-6.6: a file of the right format that cannot be read for
 * viewing (a broken or encrypted document) is "Không xử lý được tệp". DOCX / PPTX text is extracted per page / slide for
 * the inline viewer (AC-14.5) — a DOCX page is what lies between page breaks, or ~3 000 characters when it has none.
 */

const ascii = (b: Uint8Array, at: number, text: string) =>
  [...text].every((c, i) => b[at + i] === c.charCodeAt(0));

/** Whether the first bytes are those of `ext` (lower-case extension). */
export function sniffMatches(ext: string, head: Uint8Array): boolean {
  switch (ext) {
    case 'mp4':
    case 'mov':
    case 'm4a':
      return ascii(head, 4, 'ftyp') || ascii(head, 4, 'moov') || ascii(head, 4, 'mdat');
    case 'webm':
      return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    case 'pdf': {
      const start = new TextDecoder('latin1').decode(head.subarray(0, 1024));
      return start.includes('%PDF-');
    }
    case 'docx':
    case 'pptx':
      return ascii(head, 0, 'PK\u0003\u0004');
    case 'jpg':
    case 'jpeg':
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'png':
      return ascii(head, 0, '\u0089PNG\r\n\u001a\n');
    case 'webp':
      return ascii(head, 0, 'RIFF') && ascii(head, 8, 'WEBP');
    case 'gif':
      return ascii(head, 0, 'GIF87a') || ascii(head, 0, 'GIF89a');
    case 'mp3':
      return ascii(head, 0, 'ID3') || (head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0);
    case 'wav':
      return ascii(head, 0, 'RIFF') && ascii(head, 8, 'WAVE');
    default:
      return false;
  }
}

export class UnprocessableFileError extends Error {}

const MAX_PREVIEW_CHARS = 1_000_000;
const DOCX_PAGE_CHARS = 3000;

const decodeXml = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    const k = e.toLowerCase();
    if (k === 'amp') return '&';
    if (k === 'lt') return '<';
    if (k === 'gt') return '>';
    if (k === 'quot') return '"';
    if (k === 'apos') return "'";
    const code = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : '';
  });

/** Text of the runs (`<w:t>` / `<a:t>`) of an XML fragment. */
const runs = (xml: string, tag: 'w:t' | 'a:t') =>
  [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g'))]
    .map((m) => decodeXml(m[1] ?? ''))
    .join('');

function unzip(bytes: Uint8Array, wanted: (name: string) => boolean): Record<string, Uint8Array> {
  try {
    return unzipSync(bytes, { filter: (f) => wanted(f.name) });
  } catch {
    throw new UnprocessableFileError('broken zip');
  }
}

function capped(pages: string[][]): string[][] {
  let total = 0;
  const out: string[][] = [];
  for (const page of pages) {
    const kept: string[] = [];
    for (const line of page) {
      if (total + line.length > MAX_PREVIEW_CHARS) return [...out, kept];
      total += line.length;
      kept.push(line);
    }
    out.push(kept);
  }
  return out;
}

/** Paragraphs of a DOCX grouped into pages. */
export function docxPages(bytes: Uint8Array): string[][] {
  const files = unzip(bytes, (n) => n === 'word/document.xml');
  const xml = files['word/document.xml'];
  if (!xml) throw new UnprocessableFileError('no document.xml');
  const doc = new TextDecoder().decode(xml);
  const body = /<w:body>([\s\S]*)<\/w:body>/.exec(doc)?.[1];
  if (body === undefined) throw new UnprocessableFileError('no body');
  const pages: string[][] = [[]];
  let explicit = false;
  for (const para of body.split(/<\/w:p>/)) {
    const breakBefore = /<w:pageBreakBefore(?:\s+w:val="(?:1|true|on)")?\s*\/>/.test(para);
    const parts = para.split(/<w:br\b[^>]*w:type="page"[^>]*\/>|<w:lastRenderedPageBreak\s*\/>/);
    if (breakBefore && (pages.at(-1)?.length ?? 0) > 0) {
      pages.push([]);
      explicit = true;
    }
    parts.forEach((part, i) => {
      if (i > 0) {
        pages.push([]);
        explicit = true;
      }
      const text = runs(part, 'w:t');
      if (text.trim()) pages.at(-1)?.push(text);
    });
  }
  let out = pages.filter((p, i) => p.length || i === 0);
  if (!explicit) {
    // No page breaks: pages of about 3 000 characters, never splitting a paragraph.
    out = [[]];
    let size = 0;
    for (const line of pages.flat()) {
      if (size > 0 && size + line.length > DOCX_PAGE_CHARS) {
        out.push([]);
        size = 0;
      }
      out.at(-1)?.push(line);
      size += line.length;
    }
  }
  return capped(out);
}

/** Paragraphs of each slide of a PPTX, in slide order. */
export function pptxPages(bytes: Uint8Array): string[][] {
  const files = unzip(bytes, (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const names = Object.keys(files).sort(
    (a, b) => Number(/(\d+)\.xml$/.exec(a)?.[1]) - Number(/(\d+)\.xml$/.exec(b)?.[1]),
  );
  if (!names.length) throw new UnprocessableFileError('no slides');
  return capped(
    names.map((n) => {
      const xml = new TextDecoder().decode(files[n]);
      return xml
        .split(/<\/a:p>/)
        .map((p) => runs(p, 'a:t'))
        .filter((t) => t.trim());
    }),
  );
}

/** A PDF that pdf.js could not open without a password, or that has no page tree. */
export function checkPdf(bytes: Uint8Array): void {
  const tail = new TextDecoder('latin1').decode(bytes.subarray(Math.max(0, bytes.length - 4096)));
  const text = new TextDecoder('latin1').decode(bytes);
  if (/\/Encrypt\s/.test(tail) || /\/Encrypt\s/.test(text.slice(0, 4096))) {
    throw new UnprocessableFileError('encrypted pdf');
  }
  if (!/\/Type\s*\/Page\b/.test(text) || !text.includes('%%EOF')) {
    throw new UnprocessableFileError('no pages');
  }
}

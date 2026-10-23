import { strToU8, unzipSync, zipSync } from 'fflate';

/*
 * Minimal .xlsx reader/writer for the student import (REQ-9). Reads only the first worksheet
 * (shared strings, inline strings, cached formula results); writes the import template.
 */

export class InvalidXlsxError extends Error {
  constructor(message = 'Not a readable .xlsx file') {
    super(message);
    this.name = 'InvalidXlsxError';
  }
}

/** A worksheet row: its 1-based row number in the file and its cell texts by 0-based column. */
export interface SheetRow {
  line: number;
  cells: string[];
}

const MAX_ENTRY_BYTES = 20 * 1024 * 1024;

const decode = (s: string) =>
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

/** Text of every `<t>` in a fragment, skipping phonetic runs (`<rPh>`). */
const textOf = (xml: string) =>
  [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((m) => decode(m[1] ?? ''))
    .join('');

const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

const columnIndex = (ref: string): number => {
  const letters = /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? 'A';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** Rows of the first worksheet. Throws `InvalidXlsxError` for anything that is not a readable .xlsx. */
export function readFirstSheet(bytes: Uint8Array): SheetRow[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (f) =>
        f.originalSize <= MAX_ENTRY_BYTES &&
        /^(xl\/.*\.xml|xl\/_rels\/workbook\.xml\.rels)$/.test(f.name),
    });
  } catch {
    throw new InvalidXlsxError();
  }
  const text = (name: string) => {
    const f = files[name];
    return f ? new TextDecoder().decode(f) : undefined;
  };
  const workbook = text('xl/workbook.xml');
  const rels = text('xl/_rels/workbook.xml.rels');
  if (!workbook || !rels) throw new InvalidXlsxError();

  const firstSheet = /<sheet\b[^>]*>/.exec(workbook)?.[0];
  const relId = firstSheet && attr(firstSheet, 'r:id');
  const rel = relId
    ? [...rels.matchAll(/<Relationship\b[^>]*>/g)]
        .map((m) => m[0])
        .find((r) => attr(r, 'Id') === relId)
    : undefined;
  const target = rel && attr(rel, 'Target');
  if (!target) throw new InvalidXlsxError();
  const sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  const sheet = text(sheetPath);
  if (!sheet) throw new InvalidXlsxError();

  const shared = [
    ...(text('xl/sharedStrings.xml') ?? '').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g),
  ].map((m) => textOf(m[1] ?? ''));

  const rows: SheetRow[] = [];
  let fallbackLine = 0;
  for (const rowMatch of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    fallbackLine++;
    const line = Number(attr(rowMatch[1] ?? '', 'r') ?? fallbackLine) || fallbackLine;
    fallbackLine = line;
    const cells: string[] = [];
    let nextCol = 0;
    for (const cellMatch of (rowMatch[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const head = cellMatch[1] ?? '';
      const body = cellMatch[2] ?? '';
      const ref = attr(head, 'r');
      const col = ref ? columnIndex(ref) : nextCol;
      nextCol = col + 1;
      const type = attr(head, 't');
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1];
      // Shared string, inline string, boolean, error (empty), else the (cached) value as written.
      cells[col] =
        type === 's'
          ? (shared[Number(v)] ?? '')
          : type === 'inlineStr'
            ? textOf(body)
            : type === 'b'
              ? v === '1'
                ? 'TRUE'
                : v === '0'
                  ? 'FALSE'
                  : ''
              : type === 'e'
                ? ''
                : v !== undefined
                  ? decode(v)
                  : '';
    }
    rows.push({ line, cells: Array.from(cells, (c) => c ?? '') });
  }
  return rows;
}

/* ---------- writer (template) ---------- */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const colName = (i: number) => String.fromCharCode(65 + i);

function sheetXml(rows: string[][], options: { cols?: string; headerStyle?: number } = {}): string {
  const body = rows
    .map(
      (cells, r) =>
        `<row r="${r + 1}">${cells
          .map(
            (c, i) =>
              `<c r="${colName(i)}${r + 1}" t="inlineStr"${r === 0 && options.headerStyle ? ` s="${options.headerStyle}"` : ''}><is><t xml:space="preserve">${esc(c)}</t></is></c>`,
          )
          .join('')}</row>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${options.cols ?? ''}<sheetData>${body}</sheetData></worksheet>`;
}

/** A workbook whose first sheet is `first` and second sheet is `second` (each: name, rows, column XML). */
export function writeWorkbook(
  sheets: { name: string; rows: string[][]; cols?: string }[],
): Uint8Array {
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('')}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        '',
      )}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    // Style 1 = text format "@" (numFmtId 49), style 2 = bold header.
    'xl/styles.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`),
  };
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(
      sheetXml(s.rows, { ...(s.cols ? { cols: s.cols } : {}), headerStyle: 2 }),
    );
  });
  return zipSync(files, { level: 6 });
}

export const TEMPLATE_HEADERS = ['Họ tên', 'Email', 'Số điện thoại', 'Ghi chú'] as const;

/** AC-9.1: one header row on the first sheet (phone column formatted as text) and a "Hướng dẫn" sheet. */
export function importTemplate(): Uint8Array {
  return writeWorkbook([
    {
      name: 'Học viên',
      rows: [[...TEMPLATE_HEADERS]],
      cols: '<cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="32" customWidth="1"/><col min="3" max="3" width="18" style="1" customWidth="1"/><col min="4" max="4" width="36" customWidth="1"/></cols>',
    },
    {
      name: 'Hướng dẫn',
      rows: [
        ['Cột', 'Bắt buộc', 'Quy tắc'],
        ['Họ tên', 'Có', '2–100 ký tự. Có thể có dấu tiếng Việt hoặc chữ Hán.'],
        [
          'Email',
          'Có',
          'Đúng định dạng địa chỉ thư, chỉ gồm ký tự không dấu (ASCII), tối đa 254 ký tự; không trùng với email đã dùng trên SAT hay dòng khác trong tệp. Học viên đăng nhập bằng email này.',
        ],
        [
          'Số điện thoại',
          'Không',
          '9–15 chữ số, có thể bắt đầu bằng dấu +. Cột này định dạng văn bản để giữ số 0 ở đầu.',
        ],
        ['Ghi chú', 'Không', 'Tối đa 500 ký tự. Chỉ giáo viên thấy.'],
        [
          '',
          '',
          'Mỗi tệp tối đa 500 dòng dữ liệu, tối đa 2 MB. Chỉ trang tính đầu tiên được đọc; dòng trống bị bỏ qua.',
        ],
        [
          '',
          '',
          'Học viên được thêm ở trạng thái Chưa kích hoạt — chỉ đăng nhập được sau khi bạn bấm Kích hoạt ở danh sách học viên.',
        ],
      ],
      cols: '<cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="10" customWidth="1"/><col min="3" max="3" width="100" customWidth="1"/></cols>',
    },
  ]);
}
